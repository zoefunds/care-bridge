"""
Clear all health/activity data, keep users and wallets intact.
Run on Fly: fly ssh console -a care-bridge-api -C "python scripts/clear_health_data.py"
"""
import os
import asyncio
import asyncpg

TABLES = [
    "lab_analyses",
    "symptom_analyses",
    "health_timeline",
    "medications",
    "documents",
    "audit_logs",
    "sessions",
    "email_verifications",
]

async def main():
    url = os.environ["DATABASE_URL"]
    url = url.replace("postgresql+asyncpg://", "postgresql://").replace("?sslmode=disable", "")

    conn = await asyncpg.connect(url)
    try:
        for table in TABLES:
            result = await conn.execute(f'DELETE FROM "{table}"')
            print(f"  ✓ {table}: {result}")
        print("\nDone — users and wallets untouched.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
