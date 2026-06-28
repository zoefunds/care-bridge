# Care Bridge

**Care Bridge** is a decentralised AI health intelligence platform that uses GenLayer's Intelligent Contracts to analyse, verify, and explain personal health data through multi-model AI consensus. Every analysis is signed by the user's own wallet, executed by multiple independent AI validators on-chain, and permanently recorded on GenLayer StudioNet — giving users tamper-proof, consensus-backed health insights.

> **Disclaimer:** Care Bridge is an educational health intelligence tool. It does not diagnose, treat, prescribe, or replace professional medical advice. Always consult a qualified healthcare provider for any medical decisions.

## Live

| | URL |
|---|---|
| **Frontend** | https://care-bridge-ecru.vercel.app |
| **Backend API** | https://care-bridge-api.fly.dev/api/v1 |
| **API Docs** | https://care-bridge-api.fly.dev/docs |
| **Contract Explorer** | https://explorer-studio.genlayer.com/address/0xd5149cF96bB2A87066c7f95E96e1A1865e0A9AD1 |

---

## What it does

Care Bridge gives individuals access to 10 AI-powered health analysis sections, each backed by on-chain consensus:

| Section | What it analyses |
|---|---|
| **Lab Analysis** | Interprets blood work, metabolic panels, lipid profiles, and other biomarkers — flags abnormal values with educational notes |
| **Symptom Intelligence** | Triages symptoms, identifies possible causes, recommends appropriate level of care, and lists red-flag warning signs |
| **Medication Check** | Reviews drug interactions, contraindications, side effects, and safety ratings for a list of medications |
| **Health Triage** | Emergency-level urgency assessment — determines whether immediate care, same-day care, or self-care is appropriate |
| **Doctor Visit Prep** | Prepares a structured summary of the user's health situation before a clinical appointment |
| **Health Q&A** | Answers plain-language health questions with consensus-verified educational responses |
| **Trend Interpreter** | Analyses a time series of a health metric (e.g. blood glucose, weight, blood pressure) and identifies trends |
| **Prevention Plan** | Generates a personalised preventive health plan based on the user's health profile |
| **Route to Care** | Recommends the right type of healthcare provider and care pathway based on the user's situation |
| **Reports** | Summarises uploaded or typed medical report text into a layman-readable format |

Every analysis result is:
- **On-chain** — the transaction hash links to the GenLayer explorer for full auditability
- **Consensus-backed** — multiple independent AI validators must agree before a result is finalised
- **User-signed** — the user's own wallet signs every write transaction; the backend never holds private keys

---

## Architecture

```
care-bridge/
├── frontend/          Next.js 14 (App Router) — deployed on Vercel
├── backend/           FastAPI (Python 3.12) — deployed on Fly.io (always-on)
├── contracts/         GenLayer Intelligent Contract (Python)
└── scripts/           Database utilities
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy (async), PostgreSQL |
| Blockchain | GenLayer StudioNet (`genlayer-js` on frontend, `genlayer-py` for reads) |
| Wallet | AES-256-GCM encrypted key stored in sessionStorage; decrypted at login |
| Auth | JWT access tokens + refresh tokens, email verification via Brevo |
| Database | Fly Postgres (managed) |
| Deployment | Vercel (frontend), Fly.io (backend, always-on) |

---

## How the on-chain flow works

```
1. User fills in a form and clicks "Analyse"
2. Backend prepares a pending DB record and returns:
     { contract_address, method, args, record_id, submit_url, poll_url }
3. Frontend decrypts the user's wallet key from sessionStorage
4. Frontend calls genlayer-js writeContract() — user signs the tx
5. tx_hash is POSTed to the backend submit_url
6. Backend polls GenLayer until the tx is FINALIZED (up to 5 minutes)
7. Backend calls read_contract to fetch the consensus result
8. Frontend polls poll_url until status === "complete"
9. Result is displayed with a clickable on-chain proof link
```

The backend is **read-only** on GenLayer. It never signs, never holds a private key, and never submits write transactions. All writes are signed exclusively by the user.

---

## Contract

**Address:** `0xd5149cF96bB2A87066c7f95E96e1A1865e0A9AD1`  
**Network:** GenLayer StudioNet  
**Explorer:** https://explorer-studio.genlayer.com/

The contract (`contracts/CareBridgeIntelligence.py`) exposes write methods for each analysis type and corresponding read methods that return the consensus result after finalization. It uses GenLayer's `gl.eq_principle_prompt_comparative` for AI consensus and enforces unique `record_id` checks to prevent duplicate submissions.

---

## Features

- **10 health analysis sections** with full history persistence
- **Detail pages** for every analysis result — clean, layman-readable UI, no raw JSON
- **On-chain proof** — every tx hash is clickable and links to the GenLayer explorer
- **Document library** — all uploaded lab files saved and listed in one place
- **Notification bell** — tracks completed and failed analyses across all sections
- **Mobile responsive** — hamburger menu + slide-in drawer on small screens
- **Profile & wallet settings** — update name, language preference, view wallet address
- **Email verification** and **password reset** flows
- **Admin panel** — user management for platform operators

---

## Running locally

### Prerequisites

- Node.js 18+
- Python 3.12+
- PostgreSQL 16
- A GenLayer StudioNet account (for contract interaction)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Copy and fill in environment variables
cp .env.example .env.local

# Start dev server
npm run dev
```

### Environment variables

**Backend (`.env`)**

```
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
BREVO_API_KEY=...
GENLAYER_CONTRACT_ADDRESS=0xd5149cF96bB2A87066c7f95E96e1A1865e0A9AD1
FRONTEND_URL=http://localhost:3000
```

**Frontend (`.env.local`)**

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys from `main`; `cd frontend && npx vercel --prod` |
| Backend | Fly.io | `cd backend && fly deploy --remote-only`; `auto_stop_machines = false` keeps it always-on |
| Database | Fly Postgres | Managed by Fly.io |

---

## Security

- Passwords hashed with bcrypt
- JWT tokens (access + refresh) with short expiry
- User wallet keys encrypted with AES-256-GCM, stored only in sessionStorage (cleared on tab close)
- Backend never receives or stores plaintext private keys
- All write transactions signed exclusively on the client
- HTTPS enforced on all services
