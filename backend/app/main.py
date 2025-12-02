from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, pto

# Create tables (for simplicity in this initial phase)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Include Routers
app.include_router(auth.router)
app.include_router(pto.router)

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "https://offtheclock.vercel.app", # Example production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now to avoid issues, restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Off The Clock API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
