<script setup lang="ts">
import { asyncComputed } from '@vueuse/core';
import { ref, shallowRef, watch } from 'vue';
import type { TopicData } from 'xmind-model/types/models/topic';

import { buildXMindFile } from '../lib/xmind/build';

export type XMindActionType = 'open-file' | 'fit-map' | 'zoom' | 'switch-sheet';

const props = withDefaults(
  defineProps<{
    rootTopic?: TopicData;
    domain?: string;
  }>(),
  {
    rootTopic: undefined,
    domain: 'www.xmind.app',
  },
);

const emit = defineEmits<{
  (e: 'sheets-load', info: any): void;
  (e: 'sheet-switch', sheetId: string): void;
  (e: 'map-ready', isReady: boolean): void;
  (e: 'zoom-change', zoom: number): void;
}>();

const iframeRef = ref<HTMLIFrameElement>();
const readyMsgPort = shallowRef<MessagePort>();

const xmindFile = asyncComputed(
  () => props.rootTopic && buildXMindFile(props.rootTopic),
);

watch(
  [readyMsgPort, xmindFile],
  async ([port, file]) => {
    if (port && file) {
      port.postMessage(['open-file', file, 'void']);
    }
  },
  {
    immediate: true,
  },
);

function handleMapReady() {
  readyMsgPort.value?.postMessage(['zoom', 80, 'void']);
}

function handleIframeLoad() {
  const channel = new MessageChannel();

  channel.port1.onmessage = (event) => {
    if (event.data[0] === 'channel-ready') {
      readyMsgPort.value = channel.port1;
      return;
    }
    if (Array.isArray(event.data) && event.data[0] === 'event') {
      (emit as any)(...event.data.slice(1));
      if (event.data[1] === 'map-ready') {
        handleMapReady();
      }
    }
  };

  iframeRef.value?.contentWindow?.postMessage(
    ['setup-channel', { port: channel.port2 }],
    `https://${props.domain}`,
    [channel.port2],
  );
}

defineExpose({
  invoke,
});

function invoke(type: XMindActionType, args: unknown) {
  readyMsgPort.value?.postMessage([type, args, 'xmind-embed-viewer#1']);
}
</script>

<template>
  <iframe
    ref="iframeRef"
    :src="`https://${props.domain}/embed-viewer`"
    frameborder="0"
    scrolling="no"
    allowfullscreen
    crossorigin="anonymous"
    @load="handleIframeLoad"
  />
</template>
