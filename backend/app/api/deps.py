from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# OAuth2PasswordBearer tells FastAPI to look for the 'Authorization: Bearer <token>' header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Reusable FastAPI dependency that protects endpoints:
    1. Extracts and decodes the JWT from the Authorization header.
    2. Validates the cryptographic signature and expiration timestamp.
    3. Looks up the User in the SQLite database.
    4. Returns the authenticated User object or raises HTTP 401 Unauthorized.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Decode and verify token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # 2. Extract the user ID from the 'sub' (subject) claim
    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    # 3. Verify user still exists in the database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user
