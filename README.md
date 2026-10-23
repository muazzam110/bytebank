# Bytebank: a simulated digital bank (MERN)

An educational full-stack project. **All money is simulated.** No real payments, cards or UPI.
Stack: MongoDB · Express · React · Node (plain JavaScript, ES Modules) · Redux Toolkit + RTK Query · Tailwind · shadcn/ui.

## What it does
- **Sign up** with name, email and password, then **log in**. Your account and ₹10,000 welcome balance are created at signup (exactly once).
- Send money to other customers: atomic and idempotent (safe retries, never overdrawn)
- History with server-side search, filters, pagination · payment-ID lookup · printable receipts
- Admin console: customers, suspend/activate, simulated deposits (reason + audit log), all transactions
- Profile, change password (logs out your other devices)

> There is **no email verification** in this version. Email is only used (optionally) for "forgot password" links and
> "payment received" notices, and by default those simply print in the server terminal.

## Folder layout
```
bytebank/
├─ package.json        root: runs API + web together (npm run dev)
├─ CHANGES.md          what changed in this version
├─ docs/               ARCHITECTURE, DESIGN, MEMORY, task (original project docs)
├─ server/             Express API  (src/, scripts/, tests/)
│  └─ .env             ← you MUST put your MONGODB_URI here (see step 2)
└─ client/             React app (Vite)  (src/)
```

## Prerequisites
- **Node 20 or newer** (`node -v`)
- **MongoDB as a replica set** (transfers use database transactions):
  - Easiest: a free **MongoDB Atlas M0** cluster.
  - Local alternative: `mongod --replSet rs0`, then `rs.initiate()` once in `mongosh`, and use
    `mongodb://127.0.0.1:27017/bytebank?replicaSet=rs0`.
  - A plain standalone `mongod` will NOT work.

## Setup (VS Code terminal, from the `bytebank` folder)
1. **Install** (needs internet): `npm run setup`
2. **Database:** open `server/.env` and set `MONGODB_URI=` to your connection string. (Upgrading from the earlier zip? Copy your old `server/.env` over this one.)
3. **Admin account:** `npm --prefix server run seed:admin`
4. **Run:** `npm run dev`  →  web http://localhost:5173 · API http://localhost:5000/api/v1/health

**Upgrading with an existing database?** Customers who signed up in the earlier version but never verified have no account yet.
Run `npm --prefix server run backfill:accounts` once and they all get their account and ₹10,000.

## Try it (3 minutes)
1. Open http://localhost:5173 → **Open free account** → enter name, email, password → you land on the login page → log in.
2. Create a second user in an incognito window. From the first user: **Send money** → search the second user's name → ₹500 → confirm.
3. The second user's dashboard updates within 30 seconds. Open **Transactions**, click a row, open the receipt, print it.
4. Log in with the admin email/password from `server/.env`: **Deposits** → give someone ₹1,000 with a reason.
5. `npm --prefix server run reconcile` → **PASS**.

## Scripts
| Where | Command | Purpose |
|---|---|---|
| root | `npm run setup` | install root + server + client packages |
| root | `npm run dev` | API + web together |
| server | `npm test` | unit, integration and invariant tests (in-memory replica set; first run downloads a MongoDB binary) |
| server | `npm run reconcile` | proves balances = ledger = deposits; exits non-zero on any discrepancy |
| server | `npm run seed:admin` | create/update the admin from `.env` |
| server | `npm run backfill:accounts` | give accounts to customers that don't have one |
| client | `npm run build` | production build |

## Troubleshooting
- **"Invalid environment variables"**: a value in `server/.env` is missing or wrong (the message names it).
- **"MongoDB is not a replica set"**: use Atlas, or a local replica set.
- **Cannot connect / authentication failed**: check the password in the URI (URL-encode special characters) and your Atlas IP allow-list.
- **Blank page / network errors**: make sure BOTH servers run (`npm run dev` shows `api` and `web`).
- **Port in use**: change `PORT` in `server/.env` AND the proxy target in `client/vite.config.js`.
- **Logged in but "No customer account found"**: run `npm --prefix server run backfill:accounts`.

## Security notes
HTTP-only session cookie · server-side authorization on every request · strict zod validation · rate limits · CSRF origin guard ·
idempotent transfers · atomic transactions · strict CSP on the API · no stack traces in production.
