from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app import models, security
import sys

def create_user(email, password):
    db = SessionLocal()
    
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        print(f"User {email} already exists.")
        db.close()
        return

    hashed_password = security.get_password_hash(password)
    user = models.User(email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    print(f"User {email} created successfully!")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.app.create_user <email> <password>")
    else:
        create_user(sys.argv[1], sys.argv[2])
