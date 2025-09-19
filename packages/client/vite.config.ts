import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  base: '/xmind-markdown/',
  plugins: [vue(), vueJsx(), vueDevTools(), UnoCSS()],
});
