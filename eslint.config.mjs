import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**/*', '.next/**/*'],
    plugins: {
      next: nextPlugin,
    },
    rules: nextPlugin.configs['core-web-vitals'].rules,
  },
];
