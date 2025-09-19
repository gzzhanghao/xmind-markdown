import vuePrettier from '@vue/eslint-config-prettier';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import pluginImport from 'eslint-plugin-import';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**'],
  },
  {
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  pluginOxlint.configs['flat/recommended'],
  vuePrettier,
  {
    rules: {
      'arrow-body-style': ['warn', 'as-needed'],
      'object-shorthand': ['warn', 'properties'],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
