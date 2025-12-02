from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app import models, security
import sys

def reset_password(email, new_password):
    db = SessionLocal()
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"User {email} not found.")
        db.close()
        return

    hashed_password = security.get_password_hash(new_password)
    user.hashed_password = hashed_password
    db.commit()
    print(f"Password for {email} updated successfully!")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.app.reset_password <email> <new_password>")
    else:
        reset_password(sys.argv[1], sys.argv[2])
