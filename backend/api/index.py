from backend.app.main import app

# Tell FastAPI we are running behind a proxy at /api
app.root_path = "/api"
