import type { GraphNode } from './generate';

const builtinTransforms: Record<string, (node: GraphNode[]) => GraphNode[]> = {
  compact(nodes: GraphNode[]) {
    return nodes.map((node) => {
      if (typeof node === 'string') {
        return compactString(node);
      }
      if ('content' in node) {
        node.content = compactString(node.content);
      }
      return node;
    });
  },
};

function compactString(str: string) {
  return str
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join(' ');
}

export function applyTransforms(
  transforms: string[] | undefined,
  nodes: GraphNode[],
) {
  if (!transforms?.length) {
    return nodes;
  }
  for (const name of transforms) {
    const trans = builtinTransforms[name];
    if (trans) {
      nodes = trans(nodes);
    }
  }
  return nodes;
}
