import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  })
]
