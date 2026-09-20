import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// O `no-unused-vars` do core do ESLint não analisa JSX: o nome de `<motion.div>`
// é um JSXMemberExpression e nunca conta como leitura de `motion`, então todo
// import usado apenas dentro de JSX era reportado como morto. Componentes com
// inicial maiúscula escapavam pelo `varsIgnorePattern`, e `motion` (minúsculo)
// não. Este plugin local marca a raiz do nome do elemento como usada — mesmo
// papel do `react/jsx-uses-vars`, sem puxar o eslint-plugin-react inteiro.
const jsxScope = {
  rules: {
    'jsx-uses-vars': {
      meta: { schema: [] },
      create(context) {
        return {
          JSXOpeningElement(node) {
            let root = node.name
            while (root.type === 'JSXMemberExpression') root = root.object
            if (root.type === 'JSXIdentifier') {
              context.sourceCode.markVariableAsUsed(root.name, root)
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'jsx-scope': jsxScope,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'jsx-scope/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
