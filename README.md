# Care Bridge

A GenLayer-powered Medical Intelligence Platform where Intelligent Contracts and GenLayer LLM validators collaboratively interpret, verify, explain, and audit patient health information through multi-model consensus.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS → Vercel
- **Backend**: FastAPI (Python 3.11), PostgreSQL 16 (Docker) → Fly.io
- **Cache**: Upstash Redis
- **Email**: Brevo
- **Blockchain**: GenLayer StudioNet

## Structure

```
care-bridge/
├── frontend/     Next.js application
├── backend/      FastAPI application
├── contracts/    GenLayer Intelligent Contract
└── scripts/      Setup and utility scripts
```

## Disclaimer

Care Bridge is a clinical decision support tool. It does not diagnose, treat, or replace professional medical advice.
