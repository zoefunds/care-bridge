import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from eth_account import Account

Account.enable_unaudited_hdwallet_features()


def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=310_000,
    )
    return kdf.derive(password.encode())


def generate_wallet(password: str) -> dict:
    account, mnemonic = Account.create_with_mnemonic()

    salt = os.urandom(32)
    iv = os.urandom(12)
    key = _derive_key(password, salt)

    private_key_hex = account.key.hex()
    if private_key_hex.startswith("0x"):
        private_key_hex = private_key_hex[2:]
    private_key_bytes = bytes.fromhex(private_key_hex)

    aesgcm = AESGCM(key)
    encrypted = aesgcm.encrypt(iv, private_key_bytes, None)

    return {
        "address": account.address,
        "encrypted_key": base64.b64encode(encrypted).decode(),
        "key_salt": base64.b64encode(salt).decode(),
        "key_iv": base64.b64encode(iv).decode(),
    }


def decrypt_private_key(encrypted_key: str, key_salt: str, key_iv: str, password: str) -> bytes:
    salt = base64.b64decode(key_salt)
    iv = base64.b64decode(key_iv)
    encrypted = base64.b64decode(encrypted_key)
    key = _derive_key(password, salt)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, encrypted, None)


def export_wallet_bundle(
    encrypted_key: str,
    key_salt: str,
    key_iv: str,
    current_password: str,
    export_passphrase: str,
) -> dict:
    private_key_bytes = decrypt_private_key(encrypted_key, key_salt, key_iv, current_password)

    export_salt = os.urandom(32)
    export_iv = os.urandom(12)
    export_key = _derive_key(export_passphrase, export_salt)
    aesgcm = AESGCM(export_key)
    re_encrypted = aesgcm.encrypt(export_iv, private_key_bytes, None)

    return {
        "encrypted_private_key": base64.b64encode(re_encrypted).decode(),
        "salt": base64.b64encode(export_salt).decode(),
        "iv": base64.b64encode(export_iv).decode(),
        "notice": (
            "Keep this bundle safe. Decrypt with your export passphrase to recover your private key."
        ),
    }
