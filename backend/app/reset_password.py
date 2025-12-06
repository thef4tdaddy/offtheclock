import sys

from app import models, security
from app.database import SessionLocal


def reset_password(email: str, new_password: str) -> None:
    db = SessionLocal()

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"User {email} not found")
        return

    hashed_password = security.get_password_hash(new_password)
    user.hashed_password = hashed_password  # type: ignore
    db.commit()
    print(f"Password for {email} updated successfully!")
    db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.app.reset_password <email> <new_password>")
    else:
        reset_password(sys.argv[1], sys.argv[2])
