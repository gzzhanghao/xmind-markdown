import JSZip from 'jszip';
import { v4 } from 'uuid';
import type { TopicData } from 'xmind-model/types/models/topic';

import { XMIND_XML_CONTENTS } from '../../constants/xmind';

import { normalizeXMindTopic } from './normalize';

export function buildXMindFile(topic: TopicData) {
  const rootId = v4();
  const zip = new JSZip();

  const rootTopic = {
    ...(normalizeXMindTopic(topic) as any),
    id: 'root',
    structureClass: 'org.xmind.ui.logic.right',
  };

  zip.file(
    'content.json',
    JSON.stringify([
      {
        id: rootId,
        title: 'Sheet 1',
        rootTopic,
      },
    ]),
  );

  zip.file('content.xml', XMIND_XML_CONTENTS);

  zip.file(
    'manifest.json',
    JSON.stringify({
      'file-entries': {
        'content.json': {},
        'metadata.json': {},
      },
    }),
  );

  zip.file('metadata.json', '{}');

  return zip.generateAsync({ type: 'arraybuffer' });
}
