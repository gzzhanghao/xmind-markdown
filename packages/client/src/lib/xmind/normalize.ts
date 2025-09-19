import type { TopicData } from 'xmind-model/types/models/topic';

export type NormalizedTopic = Omit<TopicData, 'labels' | 'children'> & {
  labels?: string[];
  children?: Record<string, NormalizedTopic[]>;
};

export function normalizeXMindTopic(topic: TopicData): NormalizedTopic {
  const labels = normalizeTopicLabels(topic.labels);
  if (!topic.children) {
    return { ...topic, labels, children: undefined };
  }
  const newChildren: Record<string, NormalizedTopic[]> = {};
  for (const [key, children] of Object.entries(topic.children)) {
    newChildren[key] = children.map(normalizeXMindTopic);
  }
  return { ...topic, labels, children: newChildren };
}

function normalizeTopicLabels(labels: any): string[] | undefined {
  if (!labels) {
    return;
  }
  if (!Array.isArray(labels)) {
    return normalizeTopicLabels([labels]);
  }
  return labels.map((label) => {
    if (!label || typeof label !== 'object') {
      return label;
    }
    return label.text;
  });
}
