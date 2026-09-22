# Aster Service Partner Storefront

A polished, mobile-first ecommerce and service experience for an Apple Premium Partner or authorised device service centre.

Aster brings product discovery, expert support, delivery, store pickup, account access, and cart management into one clear customer journey. The interface is designed for shoppers who want the confidence of a premium retail brand with the convenience of local service.

> Independent concept project. Aster is not affiliated with Apple or iCentre.

## Why It Works for a Service Partner

- **Sell more than devices:** Present products, accessories, workshops, repairs, trade-in, delivery, and pickup together.
- **Build local trust:** Put expert support and store services directly beside the shopping experience.
- **Remove friction:** Fast product search, account access, persistent cart, and mobile-friendly navigation help customers act quickly.
- **Ready for modern retail:** A premium visual system, responsive layouts, and a 3D product presentation create a strong first impression.

## Features

- Responsive storefront for desktop, tablet, and mobile
- Apple-inspired product catalogue experience with original Aster branding
- Three.js animated product scene with GSAP motion
- SQLite product catalogue, account, and cart persistence
- Header search drawer with popular searches and live results
- Account panel and cart panel connected to the API
- Service-focused sections for support, delivery, and store pickup
- Production deployment configuration for Render

## Technology

- React 19
- Vite
- Three.js
- GSAP
- Node.js HTTP API
- SQLite with `better-sqlite3`
- Render deployment blueprint

## Run Locally

```bash
npm install
npm run dev:full
```

Open `http://localhost:5173/` in your browser.

The combined command runs:

- Vite frontend on port `5173`
- SQLite API on port `3001`

## Deploy

The project includes `render.yaml` for deployment from the `main` branch. Render builds the Vite frontend, starts the Node server, and mounts persistent storage for the SQLite database.

## Client Positioning

This concept can be adapted for a real service partner with brand assets, store locations, product feeds, booking workflows, repair status tracking, financing, trade-in, customer authentication, and a production commerce backend.
