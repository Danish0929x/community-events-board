# Community Events Board

Admins post local events; visitors browse, filter, set reminders, follow categories and design a card per event.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + SQLite · JWT (jose) · zod · motion · sonner

## Setup (about 2 minutes)

Needs Node.js 20.9 or newer.

```bash
npm install        # also runs `prisma generate`
npm run setup      # creates .env from .env.example, applies migrations, seeds 15 events
npm run dev        # http://localhost:3000
```

`npm run db:seed` resets the sample events at any time.

## Logins

| Who | Email | Password | Where |
| --- | --- | --- | --- |
| Admin | `admin@events.local` | `Admin@123` | `/admin/login` |
| Demo visitor (follows Music, Food) | `demo@events.local` | `Demo@1234` | `/login` |

You can also sign up for a new visitor account at `/signup`.

## API

Every page calls these JSON endpoints. Auth is `Authorization: Bearer <token>` (for mobile) or the httpOnly cookie that the web app gets on login. Errors are `{ "error": "message" }` with a matching HTTP status.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | `{email, password}` → `{token, user}` |
| POST | `/api/auth/login` | – | `{email, password}` → `{token, user, favourites}` |
| POST | `/api/auth/logout` | – | Clears the web cookie |
| GET | `/api/me` | user | Current user and favourites |
| GET / PUT | `/api/me/favourites` | user | `{categories: ["Music","Food"]}` |
| GET | `/api/events?category=&city=&q=&page=&pageSize=` | optional | Active, upcoming events, nearest first, paginated |
| GET | `/api/events/:id` | optional | One active event |
| GET | `/api/cities` | – | Cities that have upcoming events |
| GET | `/api/feed?page=` | user | Upcoming events in the user's favourite categories |
| PUT / DELETE | `/api/events/:id/reminder` | user | Set / remove a reminder |
| GET / PUT | `/api/events/:id/card-design` | user | `{theme, stickers[]}` |
| GET / POST | `/api/admin/events` | admin | List all / create an event |
| PATCH | `/api/admin/events/:id` | admin | `{isActive}`. Events are never deleted |

## Still to do

- Responsive polish pass and screen recording
- The three written answers below

## Use of AI tools

Built with help from Claude Code (Anthropic).
