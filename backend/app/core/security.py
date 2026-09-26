from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import bcrypt
import jwt  # type: ignore[reportMissingImports]

from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt with a randomized cryptographic salt.
    Never store raw passwords in the database!
    """
    # 1. Convert string password to bytes
    password_bytes = password.encode("utf-8")
    # 2. Generate a secure random salt (cost factor default is 12)
    salt = bcrypt.gensalt()
    # 3. Hash the password and decode back to string to store in SQLite/Postgres
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if a user-supplied plain-text password matches the stored bcrypt hash.
    Returns True if valid, False otherwise.
    """
    try:
        plain_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(subject: Union[str, Any], role: str = "customer", expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a cryptographically signed JSON Web Token (JWT).
    
    Payload contains:
    - 'sub': Subject (typically User ID or Email)
    - 'role': Customer or Admin role for RBAC
    - 'exp': Expiration timestamp (UTC)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates the signature and expiration of a JWT.
    Returns the payload dictionary if valid, or None if expired / tampered.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
