import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
    { ignores: ['.next/**', '.next-e2e/**', 'node_modules/**', 'public/**', 'test-results/**', 'next-env.d.ts'] },
    ...nextCoreWebVitals,
    {
        rules: {
            // Lectures localStorage/cookie après montage (anti-hydratation) et chargements à l'ouverture : voulus
            'react-hooks/set-state-in-effect': 'off',
            // Rechargement complet voulu après connexion (cookie de session)
            '@next/next/no-location-assign-relative-destination': 'off'
        }
    }
];

export default config;
