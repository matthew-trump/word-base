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
    conn.execute(
        "CREATE TABLE IF NOT EXISTS languages ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "code TEXT NOT NULL UNIQUE, "
        "name TEXT NOT NULL)"
    )
    lang_count = conn.execute("SELECT COUNT(*) FROM languages").fetchone()[0]
    if lang_count == 0:
        conn.execute("INSERT INTO languages (code, name) VALUES (?, ?)", ("en", "English"))
        conn.commit()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS words ("
        "word TEXT NOT NULL, "
        "pos TEXT NOT NULL, "
        "language TEXT NOT NULL DEFAULT 'en', "
        "FOREIGN KEY (language) REFERENCES languages(code))"
    )
    word_count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    if word_count == 0:
        words = ["horse", "cow", "cat", "dog", "pig", "rabbit"]
        conn.executemany("INSERT INTO words (word, pos, language) VALUES (?, ?, ?)", [(w, "noun", "en") for w in words])
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
    rows = conn.execute("SELECT rowid as id, word, pos, language FROM words").fetchall()
    conn.close()
    return {"words": [{"id": row["id"], "word": row["word"], "pos": row["pos"], "language": row["language"]} for row in rows]}


@app.get("/api/words/{word_id}")
def get_word(word_id: int):
    conn = get_db()
    row = conn.execute("SELECT rowid as id, word, pos, language FROM words WHERE rowid = ?", (word_id,)).fetchone()
    conn.close()
    if not row:
        return JSONResponse(status_code=404, content={"error": "Word not found"})
    return {"id": row["id"], "word": row["word"], "pos": row["pos"], "language": row["language"]}


class WordCreate(BaseModel):
    word: str = ""
    pos: str = ""
    language: str = ""


class WordUpdate(BaseModel):
    id: int
    word: str
    pos: str
    language: str


@app.post("/api/word")
def create_word(body: WordCreate):
    if not body.word.strip() or not body.pos.strip() or not body.language.strip():
        return JSONResponse(status_code=400, content={"error": "Fields 'word', 'pos', and 'language' are required"})
    conn = get_db()
    lang = conn.execute("SELECT code FROM languages WHERE code = ?", (body.language.strip(),)).fetchone()
    if not lang:
        conn.close()
        return JSONResponse(status_code=400, content={"error": f"Language '{body.language}' not found"})
    cursor = conn.execute("INSERT INTO words (word, pos, language) VALUES (?, ?, ?)", (body.word.strip(), body.pos.strip(), body.language.strip()))
    conn.commit()
    word_id = cursor.lastrowid
    conn.close()
    return {"message": f"Word created successfully with id {word_id}", "id": word_id}


@app.put("/api/word")
def update_word(update: WordUpdate):
    conn = get_db()
    row = conn.execute("SELECT rowid as id FROM words WHERE rowid = ?", (update.id,)).fetchone()
    if not row:
        conn.close()
        return JSONResponse(status_code=404, content={"error": "Word not found"})
    lang = conn.execute("SELECT code FROM languages WHERE code = ?", (update.language,)).fetchone()
    if not lang:
        conn.close()
        return JSONResponse(status_code=400, content={"error": f"Language '{update.language}' not found"})
    conn.execute("UPDATE words SET word = ?, pos = ?, language = ? WHERE rowid = ?", (update.word, update.pos, update.language, update.id))
    conn.commit()
    conn.close()
    return {"message": "Word updated successfully"}


# --- Languages ---

class LanguageCreate(BaseModel):
    code: str = ""
    name: str = ""


class LanguageUpdate(BaseModel):
    id: int
    code: str
    name: str


@app.get("/api/languages")
def get_languages():
    conn = get_db()
    rows = conn.execute("SELECT id, code, name FROM languages").fetchall()
    conn.close()
    return {"languages": [{"id": row["id"], "code": row["code"], "name": row["name"]} for row in rows]}


@app.get("/api/languages/{lang_id}")
def get_language(lang_id: int):
    conn = get_db()
    row = conn.execute("SELECT id, code, name FROM languages WHERE id = ?", (lang_id,)).fetchone()
    conn.close()
    if not row:
        return JSONResponse(status_code=404, content={"error": "Language not found"})
    return {"id": row["id"], "code": row["code"], "name": row["name"]}


@app.post("/api/language")
def create_language(body: LanguageCreate):
    if not body.code.strip() or not body.name.strip():
        return JSONResponse(status_code=400, content={"error": "Both 'code' and 'name' fields are required"})
    conn = get_db()
    existing = conn.execute("SELECT code FROM languages WHERE code = ?", (body.code.strip(),)).fetchone()
    if existing:
        conn.close()
        return JSONResponse(status_code=400, content={"error": f"Language code '{body.code}' already exists"})
    cursor = conn.execute("INSERT INTO languages (code, name) VALUES (?, ?)", (body.code.strip(), body.name.strip()))
    conn.commit()
    lang_id = cursor.lastrowid
    conn.close()
    return {"message": f"Language created successfully with id {lang_id}", "id": lang_id}


@app.put("/api/language")
def update_language(update: LanguageUpdate):
    conn = get_db()
    row = conn.execute("SELECT id FROM languages WHERE id = ?", (update.id,)).fetchone()
    if not row:
        conn.close()
        return JSONResponse(status_code=404, content={"error": "Language not found"})
    conn.execute("UPDATE languages SET code = ?, name = ? WHERE id = ?", (update.code, update.name, update.id))
    conn.commit()
    conn.close()
    return {"message": "Language updated successfully"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
