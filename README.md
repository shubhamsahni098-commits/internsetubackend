# InternSetu Backend

Node.js + Express + TypeScript + Prisma (MySQL) REST API for InternSetu.


## Tech stack
Node.js, Express, TypeScript, Prisma ORM, MySQL, JWT auth, bcrypt, zod validation.

## Folder structure

```
internsetu-backend/
├── prisma/
│   ├── schema.prisma        # database models: Student, Company, Internship, Application
│   └── seed.ts              # seeds 30 students + 60 companies + internships + applications
├── src/
│   ├── config/
│   │   ├── env.ts           # reads & validates environment variables
│   │   └── prisma.ts        # shared PrismaClient instance
│   ├── controllers/         # HTTP layer only — parses req, calls a service, sends a response
│   │   ├── auth.controller.ts
│   │   ├── student.controller.ts
│   │   ├── company.controller.ts
│   │   ├── internship.controller.ts
│   │   └── application.controller.ts
│   ├── services/            # all business logic + Prisma queries live here
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── company.service.ts
│   │   ├── internship.service.ts
│   │   └── application.service.ts
│   ├── routes/               # maps URLs -> middleware -> controller
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── company.routes.ts
│   │   ├── internship.routes.ts
│   │   ├── application.routes.ts
│   │   └── index.ts          # combines all of the above under /api
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # requireAuth (verifies JWT), requireRole
│   │   ├── validate.middleware.ts # runs zod schemas against req.body/query/params
│   │   └── error.middleware.ts    # 404 handler + global error handler
│   ├── validators/           # zod schemas — one file per resource, mirrors each frontend form
│   ├── utils/
│   │   ├── jwt.ts            # sign/verify JWT
│   │   ├── password.ts       # bcrypt hash/compare
│   │   ├── ApiError.ts       # throw ApiError.notFound("...") etc from anywhere
│   │   ├── ApiResponse.ts    # sendSuccess(res, 200, "message", data)
│   │   └── asyncHandler.ts   # wraps async controllers so errors reach errorHandler
│   ├── types/
│   │   └── express.d.ts      # adds req.user: { id, role } to Express's Request type
│   ├── app.ts                 # Express app: middleware, routes, error handling
│   └── server.ts              # entrypoint: connects Prisma, starts the HTTP server
├── .env.example
├── package.json
└── tsconfig.json
```

**Why this layout:** routes only wire up middleware + which controller handles a URL.
Controllers only touch `req`/`res`. All actual logic and every Prisma call live in
`services/`, so the same logic could be reused outside HTTP (a script, a test, a queue
worker) without dragging Express along. `validators/` keep every form's rules in one
place, next to nothing else.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` — set `DATABASE_URL` to your local MySQL connection string, and set
   `JWT_SECRET` to any long random string.

3. **Create the database** (if it doesn't exist yet)
   ```sql
   CREATE DATABASE internsetu;
   ```

4. **Run migrations** — this creates the tables from `prisma/schema.prisma`
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed test data** (30 students, 60 companies, internships, applications)
   ```bash
   npm run seed
   ```
   Every seeded account uses the password `password123`.
   Example logins: `student1@test.com`, `company1@test.com` (up to student30 / company60).

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   API is live at `http://localhost:5000`. Health check: `GET /api/health`.

7. **Explore the database** (optional)
   ```bash
   npx prisma studio
   ```

## Connecting the frontend

In the frontend repo, point your API calls at `http://localhost:5000/api` during
development (e.g. via a `VITE_API_URL` env var + `fetch`/`axios`). Store the JWT
returned from login/register (e.g. in `localStorage`) and send it as
`Authorization: Bearer <token>` on every protected request.

Update `CLIENT_ORIGIN` in `.env` to include both your local Vite dev server URL and
your deployed frontend URL (comma-separated) so CORS allows both.

## API overview

All routes are prefixed with `/api`.

### Auth (`/auth`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/student/register` | – | Register a student |
| POST | `/auth/student/login` | – | Student login |
| POST | `/auth/company/register` | – | Register a company |
| POST | `/auth/company/login` | – | Company login |
| GET | `/auth/me` | any | Get the logged-in user's own info |

### Students (`/students`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/students/profile` | student | Get own profile |
| PUT | `/students/profile` | student | Update own profile |

### Companies (`/companies`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/companies/:id/public` | – | Public company info (for internship detail page) |
| GET | `/companies/profile` | company | Get own profile |
| PUT | `/companies/profile` | company | Update own profile |

### Internships (`/internships`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/internships` | – | Browse/search/filter (query: search, domain, location, workMode, page, limit) |
| GET | `/internships/mine` | company | List postings created by the logged-in company |
| GET | `/internships/:id` | – | Get one internship's details |
| POST | `/internships` | company | Post a new internship |
| PUT | `/internships/:id` | company (owner) | Edit an internship |
| DELETE | `/internships/:id` | company (owner) | Delete an internship |

### Applications (`/applications`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/applications` | student | Apply to an internship (body: `internshipId`) |
| GET | `/applications/mine` | student | Own applications + stats (total/underReview/shortlisted/rejected) |
| GET | `/applications/internship/:internshipId` | company (owner) | List applicants for one posting |
| PATCH | `/applications/:id/status` | company (owner) | Update an applicant's status |

All error responses look like:
```json
{ "success": false, "message": "..." }
```
All success responses look like:
```json
{ "success": true, "message": "...", "data": { ... } }
```
