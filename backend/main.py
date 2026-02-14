import os
import sqlite3

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "user_alpha.db"))
PORT = int(os.getenv("PORT", "8026"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("CREATE TABLE IF NOT EXISTS words (word TEXT NOT NULL)")
    count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    if count == 0:
        words = ["horse", "cow", "cat", "dog", "pig", "rabbit"]
        conn.executemany("INSERT INTO words (word) VALUES (?)", [(w,) for w in words])
        conn.commit()
    conn.close()


@app.on_event("startup")
def startup():
    init_db()


@app.get("/test")
def test():
    return {"message": "OK"}


@app.get("/words")
def get_words():
    conn = get_db()
    rows = conn.execute("SELECT word FROM words").fetchall()
    conn.close()
    return {"words": [row["word"] for row in rows]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
