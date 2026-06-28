"""
Care Bridge — End-to-end on-chain test script.

Flow:
  1. Login via backend API → receive encrypted wallet bundle
  2. Decrypt user's private key (PBKDF2 + AES-GCM) — user signs own txns
  3. Call each health feature on GenLayer contract using user's own key
  4. Poll until FINALIZED (real consensus)
  5. Read result from contract
  6. POST result to backend to persist

Run: python3 test_onchain.py
"""

import asyncio, base64, hashlib, json, time, uuid, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import httpx

BACKEND = "https://care-bridge-api.fly.dev/api/v1"
EMAIL    = "preciousmofeoluwa@gmail.com"
PASSWORD = "Password123!"

CONTRACT_ADDRESS = "0x93980C1dCf09cFE55B6d18B80e6f12aD2Cce4e7c"
GENLAYER_RPC     = "https://studio.genlayer.com/api"

# ── Wallet decryption ─────────────────────────────────────────────────────────

def decrypt_wallet_key(encrypted_key: str, key_salt: str, key_iv: str, password: str) -> str:
    salt      = base64.b64decode(key_salt)
    iv        = base64.b64decode(key_iv)
    encrypted = base64.b64decode(encrypted_key)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=310_000)
    aes_key = kdf.derive(password.encode())
    plain_bytes = AESGCM(aes_key).decrypt(iv, encrypted, None)
    return "0x" + plain_bytes.hex()

# ── GenLayer SDK helpers ──────────────────────────────────────────────────────

def get_sdk_client(account):
    from genlayer_py.chains.studionet import studionet
    from genlayer_py.client.genlayer_client import GenLayerClient as SDKClient
    return SDKClient(chain_config=studionet, account=account)

def make_account(private_key: str):
    from eth_account import Account
    return Account.from_key(private_key)

def _make_record_id() -> str:
    return uuid.uuid4().hex

def _payload_hash(*parts: str) -> str:
    return hashlib.sha256(":".join(parts).encode()).hexdigest()

async def _run_sync(fn, *args):
    loop = asyncio.get_event_loop()
    import functools
    return await loop.run_in_executor(None, functools.partial(fn, *args))

async def poll_finalized(tx_hash: str, label: str, timeout: int = 600) -> bool:
    """
    Poll until FINALIZED or ACCEPTED (validators agreed, result readable).
    ACCEPTED → result is already stored in contract state, safe to read.
    FINALIZED → fully committed on-chain.
    """
    FAIL = {"UNDETERMINED", "CANCELED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"}
    polls = timeout // 6
    for i in range(polls):
        await asyncio.sleep(6)
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                resp = await c.post(GENLAYER_RPC, json={
                    "jsonrpc": "2.0", "id": 1,
                    "method": "eth_getTransactionByHash",
                    "params": [tx_hash],
                })
                tx = resp.json().get("result")
                if not tx:
                    print(f"  [{label}] poll {i+1}: waiting…")
                    continue
                status = str(tx.get("status") or "").upper()
                print(f"  [{label}] poll {i+1}: {status}")
                if status in ("FINALIZED", "ACCEPTED"):
                    # ACCEPTED means validators reached consensus — result is readable
                    return True
                if status in FAIL:
                    print(f"  [{label}] FAILED with status: {status}")
                    return False
        except Exception as e:
            print(f"  [{label}] poll error: {e}")
    return False

async def write_and_read(sdk, account, write_method: str, write_args: list, read_method: str, read_args: list, label: str):
    print(f"\n→ Calling {write_method}…")
    tx_hash_bytes = await _run_sync(
        sdk.write_contract,
        CONTRACT_ADDRESS,
        write_method,
        account,
        None,   # consensus_max_rotations
        0,      # value
        False,  # leader_only
        write_args,
        None,   # kwargs
    )
    tx_hash = tx_hash_bytes.hex() if hasattr(tx_hash_bytes, "hex") else str(tx_hash_bytes)
    print(f"  tx_hash: {tx_hash}")

    finalized = await poll_finalized(tx_hash, label)
    if not finalized:
        return tx_hash, {"error": "consensus not reached"}

    print(f"  FINALIZED ✓ — reading result…")
    raw = await _run_sync(sdk.read_contract, CONTRACT_ADDRESS, read_method, read_args, None, account)
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", errors="replace")
    if isinstance(raw, str):
        text = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        try:
            result = json.loads(text)
        except Exception:
            s, e = text.find("{"), text.rfind("}") + 1
            result = json.loads(text[s:e]) if s != -1 and e > s else {"raw": raw}
    else:
        result = raw or {}
    return tx_hash, result

# ── Backend helpers ───────────────────────────────────────────────────────────

async def backend_post(token: str, path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(
            f"{BACKEND}{path}",
            json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        return resp.json()

# ── Test sections ─────────────────────────────────────────────────────────────

async def test_symptoms(sdk, account, token):
    symptoms = [
        {"name": "Persistent headache", "duration": "3 days", "severity": "moderate"},
        {"name": "Fatigue", "duration": "1 week", "severity": "mild"},
        {"name": "Blurred vision", "duration": "1 day", "severity": "mild"},
    ]
    context = {"duration": "1 week", "severity": "moderate", "age": 30, "gender": "female"}
    record_id = _make_record_id()
    user_ref  = account.address
    syms_json = json.dumps(symptoms)
    ctx_json  = json.dumps(context)
    ph        = _payload_hash(record_id, user_ref, syms_json)

    tx, result = await write_and_read(
        sdk, account,
        "analyze_symptoms", [record_id, user_ref, syms_json, ctx_json, ph],
        "get_symptom_analysis", [record_id],
        "symptoms"
    )
    print(f"  Result: {json.dumps(result, indent=2)[:300]}")
    await backend_post(token, "/health/symptoms/analyze", {
        "symptoms": [s["name"] for s in symptoms],
        "duration": "1 week", "severity": "moderate",
        "tx_hash": tx, "genlayer_result": result
    })
    return tx, result

async def test_lab_results(sdk, account, token):
    markers = [
        {"name": "Hemoglobin", "value": 11.2, "unit": "g/dL", "reference_range": "12.0-16.0"},
        {"name": "Glucose",    "value": 108,  "unit": "mg/dL", "reference_range": "70-100"},
        {"name": "Cholesterol","value": 210,  "unit": "mg/dL", "reference_range": "<200"},
    ]
    context   = {"patient_age": 30, "gender": "female"}
    record_id = _make_record_id()
    user_ref  = account.address
    m_json    = json.dumps(markers)
    c_json    = json.dumps(context)
    ph        = _payload_hash(record_id, user_ref, m_json)

    tx, result = await write_and_read(
        sdk, account,
        "analyze_lab_results", [record_id, user_ref, m_json, c_json, ph],
        "get_lab_analysis", [record_id],
        "lab_results"
    )
    print(f"  Result: {json.dumps(result, indent=2)[:300]}")
    await backend_post(token, "/health/labs/analyze", {
        "markers": markers, "tx_hash": tx, "genlayer_result": result
    })
    return tx, result

async def test_medications(sdk, account, token):
    medications = ["Metformin 500mg", "Lisinopril 10mg", "Atorvastatin 20mg"]
    record_id = _make_record_id()
    user_ref  = account.address
    m_json    = json.dumps(medications)
    ph        = _payload_hash(record_id, user_ref, m_json)

    tx, result = await write_and_read(
        sdk, account,
        "explain_medications", [record_id, user_ref, m_json, "{}", ph],
        "get_medication_analysis", [record_id],
        "medications"
    )
    print(f"  Result: {json.dumps(result, indent=2)[:300]}")
    await backend_post(token, "/health/medications/analyze", {
        "medications": medications, "tx_hash": tx, "genlayer_result": result
    })
    return tx, result

async def test_report_summary(sdk, account, token):
    report_text = (
        "Patient: Precious Mofe. Chest X-ray: Lungs clear bilaterally. "
        "No consolidation, pleural effusion, or pneumothorax. "
        "Cardiac silhouette normal. Impression: Normal chest radiograph."
    )
    report_type = "radiology"
    record_id   = _make_record_id()
    user_ref    = account.address
    ph          = _payload_hash(record_id, user_ref, report_text[:200])

    tx, result = await write_and_read(
        sdk, account,
        "summarize_report", [record_id, user_ref, report_text, report_type, ph],
        "get_report_summary", [record_id],
        "report_summary"
    )
    print(f"  Result: {json.dumps(result, indent=2)[:300]}")
    await backend_post(token, "/health/reports/summarize", {
        "report_text": report_text, "report_type": report_type,
        "tx_hash": tx, "genlayer_result": result
    })
    return tx, result

async def test_triage(sdk, account, token):
    input_data = {
        "symptoms": ["Chest tightness", "Shortness of breath", "Left arm numbness"],
        "history": "Hypertension, on Lisinopril 10mg",
        "age": 55, "gender": "male",
    }
    record_id = _make_record_id()
    user_ref  = account.address
    i_json    = json.dumps(input_data)
    ph        = _payload_hash(record_id, user_ref, i_json[:200])

    tx, result = await write_and_read(
        sdk, account,
        "triage_patient", [record_id, user_ref, i_json, ph],
        "get_triage", [record_id],
        "triage"
    )
    print(f"  Result: {json.dumps(result, indent=2)[:300]}")
    await backend_post(token, "/health/triage", {
        "symptoms": input_data["symptoms"], "history_notes": input_data["history"],
        "tx_hash": tx, "genlayer_result": result
    })
    return tx, result

# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("Care Bridge — On-chain GenLayer Integration Test")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Login
        print("\n[1] Logging in…")
        resp = await client.post(f"{BACKEND}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        login = resp.json()
        token  = login["access_token"]
        wallet = login["wallet_address"]
        print(f"  ✓ Logged in | wallet: {wallet}")

        # 2. Decrypt user's private key
        print("\n[2] Decrypting wallet key (user signs own transactions)…")
        private_key = decrypt_wallet_key(
            login["wallet_encrypted_key"],
            login["wallet_key_salt"],
            login["wallet_key_iv"],
            PASSWORD,
        )
        account = make_account(private_key)
        print(f"  ✓ Wallet decrypted | address: {account.address}")
        assert account.address.lower() == wallet.lower(), "Address mismatch!"

        # 3. Init SDK with user's account
        print("\n[3] Initialising GenLayer SDK…")
        sdk = get_sdk_client(account)
        print(f"  ✓ SDK ready | contract: {CONTRACT_ADDRESS}")

        results = {}

        # 4. Run each test
        sections = [
            ("Symptom Analysis",   test_symptoms),
            ("Lab Results",        test_lab_results),
            ("Medications",        test_medications),
            ("Report Summary",     test_report_summary),
            ("Triage",             test_triage),
        ]

        for name, fn in sections:
            print(f"\n{'='*60}")
            print(f"SECTION: {name}")
            print('='*60)
            try:
                tx, result = await fn(sdk, account, token)
                ok = bool(result and "error" not in result)
                results[name] = {"status": "✅ PASS" if ok else "⚠️  TX SENT, NO CONSENSUS", "tx": tx}
            except Exception as e:
                print(f"  ❌ ERROR: {e}")
                results[name] = {"status": "❌ FAIL", "error": str(e)}

        # 5. Summary
        print(f"\n{'='*60}")
        print("RESULTS SUMMARY")
        print('='*60)
        for name, r in results.items():
            status = r["status"]
            tx = r.get("tx", "N/A")
            print(f"  {status}  {name}")
            if tx and tx != "N/A":
                print(f"         tx: {tx}")
        print()

if __name__ == "__main__":
    asyncio.run(main())
