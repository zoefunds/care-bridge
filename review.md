# Review Response: Non-Plain-Text File Uploads

**Question raised:** How do you handle a case when a user uploads a file that isn't plain text?

## Before

File type was inferred from the filename extension only (`.pdf` → PDF, everything else →
image). A non-PDF/non-image upload (`.txt`, `.docx`, `.exe`, a renamed file, etc.) was pushed
into the image-OCR path, where Pillow raised `UnidentifiedImageError`. That exception wasn't
caught, so the request failed with an unhandled `500`.

## After

`detect_file_type()` in [`backend/app/services/ocr/ocr_service.py`](backend/app/services/ocr/ocr_service.py)
now sniffs the actual file content instead of trusting the extension, and the upload route
(`POST /health/labs/upload` in [`backend/app/api/routes/health.py`](backend/app/api/routes/health.py))
dispatches to the matching extractor:

- Unsupported content → clean `400` with a message listing accepted types.
- A recognized type that still fails to parse (corrupt/truncated file) → `422`, logged via
  `logger.exception("ocr_extraction_failed", ...)`, instead of a raw `500`.

## Supported file types

| Type | Detection | Extraction |
|---|---|---|
| PDF | `%PDF-` magic bytes | `fitz` (PyMuPDF) text layer, falling back to OCR per page if the page has no text layer |
| JPEG / PNG / TIFF / BMP / WEBP | Valid image, decoded and verified via Pillow | `pytesseract` OCR |
| HEIC / HEIF (iPhone photos) | Valid image via `pillow-heif`-registered Pillow opener | `pytesseract` OCR |
| DOCX | ZIP signature (`PK\x03\x04`) that successfully opens as a Word document via `python-docx` | Paragraph and table cell text (no OCR) |
| Plain text / CSV | UTF-8 decodable, no null bytes | Direct decode (no OCR) |

Anything else (executables, other ZIP-based formats like `.xlsx`/`.pptx`/plain `.zip`,
corrupted files, empty uploads) is rejected with a `400 Unsupported file type`.

## New dependencies

- `pillow-heif==0.16.0`
- `python-docx==1.1.2`

(Both added to [`backend/requirements.txt`](backend/requirements.txt); not yet installed in the
local `.venv` — run `pip install -r requirements.txt` before testing the live endpoint.)

## Testing done

`detect_file_type()` verified in an isolated venv for: real PDF header, real DOCX (via
`python-docx`-generated file), a bare ZIP that is *not* a Word doc (correctly rejected), CSV
text, PNG image, empty bytes, and random binary garbage — all classified as expected. Full
endpoint testing blocked locally by the missing `pymupdf`/`Pillow` install noted above.

# Review Response: Wallet Key Not Available After Signup

**Feedback raised:** "Can't test this on our side — fix wallet key generation issue and add a
button for log out." Reproduced by creating a new account: visiting **Settings → Wallet →
Export Private Key** immediately after registering shows *"Wallet key not available — please
log in again,"* with no way to log out and retry.

## Root cause

The private key is never generated client-side — it's decrypted from an encrypted bundle
(`wallet_encrypted_key` / `wallet_key_salt` / `wallet_key_iv`) using the user's plaintext
password, and the result is cached in `sessionStorage`. That decrypt step only ran on the
**login** path
([`frontend/app/(auth)/login/page.tsx`](frontend/app/(auth)/login/page.tsx)):
`POST /auth/register` never returned the encrypted bundle in the first place
([`backend/app/api/routes/auth.py`](backend/app/api/routes/auth.py)), so a brand-new user who
registers and lands straight on `/dashboard` has no key in session — and, since there was no
logout control on the wallet page, no way to force the login flow that would populate it.

## Fix

- **Backend** — `POST /auth/register` now returns `wallet_encrypted_key`, `wallet_key_salt`,
  and `wallet_key_iv` alongside `wallet_address`, matching what `/auth/login` already returns
  ([`backend/app/api/routes/auth.py`](backend/app/api/routes/auth.py)).
- **Frontend** — [`frontend/app/(auth)/register/page.tsx`](frontend/app/(auth)/register/page.tsx)
  now builds the wallet bundle from the register response and calls `decryptWalletKey()` with
  the just-typed password, mirroring the login flow, so the key is cached in `sessionStorage`
  immediately after signup instead of only after a subsequent login.
- **Logout button** — added to the "not available" fallback state on
  [`frontend/app/(dashboard)/settings/wallet/page.tsx`](frontend/app/(dashboard)/settings/wallet/page.tsx),
  reusing the existing `useAuth().logout()` (already used by the sidebar nav), so a user who
  still hits this state has a direct way back to the login form instead of being stuck.

## Testing done

`npx tsc --noEmit` passes clean on the frontend. Not yet exercised end-to-end in a browser
against a running backend/DB — recommend a manual pass: register a new account, go straight to
Settings → Wallet, confirm the private key is shown (no "not available" message), and confirm
the logout button (if that state is ever hit) returns to `/login`.
