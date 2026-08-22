# ReachInbox – Full-Stack Email Job Scheduler

A full-stack email scheduling system built for the ReachInbox Software Development Intern assignment.

The application provides a React dashboard for composing and scheduling email campaigns, backed by an Express/TypeScript API, PostgreSQL, Redis, BullMQ, and Ethereal SMTP.

## Features

### Authentication

- Real Google OAuth 2.0 authentication
- HTTP-only JWT authentication cookie
- Authenticated dashboard
- Displays authenticated user's name, email, and avatar
- Logout
- Protected API routes

### Email Scheduling

- Compose email campaigns
- Add recipients individually
- Upload CSV/TXT recipient lists
- Automatic email address extraction and validation
- Recipient count display
- Configurable start time
- Configurable delay between emails
- Configurable hourly sending limit
- Scheduled email dashboard
- Sent email dashboard
- Email status tracking

### Scheduler

- BullMQ delayed jobs
- Redis-backed persistent queue
- Separate BullMQ worker
- Configurable worker concurrency
- No cron-based scheduling
- Scheduled jobs persist independently of the Express process
- Job-level idempotency using email IDs
- Future scheduled emails survive application/worker restarts

### Rate Limiting and Throttling

- Redis-backed hourly rate limiting
- Atomic Redis operations for shared rate-limit state
- Configurable maximum emails per hour
- Minimum delay between individual sends
- Redis-backed send throttling
- Shared rate limiting across worker processes
- Jobs remain queued when they cannot be processed immediately

### Email Delivery

- Ethereal SMTP
- PostgreSQL email status persistence
- Sender entities associated with campaigns
- Successful and failed delivery states

---

## Architecture

```text
                         ┌─────────────────┐
                         │   React + Vite  │
                         │    Dashboard    │
                         └────────┬────────┘
                                  │
                                  │ HTTP
                                  ▼
                         ┌─────────────────┐
                         │ Express API     │
                         │                 │
                         │ Google OAuth    │
                         │ Campaign API    │
                         │ Email API       │
                         └───────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌─────────────┐          ┌─────────────┐
             │ PostgreSQL  │          │    Redis    │
             │             │          │             │
             │ Users       │          │ BullMQ      │
             │ Senders     │          │ Queue       │
             │ Campaigns   │          │ Rate limits │
             │ Emails      │          │ Throttling  │
             └─────────────┘          └──────┬──────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ BullMQ Worker   │
                                    │                 │
                                    │ Concurrency     │
                                    │ Rate limiting   │
                                    │ Send throttling │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Ethereal SMTP   │
                                    └─────────────────┘
```

## Scheduling Flow

When a campaign is created:

1. The API authenticates the user.
2. The request is validated using the campaign schema.
3. The campaign is persisted in PostgreSQL.
4. Individual email records are created with calculated `scheduledAt` timestamps.
5. Each email is added to BullMQ as a delayed job.
6. Redis persists the queue state.
7. The BullMQ worker processes jobs when their delay expires.
8. Redis-backed throttling and hourly rate limiting are applied.
9. The email is sent through Ethereal SMTP.
10. The email status is updated in PostgreSQL.

## Persistence and Restart Behavior

Scheduling does not depend on an in-memory timer or cron job.

Future email records are persisted in PostgreSQL and their BullMQ jobs are persisted in Redis.

Because scheduling state is external to the API process, restarting the Express server does not require recreating future timers.

When the worker reconnects to Redis, persisted BullMQ jobs remain available for processing.

This also allows the worker to be restarted independently of the API.

## Idempotency

Each email receives a unique ID.

The same email ID is used as the BullMQ job ID:

```text
email.id → BullMQ jobId
```

This prevents the same email from being accidentally queued multiple times with the same job ID.

Email processing state is persisted in PostgreSQL:

```text
SCHEDULED
    ↓
PROCESSING
    ↓
SENT / FAILED
```

## Worker Concurrency

Worker concurrency is configurable through:

```env
WORKER_CONCURRENCY=5
```

This allows multiple email jobs to be processed concurrently.

The shared Redis-backed rate limiting and throttling logic prevents concurrent workers from bypassing the configured sending limits.

## Per-Email Send Delay

The minimum delay between email sends is configurable through:

```env
MIN_EMAIL_DELAY_MS=2000
```

The default configuration uses a 2-second minimum delay.

The delay is applied independently of the campaign's initial scheduling time.

## Hourly Rate Limiting

The hourly limit is configurable through:

```env
MAX_EMAILS_PER_HOUR=100
```

The implementation uses Redis-backed atomic state rather than process-local counters.

This allows concurrent worker processes to coordinate against the same hourly sending limit.

When the hourly limit is reached, the email is not discarded. The job remains available for later processing.

## Handling Large Campaigns

For a campaign containing 1000+ recipients:

- Each recipient becomes an individual persisted email record.
- Each email receives its own scheduled timestamp.
- Each email is represented by a BullMQ delayed job.
- Worker concurrency controls processing parallelism.
- Redis-backed rate limiting protects the configured hourly threshold.
- Send throttling prevents emails from being sent faster than the configured minimum delay.
- Remaining jobs stay persisted until they can be processed.

The system therefore does not attempt to send a large campaign simultaneously.

---

# Backend

## Technologies

- TypeScript
- Express.js
- Prisma
- PostgreSQL
- BullMQ
- Redis
- Nodemailer
- Ethereal Email
- Google OAuth 2.0
- JWT
- HTTP-only cookies

## Environment Variables

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reachinbox
REDIS_URL=redis://localhost:6379

PORT=3000

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=100

ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=
```

Do not commit `.env` or any file containing real credentials.

A `.env.example` file should contain the variable names above with credentials left empty.

---

# Running Locally

## Prerequisites

- Node.js
- PostgreSQL
- Redis
- Google OAuth credentials
- Ethereal Email account

## Backend

```bash
cd backend
npm install
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Start the API:

```bash
npm run dev
```

In a separate terminal, start the BullMQ worker:

```bash
npm run worker
```

The API runs on:

```text
http://localhost:3000
```

The API and BullMQ worker are intentionally separate processes.

Both need to be running for scheduled emails to be processed.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Production Build Check

The frontend can be checked with:

```bash
npm run build
```

The backend TypeScript can be checked with:

```bash
npx tsc --noEmit
```

---

# Google OAuth Setup

Create a Google OAuth Web Application client.

Configure the redirect URI as:

```text
http://localhost:3000/auth/google/callback
```

Place the client credentials in the backend `.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

The application requests:

```text
openid
email
profile
```

After successful authentication, the backend:

1. Receives the Google authorization code.
2. Exchanges the code for OAuth tokens.
3. Retrieves the Google user's profile.
4. Creates or updates the local PostgreSQL user.
5. Establishes an HTTP-only JWT authentication cookie.
6. Redirects the user to the dashboard.

For a public deployment, the Google OAuth redirect URI must be changed to the deployment URL and registered with Google.

---

# Ethereal Email

Ethereal provides a fake SMTP server for testing email delivery.

Configure:

```env
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASSWORD=
```

Ethereal captures outgoing messages instead of delivering them to real recipients.

The BullMQ worker performs SMTP delivery and persists the resulting email status in PostgreSQL.

---

# Frontend

The dashboard provides:

- Google login
- Authenticated user information
- User name, email, and avatar
- Logout
- Compose screen
- Individual recipient entry
- CSV/TXT recipient upload
- Automatic recipient count detection
- Configurable scheduling
- Configurable email delay
- Configurable hourly limit
- Scheduled email list
- Sent email list
- Loading states
- Empty states
- Refresh controls
- Email status display

The UI is implemented in TypeScript and uses reusable React components and API modules.

---

# API Overview

## Authentication

```text
GET  /auth/google
GET  /auth/google/callback
GET  /auth/me
POST /auth/logout
```

## Campaigns

```text
POST /api/campaigns
```

## Emails

```text
GET /api/emails?status=SCHEDULED
GET /api/emails?status=SENT
GET /api/emails?status=FAILED
```

Authenticated routes require the HTTP-only authentication cookie.

---

# Database Model

The main PostgreSQL entities are:

```text
User
 ├── Campaign
 └── Sender

Campaign
 └── Email
```

### User

Stores the authenticated Google user.

### Sender

Represents an email sender associated with a user.

### Campaign

Stores campaign-level configuration including:

- sender
- subject
- body
- start time
- delay
- hourly limit

### Email

Stores each individual recipient and its scheduling/delivery state.

Email states include:

```text
SCHEDULED
PROCESSING
SENT
FAILED
```

---

# Project Structure

```text
backend/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── services/
│   ├── queue/
│   ├── validators/
│   ├── lib/
│   └── routes/
├── prisma/
└── package.json

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── pages/
│   └── App.tsx
└── package.json
```

---

# Assumptions and Trade-offs

## Sender Configuration

The backend models senders separately through the `Sender` entity and associates campaigns with a `senderId`.

For the assignment demo, the frontend uses a configured/seeded Ethereal sender rather than implementing a complete sender-management interface.

This keeps the implementation focused on the core email scheduling workflow while retaining sender separation in the backend data model.

## Email Detail View

The dashboard focuses on the required scheduled and sent email list views.

A full email detail/editor workflow was not prioritized because it is outside the core scheduling requirements.

## Ethereal

Ethereal is intentionally used instead of a production SMTP provider because it provides a safe fake SMTP environment for the assignment.

## Authentication

Google OAuth is implemented as real OAuth rather than mocked authentication.

The authenticated session is maintained using an HTTP-only JWT cookie.

---

# Docker

The application is designed to run with separate services for:

- Frontend
- Backend API
- BullMQ worker
- PostgreSQL
- Redis

Inside Docker, services communicate using Docker Compose service names rather than `localhost`.

For example:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/reachinbox
REDIS_URL=redis://redis:6379
```

The browser continues to access the exposed frontend/API ports through `localhost`.

Google OAuth also requires the externally accessible callback URL to exactly match the redirect URI registered with Google.

The Docker configuration should therefore keep deployment-specific values in environment variables rather than hardcoding them in application logic.

---

# Production Considerations

For a production deployment:

- Store secrets in a dedicated secret manager.
- Use HTTPS.
- Configure production Google OAuth redirect URIs.
- Use managed PostgreSQL and Redis.
- Add structured logging and monitoring.
- Add retry/backoff policies for transient SMTP failures.
- Add sender-management functionality.
- Add comprehensive automated tests.
- Configure deployment-specific frontend/API URLs instead of localhost.
- Use environment-specific configuration for Docker and production deployments.

---

# Assignment Requirements

| Requirement | Status |
|---|---|
| Express + TypeScript | Implemented |
| PostgreSQL | Implemented |
| BullMQ + Redis | Implemented |
| Persistent delayed scheduling | Implemented |
| No cron-based scheduler | Implemented |
| Ethereal SMTP | Implemented |
| Worker concurrency | Implemented |
| Minimum per-email delay | Implemented |
| Redis-backed hourly rate limiting | Implemented |
| Redis-backed send throttling | Implemented |
| Atomic shared rate-limit state | Implemented |
| Sender data model | Implemented |
| Job idempotency | Implemented |
| Google OAuth | Implemented |
| HTTP-only authentication | Implemented |
| Authenticated dashboard | Implemented |
| Compose email | Implemented |
| CSV/TXT recipient upload | Implemented |
| Recipient count | Implemented |
| Start time scheduling | Implemented |
| Configurable delay | Implemented |
| Configurable hourly limit | Implemented |
| Scheduled email list | Implemented |
| Sent email list | Implemented |
| Email status tracking | Implemented |
| Loading states | Implemented |
| Empty states | Implemented |
| Docker support | Implemented |
| README/documentation | Implemented |

---

# Demo Flow

The recommended demonstration flow is:

1. Start PostgreSQL and Redis.
2. Start the Express API.
3. Start the BullMQ worker.
4. Start the React frontend.
5. Login using Google OAuth.
6. Show the authenticated user's name, email, avatar, and logout control.
7. Open Compose.
8. Upload a CSV recipient list.
9. Show the detected recipient count.
10. Enter subject and body.
11. Configure start time, delay, and hourly limit.
12. Schedule the campaign.
13. Show the emails in Scheduled.
14. Let the BullMQ worker process the scheduled jobs.
15. Show the emails moving to Sent.
16. Verify email status in the dashboard.
17. Demonstrate that future scheduled jobs remain persisted after restarting the API or worker.

The API and worker run separately:

```bash
npm run dev
```

and:

```bash
npm run worker
```

The API is responsible for creating campaigns and scheduling jobs, while the BullMQ worker consumes and processes queued email jobs.

---

# Notes

This project intentionally separates the API process from the background worker so that scheduled email processing is not tied to the lifecycle of the HTTP server.

Redis provides both durable queue state through BullMQ and shared state for rate limiting/throttling.

PostgreSQL remains the source of truth for users, campaigns, senders, and individual email delivery state.