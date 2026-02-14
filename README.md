# User Alpha

Full-stack scaffolding for secure user logins and sessions in web apps.

## Architecture

- **Frontend:** Vanilla HTML/CSS/JavaScript single-page app
- **Backend:** Python FastAPI on port 8026
- **Database:** SQLite

## Setup

```bash
# Create and activate virtual environment
python3 -m venv env
source env/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp .env-example .env
```

## Running

```bash
# Start the backend (from project root, with venv activated)
python backend/main.py

# Start the frontend (in a separate terminal)
cd frontend && python3 -m http.server 5500
```

- Frontend: http://localhost:5500
- Backend API: http://localhost:8026
