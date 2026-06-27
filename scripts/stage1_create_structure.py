#!/usr/bin/env python3
"""Stage 1: Create full CareBridge project directory structure and base files."""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DIRS = [
    # Backend
    "backend/app/api/routes",
    "backend/app/core",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/services/genlayer",
    "backend/app/services/wallet",
    "backend/app/services/ocr",
    "backend/app/services/email",
    "backend/alembic/versions",
    # Frontend
    "frontend/app/(auth)/login",
    "frontend/app/(auth)/register",
    "frontend/app/(auth)/verify-email",
    "frontend/app/(auth)/forgot-password",
    "frontend/app/(auth)/reset-password",
    "frontend/app/(dashboard)/dashboard",
    "frontend/app/(dashboard)/lab-analysis/[id]",
    "frontend/app/(dashboard)/lab-analysis/upload",
    "frontend/app/(dashboard)/symptoms/[id]",
    "frontend/app/(dashboard)/timeline/add",
    "frontend/app/(dashboard)/reports/[id]",
    "frontend/app/(dashboard)/medications/[id]",
    "frontend/app/(dashboard)/doctor-visit/[id]",
    "frontend/app/(dashboard)/triage",
    "frontend/app/(dashboard)/settings/wallet",
    "frontend/app/(dashboard)/settings/privacy",
    "frontend/app/(dashboard)/settings/notifications",
    "frontend/app/(dashboard)/admin",
    "frontend/app/api/auth",
    "frontend/components/ui",
    "frontend/components/layout",
    "frontend/components/dashboard",
    "frontend/components/health",
    "frontend/components/forms",
    "frontend/components/charts",
    "frontend/lib",
    "frontend/hooks",
    "frontend/types",
    "frontend/public/images",
    "frontend/public/icons",
    # Contracts
    "contracts",
    # Scripts
    "scripts",
]

def create_dirs():
    for d in DIRS:
        path = os.path.join(ROOT, d)
        os.makedirs(path, exist_ok=True)
        gitkeep = os.path.join(path, ".gitkeep")
        if not os.listdir(path):
            open(gitkeep, "w").close()
    print(f"✓ Created {len(DIRS)} directories")

def write_file(rel_path, content):
    full = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"  → {rel_path}")

def create_root_files():
    # .gitignore
    write_file(".gitignore", """\
# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/
.venv/
venv/
env/
.env
.env.*
!.env.example

# Node
node_modules/
.next/
out/
.vercel/
*.local

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp

# Docker
*.log
docker-compose.override.yml

# Keys / secrets
*.pem
*.key
secrets/
""")

    # README.md
    write_file("README.md", """\
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
""")

    print("✓ Root files created")

def create_env_examples():
    write_file("backend/.env.example", """\
# Database
DATABASE_URL=postgresql+asyncpg://carebridge:password@localhost:5432/carebridge
DATABASE_URL_SYNC=postgresql://carebridge:password@localhost:5432/carebridge

# Security
SECRET_KEY=change-me-to-a-random-64-char-string
JWT_ALGORITHM=RS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Redis
REDIS_URL=rediss://default:...@host:6379

# Brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=preciousmofeoluwa@gmail.com
BREVO_SENDER_NAME=Care Bridge

# GenLayer
GENLAYER_NODE_URL=https://studio.genlayer.com/api
GENLAYER_CONTRACT_ADDRESS=
GENLAYER_VALIDATOR_COUNT=3

# App
APP_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
LOG_LEVEL=INFO
""")

    write_file("frontend/.env.example", """\
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Care Bridge
""")

    print("✓ .env.example files created")

if __name__ == "__main__":
    print("Stage 1: Creating CareBridge project structure...")
    create_dirs()
    create_root_files()
    create_env_examples()
    print("\n✓ Stage 1 complete.")
