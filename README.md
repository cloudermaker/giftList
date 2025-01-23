This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Updating DB

We are using prisma as ORM.

- npx prisma format
- npx prisma db push (no rollback)

## Todo

- Add a proxy to hide easily the api calls (can be used for caching ? And with bearer)
- Ajouter anniversaire en base + quand créé
- Afficher anniversaire sur page principale
- Ajouter calendrier sur la page
- Changer la couleur des boutons + fond d'écran
