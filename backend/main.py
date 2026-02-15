import os
import sqlite3

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

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
    conn.execute("CREATE TABLE IF NOT EXISTS words (word TEXT NOT NULL, pos TEXT NOT NULL)")
    count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    if count == 0:
        words = ["horse", "cow", "cat", "dog", "pig", "rabbit"]
        conn.executemany("INSERT INTO words (word, pos) VALUES (?, ?)", [(w, "noun") for w in words])
        conn.commit()
    conn.close()


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/test")
def test():
    return {"message": "OK"}


@app.get("/api/words")
def get_words():
    conn = get_db()
    rows = conn.execute("SELECT rowid as id, word, pos FROM words").fetchall()
    conn.close()
    return {"words": [{"id": row["id"], "word": row["word"], "pos": row["pos"]} for row in rows]}


@app.get("/api/words/{word_id}")
def get_word(word_id: int):
    conn = get_db()
    row = conn.execute("SELECT rowid as id, word, pos FROM words WHERE rowid = ?", (word_id,)).fetchone()
    conn.close()
    if not row:
        return JSONResponse(status_code=404, content={"error": "Word not found"})
    return {"id": row["id"], "word": row["word"], "pos": row["pos"]}


class WordUpdate(BaseModel):
    id: int
    word: str
    pos: str


@app.put("/api/word")
def update_word(update: WordUpdate):
    conn = get_db()
    row = conn.execute("SELECT rowid as id FROM words WHERE rowid = ?", (update.id,)).fetchone()
    if not row:
        conn.close()
        return JSONResponse(status_code=404, content={"error": "Word not found"})
    conn.execute("UPDATE words SET word = ?, pos = ? WHERE rowid = ?", (update.word, update.pos, update.id))
    conn.commit()
    conn.close()
    return {"message": "Word updated successfully"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
