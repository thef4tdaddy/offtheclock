
from app.database import SessionLocal
from app import models

db = SessionLocal()
users = db.query(models.User).all()
print(f"Total Users: {len(users)}")
for u in users:
    print(f"User ID: {u.id}, Email: {u.email}")
    cats = db.query(models.PTOCategory).filter(models.PTOCategory.user_id == u.id).all()
    print(f"  Categories: {[c.name for c in cats]}")

db.close()
