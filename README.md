# DriveYangon — Vehicle Rental Management System

Full-stack React/Express/SQLite implementation of the project book's UI mockup section
(homepage & catalog, car detail, booking form, booking confirmation, rental history,
admin dashboard, admin vehicle management, admin booking management).

## Setup

```bash
npm install
npm run dev        # starts the app on http://localhost:5000 (Vite + Express, dev mode)
```

## Production build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Notes

- Data is stored in a local SQLite file (`data.db`), auto-created and seeded with sample
  vehicles/bookings on first run.
- Frontend: React + Vite + TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query,
  react-hook-form + Zod, recharts, wouter (hash-based routing).
- Backend: Express REST API in `server/routes.ts`, storage layer in `server/storage.ts`,
  shared Zod schemas in `shared/schema.ts`.
- Default customer identity for the demo customer flow: "Aung Ko Ko Min" — switchable via
  the "Switch customer" button on the My Bookings page.
- Dark/light mode toggle is available in both the customer site header and the staff
  portal header (in-memory only, defaults to system preference).
