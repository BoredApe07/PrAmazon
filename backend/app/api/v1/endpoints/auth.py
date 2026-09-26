from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import cast

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new customer account:
    1. Validates that the email is not already taken.
    2. Hashes the plain-text password using bcrypt.
    3. Saves the new User record to the database.
    """
    # 1. Guard: Check for duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Hash the password before storing
    hashed_pwd = hash_password(user_in.password)

    # 3. Create database record
    new_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=hashed_pwd,
        name=user_in.name,
        role="customer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate an existing customer:
    1. Looks up the user by email.
    2. Verifies the password against the bcrypt hash.
    3. Issues and returns a signed JSON Web Token (JWT).
    """
    # 1. Look up user by email
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    
    # 2. Verify existence and password match
    if not user or not verify_password(credentials.password, cast(str, user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate signed JWT access token containing User ID and Role
    access_token = create_access_token(subject=user.id, role=cast(str, user.role))

    # 4. Return token and user profile
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Fetch the currently authenticated user's profile details.
    Requires a valid 'Authorization: Bearer <token>' header.
    """
    return current_user
