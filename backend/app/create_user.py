import sys

from app import models, security
from app.database import SessionLocal


def create_user(email: str, password: str) -> None:
    db = SessionLocal()
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        print(f"User {email} already exists")
        return

    hashed_password = security.get_password_hash(password)
    user = models.User(email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    print(f"User {email} created successfully")
    db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_user.py <email> <password>")
        sys.exit(1)

    create_user(sys.argv[1], sys.argv[2])
