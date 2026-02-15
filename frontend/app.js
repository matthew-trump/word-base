const API_BASE = "http://localhost:8026";

const routes = {
    "/": homePage,
    "/test": testPage,
    "/words": wordsPage,
};

function homePage() {
    return `
        <h1>User Alpha</h1>
        <p>Secure user login and session scaffolding for web apps.</p>
    `;
}

function testPage() {
    return `
        <h1>Test</h1>
        <button id="test-btn">Test</button>
        <div id="test-result"></div>
    `;
}

function wordsPage() {
    return `
        <h1>Words</h1>
        <table id="word-table">
            <thead><tr><th>ID</th><th>Word</th><th>Part of Speech</th></tr></thead>
            <tbody><tr><td colspan="2">Loading...</td></tr></tbody>
        </table>
    `;
}

function navigate(path) {
    history.pushState(null, null, path);
    render();
}

function wordDetailPage() {
    return `
        <h1>Word Detail</h1>
        <table id="word-detail">
            <tbody><tr><td>Loading...</td></tr></tbody>
        </table>
        <div id="word-actions" style="margin-top: 16px;"></div>
        <div id="word-message"></div>
        <p style="margin-top: 16px;"><a href="/words" data-link>&larr; Back to word list</a></p>
    `;
}

function matchRoute(path) {
    if (routes[path]) return { page: routes[path], params: {} };
    const wordMatch = path.match(/^\/word\/(\d+)$/);
    if (wordMatch) return { page: wordDetailPage, params: { id: wordMatch[1] } };
    return { page: homePage, params: {} };
}

function render() {
    const path = window.location.pathname;
    const { page, params } = matchRoute(path);
    document.getElementById("app").innerHTML = page(params);

    if (path === "/test") {
        document.getElementById("test-btn").addEventListener("click", runTest);
    }
    if (path === "/words") {
        loadWords();
    }
    if (params.id && page === wordDetailPage) {
        loadWordDetail(params.id);
    }
}

async function loadWords() {
    const tbody = document.querySelector("#word-table tbody");
    try {
        const res = await fetch(`${API_BASE}/api/words`);
        const data = await res.json();
        tbody.innerHTML = data.words
            .map((w) => `<tr><td>${w.id}</td><td><a href="/word/${w.id}" data-link>${w.word}</a></td><td>${w.pos}</td></tr>`)
            .join("");
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Could not load words</td></tr>';
    }
}

let currentWord = null;

async function loadWordDetail(id) {
    const tbody = document.querySelector("#word-detail tbody");
    try {
        const res = await fetch(`${API_BASE}/api/words/${id}`);
        const data = await res.json();
        if (res.ok) {
            currentWord = data;
            renderWordView();
        } else {
            tbody.innerHTML = `<tr><td>${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = "<tr><td>Could not load word</td></tr>";
    }
}

function renderWordView() {
    const tbody = document.querySelector("#word-detail tbody");
    const actions = document.getElementById("word-actions");
    tbody.innerHTML = `
        <tr><th>ID</th><td>${currentWord.id}</td></tr>
        <tr><th>Word</th><td>${currentWord.word}</td></tr>
        <tr><th>Part of Speech</th><td>${currentWord.pos}</td></tr>
    `;
    actions.innerHTML = `<button id="edit-btn">Edit</button>`;
    document.getElementById("edit-btn").addEventListener("click", enterEditMode);
}

function enterEditMode() {
    const tbody = document.querySelector("#word-detail tbody");
    const actions = document.getElementById("word-actions");
    tbody.innerHTML = `
        <tr><th>ID</th><td>${currentWord.id}</td></tr>
        <tr><th>Word</th><td><input type="text" id="edit-word" value="${currentWord.word}"></td></tr>
        <tr><th>Part of Speech</th><td><input type="text" id="edit-pos" value="${currentWord.pos}"></td></tr>
    `;
    actions.innerHTML = `
        <button id="save-btn" disabled>Save</button>
        <button id="cancel-btn" class="btn-secondary">Cancel</button>
    `;
    const wordInput = document.getElementById("edit-word");
    const posInput = document.getElementById("edit-pos");
    const saveBtn = document.getElementById("save-btn");

    function checkChanges() {
        const changed = wordInput.value !== currentWord.word || posInput.value !== currentWord.pos;
        saveBtn.disabled = !changed;
    }

    wordInput.addEventListener("input", checkChanges);
    posInput.addEventListener("input", checkChanges);
    saveBtn.addEventListener("click", saveWord);
    document.getElementById("cancel-btn").addEventListener("click", renderWordView);
}

async function saveWord() {
    const wordVal = document.getElementById("edit-word").value;
    const posVal = document.getElementById("edit-pos").value;
    const msgEl = document.getElementById("word-message");
    try {
        const res = await fetch(`${API_BASE}/api/word`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentWord.id, word: wordVal, pos: posVal }),
        });
        const data = await res.json();
        if (res.ok) {
            currentWord.word = wordVal;
            currentWord.pos = posVal;
            renderWordView();
            showMessage(msgEl, data.message, "success");
        } else {
            showMessage(msgEl, data.error || "Unknown error", "error");
        }
    } catch (err) {
        showMessage(msgEl, "Could not connect to server", "error");
    }
}

async function runTest() {
    const result = document.getElementById("test-result");
    try {
        const res = await fetch(`${API_BASE}/api/test`);
        const data = await res.json();
        if (res.ok) {
            showMessage(result, "Test was successful", "success");
        } else {
            showMessage(result, data.error || "Unknown error", "error");
        }
    } catch (err) {
        showMessage(result, "Could not connect to server", "error");
    }
}

function showMessage(el, text, type) {
    el.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        el.innerHTML = "";
    }, 3000);
}

document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) {
        e.preventDefault();
        navigate(link.getAttribute("href"));
    }
});

window.addEventListener("popstate", render);

render();
