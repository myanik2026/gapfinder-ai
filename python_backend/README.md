# GapFinder AI Python backend

This folder contains the Python version of the GapFinder study app, including a FastAPI API and a lightweight HTML interface for studying from notes.

## Features

- Python-first study workflow using FastAPI
- Quiz generation and question answering grounded in the uploaded source text
- Citation-backed explanations
- Sample fallback content when `GROQ_API_KEY` is not configured
- Simple browser UI at `/`

## Setup

```bash
cd python_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Add your Groq key to a `.env` file or export it in the shell:

```bash
set GROQ_API_KEY=your_key_here
```

## Run

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Then open:

- `http://localhost:8000/` for the HTML app
- `POST /api/study` for the API
- `POST /study` as a compatibility alias

The request format stays aligned with the TypeScript API used by the main GapFinder project.
