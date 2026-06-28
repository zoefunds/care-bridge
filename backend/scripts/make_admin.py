"""
Promote preciousmofeoluwa@gmail.com to admin and ensure account is active + verified.
Run: fly ssh console -a care-bridge-api -C "python scripts/make_admin.py"
"""
import os
import asyncio
import asyncpg

ADMIN_EMAIL = "preciousmofeoluwa@gmail.com"


async def main():
    url = os.environ["DATABASE_URL"]
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    url = url.split("?")[0]

    conn = await asyncpg.connect(url, ssl=False)
    try:
        row = await conn.fetchrow('SELECT id, email, role, is_active, is_verified FROM users WHERE email = $1', ADMIN_EMAIL)
        if not row:
            print(f"  ✗ User {ADMIN_EMAIL} not found. Register first, then re-run.")
            return

        await conn.execute(
            'UPDATE users SET role = $1, is_active = $2, is_verified = $3, updated_at = NOW() WHERE email = $4',
            "admin", True, True, ADMIN_EMAIL,
        )
        print(f"  ✓ {ADMIN_EMAIL} → role=admin, is_active=True, is_verified=True")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
