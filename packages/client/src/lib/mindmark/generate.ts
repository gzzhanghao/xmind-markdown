import type { TopicData } from 'xmind-model/types/models/topic';

import { applyTransforms } from './transform';

export type GraphNode =
  | string
  | SectionNode
  | ElementNode
  | CodeBlockNode
  | ListItemNode
  | HeadingNode;

export interface SectionNode {
  type: 'section';
  content: string;
  children: GraphNode[];
}

export interface ElementNode {
  type: 'element';
  tagName: string;
  openingTag: string;
  children: GraphNode[];
}

export interface CodeBlockNode {
  type: 'code-block';
  openingTag: string;
  children: GraphNode[];
}

export interface ListItemNode {
  type: 'list-item';
  index?: string;
  content: string;
  children: GraphNode[];
}

export interface HeadingNode {
  type: 'heading';
  content: string;
  children: GraphNode[];
}

interface RenderState {
  headingLevel?: number;
}

interface PrintState {
  indent?: number;
}

type RenderNode = string | RenderNode[];

interface LabelData {
  text: string;
}

export function genMessage(topic: TopicData) {
  const nodes = buildMessageContent(topic);
  const lines = genNodeList(nodes);
  return printLines(lines).join('\n');
}

function buildMessageContent(topic: TopicData): GraphNode[] {
  let children =
    topic.children?.attached?.flatMap((child) => buildMessageContent(child)) ||
    [];

  if (topic.title.startsWith('//')) {
    return children;
  }

  const labels = (topic.labels as unknown as LabelData[] | undefined)?.map(
    (label) => label.text,
  );

  if (/^<\w[^>]*>$/.test(topic.title)) {
    const match = topic.title.match(/<(?<name>\w[^> ]*)/);
    return applyTransforms(labels, [
      {
        type: 'element',
        tagName: match!.groups!.name,
        openingTag: topic.title,
        children,
      },
    ]);
  }

  if (/^```/.test(topic.title)) {
    return applyTransforms(labels, [
      {
        type: 'code-block',
        openingTag: topic.title,
        children,
      },
    ]);
  }

  let content = topic.title;

  if (
    children.length === 1 &&
    typeof children[0] === 'string' &&
    !children[0].includes('\n')
  ) {
    content = `${content} ${children[0]}`;
    children = [];
  }

  const orderedMatch = content.match(/^(?<index>\d+)\. /);

  if (orderedMatch || content.startsWith('* ') || content.startsWith('- ')) {
    const match = content.match(/^(?<index>\d+)\. /);
    return applyTransforms(labels, [
      {
        type: 'list-item',
        index: orderedMatch?.groups?.index,
        content: content.slice(match?.[0]?.length ?? 2).trim(),
        children,
      },
    ]);
  }

  if (content.startsWith('# ')) {
    return applyTransforms(labels, [
      {
        type: 'heading',
        content: content.slice(2).trim(),
        children,
      },
    ]);
  }

  if (children.length) {
    return applyTransforms(labels, [
      {
        type: 'section',
        content,
        children,
      },
    ]);
  }

  return applyTransforms(labels, [content]);
}

function genNodeList(list: GraphNode[], state: RenderState = {}) {
  return list.flatMap((item, index) => {
    const result = genNode(item, state);
    if (!index) {
      return result;
    }
    const prev = list[index - 1];
    if (typeof item === 'string') {
      if (typeof prev !== 'string') {
        return ['', ...result];
      }
      return result;
    }
    if (typeof prev === 'string') {
      return ['', ...result];
    }
    if (item.type !== 'list-item') {
      return ['', ...result];
    }
    if (item.type === 'list-item') {
      if (prev.type !== 'list-item') {
        return ['', ...result];
      }
      if (!!item.index !== !!prev.index) {
        return ['', ...result];
      }
      return result;
    }
    return result;
  });
}

function genNode(node: GraphNode, state: RenderState = {}): RenderNode[] {
  if (typeof node === 'string') {
    return [node];
  }
  switch (node.type) {
    case 'section': {
      return [node.content, ...genNodeList(node.children, state)];
    }
    case 'element':
      return [
        node.openingTag,
        ...genNodeList(node.children, state),
        `</${node.tagName}>`,
      ];
    case 'code-block':
      return [node.openingTag, ...genNodeList(node.children, state), '```'];
    case 'list-item': {
      return [
        `${node.index ? `${node.index}.` : '-'} ${node.content}`,
        genNodeList(node.children, state),
      ];
    }
    case 'heading': {
      const headingLevel = state.headingLevel ?? 1;
      const childState = { ...state, headingLevel: headingLevel + 1 };
      return [
        `${'#'.repeat(headingLevel)} ${node.content}`,
        '',
        ...genNodeList(node.children, childState),
      ];
    }
  }
}

function printLines(node: RenderNode, state: PrintState = {}): string[] {
  const indent = state.indent ?? -1;
  if (Array.isArray(node)) {
    const nextState = { indent: indent + 1 };
    return node.flatMap((item) => printLines(item, nextState));
  }
  const lines = node.split('\n');
  if (indent <= 0) {
    return lines;
  }
  return lines.map((line) => '  '.repeat(indent) + line);
}
