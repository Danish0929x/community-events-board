# Community Events Board

An admin posts local events (music nights, workshops, food fairs…). Visitors browse and filter them, sign up, follow favourite categories, set reminders and design a card for each event.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MongoDB with Prisma · JWT (jose) · zod · motion · sonner · lucide icons

## Setup (under 5 minutes)

You need **Node.js 20.9+** and a **MongoDB connection string**. A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster works. A local MongoDB also works if it runs as a replica set, which Prisma requires.

```bash
git clone https://github.com/Danish0929x/community-events-board.git
cd community-events-board
npm install                 # also generates the Prisma client
cp .env.example .env        # then set DATABASE_URL (see below)
npm run setup               # creates collections + indexes, seeds 15 events, the admin and a demo user
npm run dev                 # open http://localhost:3000
```

In `.env`, `DATABASE_URL` must include a database name in the path, for example:

```
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/community_events?retryWrites=true&w=majority"
```

`JWT_SECRET` already has a dev value in `.env.example`; change it for anything real. Run `npm run db:seed` at any time to reset the sample events.

## Logins

| Who | Email | Password | Where |
| --- | --- | --- | --- |
| **Admin** | `admin@events.local` | `Admin@123` | [/admin/login](http://localhost:3000/admin/login) |
| Demo visitor (follows Music and Food) | `demo@events.local` | `Demo@1234` | [/login](http://localhost:3000/login) |

The admin is created by the seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. Anyone can sign up as a visitor at `/signup`; sign-up can never create an admin.

## Pages

| Page | What it does |
| --- | --- |
| `/events` | Active, upcoming events, nearest first. Category, city and text filters work together, with pagination |
| `/events/:id` | Event details, **Remind me**, and **Design your card** |
| `/signup`, `/login` | Email + password. After the first login you pick favourite categories |
| `/favourites` | Choose favourite categories |
| `/feed` | **My Feed**: upcoming events from your favourite categories |
| `/admin`, `/admin/events/new`, `/admin/events/:id/edit` | Admin only: list all events, switch Active/Inactive, add or edit an event |

## API

All pages use these JSON endpoints, so a mobile app can use the same API. Send the token from login as `Authorization: Bearer <token>`. The website gets the same token in an httpOnly cookie. Errors look like `{ "error": "message" }` with a matching HTTP status (400, 401, 403, 404, 409).

| Method | Path | Auth | Body / query → response |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | `{email, password}` → `{token, user, favourites}` |
| POST | `/api/auth/login` | – | `{email, password}` → `{token, user, favourites}` |
| POST | `/api/auth/logout` | – | Clears the web cookie |
| GET | `/api/me` | user | `{user, favourites}` |
| GET / PUT | `/api/me/favourites` | user | `{categories: ["Music", "Food"]}` |
| GET | `/api/events` | optional | `?category=Music&city=Coimbatore&q=night&page=1&pageSize=6` → `{items, page, pageSize, total, totalPages}` |
| GET | `/api/events/:id` | optional | `{event}` (only active events) |
| GET | `/api/cities` | – | `{cities}` that have upcoming events (for the city filter) |
| GET | `/api/feed?page=1` | user | Same shape as `/api/events`, plus `favourites` |
| PUT / DELETE | `/api/events/:id/reminder` | user | Set / remove a reminder → `{reminded}` |
| GET / PUT | `/api/events/:id/card-design` | user | `{theme, stickers}`. Theme is `none`, `sunset`, `midnight` or `meadow`; at most 3 stickers |
| GET / POST | `/api/admin/events` | admin | List every event / create one |
| GET | `/api/admin/events/:id` | admin | `{event}`, including inactive and past events |
| PATCH | `/api/admin/events/:id` | admin | Any fields to change, e.g. `{price: 1800}` or `{isActive: false}`. There is no delete |

When a visitor is logged in, each event in a list also carries `reminded` and their `cardDesign`.

## Questions

### 1. Database structure, and why

```
User              { _id, email (unique), passwordHash, role: "USER" | "ADMIN", createdAt }
Event             { _id, title, category, city, startsAt (UTC), price (₹, int), description, imageUrl, isActive, createdAt, updatedAt }
FavouriteCategory { _id, userId → User, category }            unique (userId, category)
Reminder          { _id, userId → User, eventId → Event }       unique (userId, eventId)
CardDesign        { _id, userId → User, eventId → Event, theme, stickers[] }   unique (userId, eventId)
```

Events hold only shared data. Everything personal (favourites, reminders, card designs) lives in its own collection keyed by user and event, so one user's actions never touch the event document. The unique `(userId, eventId)` pairs make "remind me" and "save card" safe upserts: double taps or retries can't create duplicates. Events are switched off with `isActive` instead of being deleted. Price is stored as whole rupees, and dates are stored in UTC and shown in IST.

### 2. How the filter query works, and which index to add

`listUpcomingEvents()` in [`src/lib/events.ts`](src/lib/events.ts) builds one `where` from the parts that are present: always `isActive = true` and `startsAt >= now`, plus `category`, `city` and a case-insensitive "contains" on the title or description. All parts are ANDed, so Music + Coimbatore + "night" must match all three. It sorts by `startsAt` (then `_id`, so pages never overlap), uses `skip`/`take` for pagination, and runs a `count` with the same `where` for the page total. The schema has indexes on `{isActive, startsAt}` and `{category, isActive, startsAt}`. With more data I'd add `{isActive, category, city, startsAt}` (equality fields first, then the sorted/range field). The `contains` search is a regex that can't use a normal index, so at scale I'd move it to a MongoDB text index or Atlas Search.

### 3. Passwords, and protecting admin pages and APIs

Passwords are hashed with **scrypt** (Node's built-in crypto) using a random 16-byte salt per user. Only `scrypt$salt$hash` is stored, and login compares with `timingSafeEqual`, returning the same "Invalid email or password" message whether the email or the password is wrong. Login returns an HS256 **JWT** (7 days) with the user id and role. Mobile clients send it as a Bearer header; the website gets it in an **httpOnly, SameSite=Lax** cookie, so page JavaScript can't read it and other sites can't make requests with it. On the server, [`src/proxy.ts`](src/proxy.ts) checks the token before any `/admin` page renders and redirects non-admins. Separately, every admin API calls `requireAdmin()` and returns 401/403. So even a request that skips the pages can't read or change admin data.

## Project structure

```
prisma/schema.prisma      data model and indexes
prisma/seed.ts            15 sample events, admin, demo user
src/proxy.ts              server-side guard for /admin, /feed, /favourites
src/lib/                  api helpers (auth, errors), events query, zod schemas, formatting (₹ / dates)
src/app/api/              JSON API route handlers
src/app/                  pages (events, event detail, auth, favourites, feed, admin)
src/components/           event card, remind button, card designer, header, shared UI states
```

## What's left

- **No automated test suite.** I tested the API with scripted requests and the pages by hand on phone and laptop sizes.
- **Logout only removes the cookie.** JWTs can't be revoked before they expire (7 days). A real app would use short-lived tokens with refresh, or a deny-list.
- **No rate limiting** on login or signup.
- **Reminders are stored but not sent.** The brief only asks for the button; sending notifications would need a scheduled job.

## Use of AI tools

I used **Claude Code** (Anthropic) as a coding assistant throughout: scaffolding, the API routes, the UI components, debugging, and drafting this README. I chose the stack and features, reviewed and tested every change, and asked for fixes where things broke (for example card-design saving, loading flicker and theme switching).
