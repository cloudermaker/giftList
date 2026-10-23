import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
    { ignores: ['.next/**', '.next-e2e/**', 'node_modules/**', 'public/**', 'test-results/**', 'next-env.d.ts'] },
    ...nextCoreWebVitals,
    {
        rules: {
            // Règles React Compiler (non utilisé ici) et rechargement complet voulu après connexion (cookie de session)
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/static-components': 'off',
            '@next/next/no-location-assign-relative-destination': 'off'
        }
    }
];

export default config;
