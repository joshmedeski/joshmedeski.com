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

## Environment variables

- `FATHOM_API_KEY` — Fathom Analytics personal API token (create at
  https://app.usefathom.com/api). Used at build time to rank posts by lifetime
  pageviews on `/posts/ranked`. Set it in the Netlify build environment and, for
  local builds, in a `.env` file. Without it the page still builds (view counts
  show `0`).
