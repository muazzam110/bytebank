<div align="center">

# Bytebank

### A full-stack digital bank where money can't be lost, duplicated or overdrawn.

Atomic transfers · idempotent payments · audit-logged admin console · built with the MERN stack
*All money is simulated.*

<!-- LIVE DEMO: when you deploy, replace this comment with the two lines below.
**[Live demo](https://your-app.example.com)** · demo login: `demo@example.com` / `your-demo-password`
-->

[How it works](docs/HOW-IT-WORKS.md) ·
[Case study](docs/CASE-STUDY.md) ·
[Setup guide](docs/SETUP.md) ·
[Security](SECURITY.md)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-RTK_Query-764ABC?logo=redux&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
<!-- CI BADGE: once you add GitHub Actions or tests, add a build/test status badge here. -->

</div>

<p align="center">
  <img src="docs/images/dashboard.png" alt="Dashboard with balance, chart and recent activity" width="49%">
  <img src="docs/images/transfer.png" alt="Four-step send money flow" width="49%">
</p>
<p align="center">
  <img src="docs/images/history.png" alt="Transaction history with filters and pagination" width="49%">
  <img src="docs/images/admin.png" alt="Admin console overview" width="49%">
</p>

## Why this project

Most portfolio apps are forms that save and show data. Bytebank is built around a harder question:
**what must be true for a system that moves money to be trustworthy?** Retries, double clicks, parallel requests and
half-finished operations are normal in the real world, and none of them may create, lose or duplicate a rupee.

**25 API endpoints · 7 database collections · 18 screens · customer and admin roles**

## Engineering challenges

| Problem | How it is solved |
|---|---|
| **Two requests spend the same money at once** | The debit is one conditional database operation (`balance >= amount`) inside a transaction. There is no read-then-write gap, so an overdraft cannot happen. |
| **A user double-clicks, or the connection drops mid-payment** | Each transfer carries an **Idempotency-Key**. A unique index plus a replay path means the same request always returns the original payment, never a second one. |
| **An admin creates money** | The **audit record is written inside the same transaction** as the deposit. If the audit row fails, the money is never created. |
| **How do you know nothing was lost?** | `npm run reconcile` checks all data: total balances equal total deposits, every balance matches its ledger, no balance is negative. It exits non-zero on any discrepancy. |
| **A suspended user keeps using an old login** | The server reloads the user on every request, so a suspension or password change takes effect on the very next call. |

## What it does

- **Customers:** live dashboard with chart and 30-second refresh · four-step send-money flow · history with search, filters, sorting and pagination (shareable by URL) · payment lookup · printable receipts · profile, password change and reset by email
- **Admins:** overview · customer search · suspend or reactivate · deposits with a required reason and a review step · all-transactions view · audit log
- **Quality:** strict validation on client and server · structured logs with request IDs and secret redaction · rate limiting · CSRF origin check · strict CSP · deny-by-default admin router

## How it works

A React app talks to an Express API, which is the only component that touches MongoDB and the only place where rules
are enforced. The code only calls downward: `routes → controllers → services → models`.

```mermaid
flowchart LR
  user(["Customer or Admin"])

  subgraph FE["Frontend: React app (port 5173)"]
    ui["Pages and forms<br/>React Router + route guards"]
    state["Redux Toolkit + RTK Query<br/>remembers server data"]
  end

  subgraph BE["Backend: Express API (port 5000)"]
    pipe["Safety checks<br/>login, role, limits, validation"]
    logic["Controllers and services<br/>auth, transfers, admin"]
  end

  subgraph DB["Database: MongoDB Atlas (replica set)"]
    data[("7 collections<br/>users, accounts, transactions, ledger ...")]
  end

  mail["Email service (optional)<br/>password reset and payment notices"]

  user -->|"uses in the browser"| ui
  ui --> state
  state -->|"HTTP + JSON<br/>session cookie"| pipe
  pipe --> logic
  logic -->|"MongoDB driver over TLS<br/>all-or-nothing transactions"| data
  logic -.->|"SMTP"| mail

  classDef fe fill:#EEF0FF,stroke:#5B3DF5,color:#1f1a5c
  classDef be fill:#E6FAF5,stroke:#0F766E,color:#0b3d38
  classDef db fill:#FFF1EC,stroke:#C2410C,color:#5a2208
  classDef opt fill:#F4F4F5,stroke:#71717A,color:#3f3f46,stroke-dasharray: 4 3
  class ui,state fe
  class pipe,logic be
  class data db
  class mail opt
```

<details>
<summary><b>See how a payment works</b> (click to expand)</summary>

&nbsp;

```mermaid
sequenceDiagram
  actor U as Sender
  participant W as React app
  participant A as Express API
  participant D as MongoDB
  actor R as Receiver

  U->>W: Pick a person, enter an amount, review
  Note over W: Creates a one-time Idempotency-Key
  W->>A: POST /transfers with the Idempotency-Key header
  A->>A: Check login, role and input
  A->>D: Has this key been used before?

  alt Key already used
    D-->>A: Yes
    A-->>W: 200 and the ORIGINAL payment, nothing is charged twice
  else New payment
    A->>D: Start a transaction
    A->>D: Debit the sender only if the balance is enough
    A->>D: Credit the receiver
    A->>D: Save the payment, two ledger lines and the key
    D-->>A: Commit, or undo everything if any step fails
    A-->>W: 201 and the new balance
    A-->>R: Optional email notice after the commit
  end

  W->>W: RTK Query refetches balance and history
  W-->>U: Result card with a link to the receipt
```

- **No overdraft:** the debit only matches if the balance is enough, as one atomic database operation.
- **No half-finished payment:** debit, credit and records are one transaction. Any error undoes all of it.
- **No double payment:** a repeated request with the same `Idempotency-Key` returns the original payment.

</details>

More diagrams (sign-up, login, data model) are in **[docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md)**.

## Key decisions and trade-offs

| Decision | Why | Trade-off accepted |
|---|---|---|
| Money stored as integer **paise** | No floating-point rounding errors | Amounts are formatted for display only |
| Conditional atomic debit | Closes the race between "check" and "subtract" | Needs MongoDB transactions (a replica set) |
| Session in an **HTTP-only cookie** | Scripts cannot steal the token | Needs a CSRF origin check |
| User **reloaded on every request** | Suspension and password changes apply instantly | One extra database read per request |
| **Polling** every 30 seconds | Much simpler than WebSockets | Up to 30 seconds before an incoming payment appears |
| Audit log **inside** the money transaction | No money without a record of who created it | Admin writes are slightly heavier |

## Tech stack

| | |
|---|---|
| **Frontend** | React 18, Vite, React Router, Redux Toolkit + RTK Query, react-hook-form + zod, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Node.js, Express, Mongoose, zod, JWT in an HTTP-only cookie, bcrypt, Helmet, pino |
| **Database** | MongoDB Atlas (replica set, for multi-document transactions) |

## Run it locally

You need Node.js 20+ and a free MongoDB Atlas cluster. Full instructions: **[docs/SETUP.md](docs/SETUP.md)**.

```bash
git clone https://github.com/YOUR-USERNAME/bytebank.git && cd bytebank

# backend (terminal 1)
cd server && npm install
cp .env.example .env        # then fill in MONGODB_URI and JWT_SECRET
npm run seed:admin && npm run dev

# frontend (terminal 2)
cd client && npm install && npm run dev
```

Open **http://localhost:5173**, sign up two customers, send money between them, then run `npm run reconcile` in `server/`.

## Security

Real `.env` files are never committed (only `.env.example` templates), and a pre-commit guard blocks accidental secrets.
The app uses HTTP-only cookies, strict input validation that rejects unknown fields, rate limits, CORS and CSRF protection,
and role-based access with a deny-by-default admin router. Details and how to report an issue: **[SECURITY.md](SECURITY.md)**.

## Known limitations and roadmap

Honest about what is not done yet:

- Rate limits are counted in one server process's memory, so they would not be shared across several servers
- Admin deposits have no idempotency key, so the screen never offers a blind retry after an unclear failure
- Sessions last two hours with no refresh token
- History uses offset pagination, which slows down on very deep pages

**Next:** automated tests (concurrency, idempotency, rollback) · email verification at signup · deployment · CSV export

## About the author

Built by **Your Name**, a full-stack developer who built Bytebank to learn how a frontend, a backend and a database fit
together by solving a problem where mistakes show up as wrong balances.

[GitHub](https://github.com/YOUR-USERNAME) · [LinkedIn](https://www.linkedin.com/in/your-profile) · [Email](mailto:your-email@example.com)

Released under the [MIT License](LICENSE).
