import eslint from '@eslint/js'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import prettierPlugin from 'eslint-plugin-prettier/recommended'

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  eslint.configs.recommended,
  eslintPluginUnicorn.configs['flat/recommended'],
  // should be the last
  prettierPlugin,
]
