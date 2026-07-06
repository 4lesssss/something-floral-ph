# Something Floral PH — React + Node.js

Full-stack version of the Something Floral PH pop-up flower shop. The UI is a **React (JSX)** single-page app in `client/` with an Express API in `server/`. Old `.html` URLs redirect to the matching React routes.

## Quick start

```bash
cd something-floral-ph
npm run install:all
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3001  

## Demo accounts

| Role   | Login              | Password     |
|--------|--------------------|--------------|
| Client | `maria@test.com`   | `flower123`  |
| Admin  | `admin`            | `floral2026` |

You can also register a new client account from **My Account → Sign up**.

## Features

- **Public site:** Home, gallery (live filters), pop-up schedule, reservation form with live price preview, GCash upload, confirmation page loaded from API
- **Client portal:** Login/signup, order history with status timeline, profile & password updates
- **Admin dashboard:** Live stats, order status updates, product price edits, client list

## Project structure

```
something-floral-ph/
├── client/          # React (JSX) + Vite — all pages as components
│   └── src/pages/   # Home, Gallery, Schedule, Reservation, dashboards, auth
├── server/          # Express + JSON file database
├── css/             # Shared styles (imported by React)
└── images/          # Product photos & logo
```


## Images

Place your bouquet images in the `images/` folder (same files as the HTML version):

- `logo.png`, `hero-bouquet.png`, `blush-rose-garden.png`, `lavender-dream.png`, etc.

## Production build

```bash
npm run build
npm start
```

Serves the React build and API from port 3001.

## Tech stack

- React 19 + React Router
- Node.js + Express
- JSON file storage (`server/data/db.json`) — easy to demo without installing a database
