import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import architectureRules from './eslint-rules/architecture.js';
import strictTypingRules from './eslint-rules/strict-typing.js';
import exclusions from './config-modules/exclusions.js';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...architectureRules.rules, // Wait, I defined it as object path in file
      ...strictTypingRules,
      ...exclusions,
    },
  },
  // Architecture enforcement block for UI components
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      ...architectureRules,
    },
  },
  // Strict typing block for everything
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...strictTypingRules,
    },
  },
);
