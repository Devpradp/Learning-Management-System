# Learning Management System

A full-stack LMS built with **Django REST Framework** (backend) and **Next.js** (frontend).

## Getting Started

You need two terminals running simultaneously. One for the backend, one for the frontend.

### Backend (Django)

```bash
cd backend

# First time only: create and activate the virtual environment
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
python manage.py migrate

# Start the dev server
source env/bin/activate
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### Frontend (Next.js)

```bash
cd frontend

# First time only: install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:3000` in your browser.