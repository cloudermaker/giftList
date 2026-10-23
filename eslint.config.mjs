import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
    { ignores: ['.next/**', '.next-e2e/**', 'node_modules/**', 'public/**', 'test-results/**', 'next-env.d.ts'] },
    ...compat.extends('next/core-web-vitals')
];
export default config;
