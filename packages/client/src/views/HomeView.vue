<script setup lang="ts">
import { useDraggable, useDropZone, useEventListener } from '@vueuse/core';
import JSZip from 'jszip';
import { computed, ref, shallowRef } from 'vue';
import type { SheetData } from 'xmind-model/types/models/sheet';
import type { TopicData } from 'xmind-model/types/models/topic';

import XMindViewer from '../components/XMindViewer.vue';
import { genMessage } from '../lib/mindmark/generate';

const textareaRef = ref<HTMLTextAreaElement>();
const dropZoneRef = ref<HTMLElement>();
const dragRef = ref<HTMLElement>();
const rootTopic = shallowRef<TopicData>();

const panelSize = ref(40);

useDraggable(dragRef, {
  axis: 'x',
  onMove(position) {
    panelSize.value = (position.x / window.innerWidth) * 100;
  },
});

const messageContent = computed(() => {
  if (!rootTopic.value) {
    return '';
  }
  return genMessage(rootTopic.value);
});

useEventListener('paste', async (event) => {
  event.preventDefault();
  const html = event.clipboardData?.getData('text/html');
  if (html && handleInputHTML(html)) {
    return;
  }
  if (await handleInputFiles(event.clipboardData?.files)) {
    return;
  }
});

const { isOverDropZone } = useDropZone(dropZoneRef, {
  preventDefaultForUnhandled: true,
  onDrop: handleInputFiles,
});

function handleInputHTML(html: string) {
  try {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const dataEl = dom.querySelector('[data-mind-map]');
    if (!dataEl) {
      return false;
    }
    const content = dataEl.getAttribute('data-mind-map');
    if (!content) {
      return false;
    }
    const data = JSON.parse(content);
    const root = data[0]?.data;
    if (!root) {
      return false;
    }
    rootTopic.value = root;
    return true;
  } catch {
    return false;
  }
}

async function handleInputFiles(files?: FileList | File[] | null) {
  if (!files?.length) {
    return false;
  }
  for (const file of files) {
    if (!file.name.endsWith('.xmind')) {
      continue;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const content = await zip.file('content.json')?.async('string');
      if (!content) {
        continue;
      }
      const data: SheetData[] = JSON.parse(content);
      const root = data[0].rootTopic;
      if (!root) {
        continue;
      }
      rootTopic.value = root;
      return true;
    } catch {
      // noop
    }
  }
  return false;
}
</script>

<template>
  <div
    ref="dropZoneRef"
    class="fixed inset-0 flex items-stretch justify-center"
    :class="{ 'bg-blue-100': isOverDropZone }"
  >
    <XMindViewer
      v-show="rootTopic"
      class="flex-none w-40% b-r shadow-2xl"
      :style="{ width: `${panelSize}%` }"
      :root-topic="rootTopic"
    />
    <textarea
      v-if="messageContent"
      ref="textareaRef"
      readonly
      class="flex-1 w-1 p-2 pl-3 outline-none ws-pre font-mono text-3 lh-5"
      :value="messageContent"
    />
    <div
      v-if="!rootTopic"
      class="self-center"
    >
      Drop / paste your XMind file here
    </div>
  </div>
</template>
