import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
  allConfig: {},
})

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]
