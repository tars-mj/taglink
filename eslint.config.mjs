import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'e2e/.auth/**',
    ],
  },
  {
    rules: {
      // Relax these rules to warnings instead of errors
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
]

export default eslintConfig
