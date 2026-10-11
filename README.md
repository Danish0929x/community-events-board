# Community Events Board

A small app where an admin posts local events (music nights, workshops, food fairs) and people can browse them, follow the categories they like, set reminders and design a little card for an event.

Built with Next.js 16 (App Router), TypeScript, Tailwind, MongoDB + Prisma, and JWT for auth.

## Running it

You'll need Node 20.9 or newer and a MongoDB URL. I used a free MongoDB Atlas cluster. A local MongoDB works too, as long as it's running as a replica set (Prisma needs that).

```bash
git clone https://github.com/Danish0929x/community-events-board.git
cd community-events-board
npm install
cp .env.example .env      # put your MongoDB URL in DATABASE_URL
npm run setup             # creates the indexes and adds the sample data
npm run dev               # http://localhost:3000
```

One thing to watch: the MongoDB URL needs a database name in it, like this:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/community_events?retryWrites=true&w=majority
```

If you want to start fresh at any point, `npm run db:seed` resets the sample events.

## Logins

Admin: `admin@events.local` / `Admin@123` (log in at `/admin/login`)

There's also a demo visitor so you don't have to sign up: `demo@events.local` / `Demo@1234`. It already follows Music and Food, so My Feed has something in it. You can of course sign up with your own email too.

The admin account is created by the seed script from the values in `.env`. Signing up always creates a normal user, never an admin.

## What's in the app

- `/events`: upcoming active events, nearest first. Category, city and search all work together, with pagination.
- `/events/:id`: event details, the Remind me button, and the card designer.
- `/signup` and `/login`: after your first login you're asked to pick favourite categories.
- `/feed`: My Feed, upcoming events from the categories you picked.
- `/admin`: see every event, switch them active/inactive, add new ones or edit them. Nothing gets deleted.

## API

The pages only talk to these JSON routes, so a mobile app could use the same ones. Login gives back a token. Send it as `Authorization: Bearer <token>`. (The website gets the same token as an httpOnly cookie, so it doesn't have to handle it in JS.) Errors come back as `{ "error": "..." }` with the right status code.

| Method | Route | Who | What |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | anyone | `{email, password}`, returns `{token, user}` |
| POST | `/api/auth/login` | anyone | `{email, password}`, returns `{token, user, favourites}` |
| POST | `/api/auth/logout` | anyone | clears the cookie |
| GET | `/api/me` | user | who's logged in + their favourites |
| GET, PUT | `/api/me/favourites` | user | `{categories: ["Music", "Food"]}` |
| GET | `/api/events` | anyone | `?category=&city=&q=&page=`, upcoming active events |
| GET | `/api/events/:id` | anyone | one event |
| GET | `/api/cities` | anyone | cities for the filter dropdown |
| GET | `/api/feed` | user | events from your favourite categories |
| PUT, DELETE | `/api/events/:id/reminder` | user | set or remove a reminder |
| GET, PUT | `/api/events/:id/card-design` | user | `{theme, stickers}` |
| GET, POST | `/api/admin/events` | admin | list all events / add one |
| GET, PATCH | `/api/admin/events/:id` | admin | get one / edit it (also used for active ↔ inactive) |

## Questions

**1. Database structure and why**

```
User              email, passwordHash, role
Event             title, category, city, startsAt, price, description, imageUrl, isActive
FavouriteCategory userId, category            (unique per user + category)
Reminder          userId, eventId             (unique per user + event)
CardDesign        userId, eventId, theme, stickers[]   (unique per user + event)
```

I kept events as shared data and put everything that belongs to one user (favourites, reminders, card designs) in separate collections linked by userId/eventId. The unique user + event pair means a double tap can't create two reminders, and saving a card just overwrites the old one. Events use an `isActive` flag instead of being deleted. Prices are whole rupees, and dates are stored in UTC and shown in IST.

**2. How the filter query works, and what index I'd add**

In `src/lib/events.ts` I start with `isActive: true` and `startsAt >= now`, then add category, city and a case-insensitive search on title/description only if they're set. Everything is ANDed, so all of them have to match. Results are sorted by date and paged with skip/take, and the same filter is counted to get the total pages. I've added indexes on `{isActive, startsAt}` and `{category, isActive, startsAt}`. With a lot more events I'd add `{isActive, category, city, startsAt}`, and move the text search to a MongoDB text index, because a "contains" search can't use a normal index.

**3. Passwords and protecting admin**

Passwords are hashed with scrypt (built into Node) with a random salt per user, so I never store the actual password. Login checks it with a constant-time compare and gives the same error for a wrong email or a wrong password. After login you get a JWT holding your id and role. On the server, `src/proxy.ts` checks that token before any `/admin` page loads and sends non-admins to the login page. On top of that, every admin API route checks for the admin role itself, so even calling the API directly without the pages doesn't get you in.

## What's left

- No automated tests. I tested the API with scripted requests and clicked through the pages on phone and laptop sizes.
- Logging out just clears the cookie. The token itself stays valid until it expires (7 days).
- No rate limiting on login/signup.
- Reminders are saved but nothing actually sends a notification yet.

## AI usage

I used Claude Code while building this: for setting up the project, writing a good part of the API and UI code, debugging, and drafting this README. I decided what to build, tested everything, and pointed out bugs to fix along the way (card design not saving, loading flicker, the theme not changing).
