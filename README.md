# Josh Medeski's Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/b324b49b-7ff0-4626-b790-fd1c061a2517/deploy-status)](https://app.netlify.com/sites/joshmedeski/deploys)

- Posts
- Videos
- Uses

## Technology

- Astro for static site generation
- Tailwind CSS for styling
- Preact for interaction
- Depolyed on Netlify

## Ranked posts stats

`/posts/ranked` ranks posts by lifetime pageviews from a **committed snapshot**
at `src/data/pageviews.json`, so normal builds never change the numbers.

Refresh the snapshot manually (not automatic):

```sh
pnpm refresh:stats
```

This fetches Fathom, rewrites `src/data/pageviews.json` (with a `fetchedAt`
timestamp shown on the page), and you commit the result. Requires
`FATHOM_API_KEY` in a local `.env` file — a Fathom personal API token from
https://app.usefathom.com/api. The build itself needs no Fathom access.
