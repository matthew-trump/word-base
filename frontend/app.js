const API_BASE = "http://localhost:8026";

let languageMap = {};
let languageList = [];

async function fetchLanguageMap() {
    try {
        const res = await fetch(`${API_BASE}/api/languages`);
        const data = await res.json();
        languageMap = {};
        languageList = data.languages;
        data.languages.forEach((l) => { languageMap[l.code] = l.id; });
    } catch (err) {
        languageMap = {};
        languageList = [];
    }
}

function languageSelect(id, selectedCode) {
    const options = languageList
        .map((l) => `<option value="${l.code}"${l.code === selectedCode ? " selected" : ""}>${l.code} - ${l.name}</option>`)
        .join("");
    return `<select id="${id}">${options}</select>`;
}

function getDefaultLanguage() {
    return localStorage.getItem("lastWordLanguage") || "en";
}

function languageLink(code) {
    const id = languageMap[code];
    if (id) return `<a href="/language/${id}" data-link>${code}</a>`;
    return code;
}

const routes = {
    "/": homePage,
    "/test": testPage,
    "/words": wordsPage,
    "/add-word": addWordPage,
    "/languages": languagesPage,
    "/add-language": addLanguagePage,
};

function homePage() {
    return `
        <h1>Word Base</h1>
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
            <thead><tr><th>ID</th><th>Word</th><th>Part of Speech</th><th>Language</th></tr></thead>
            <tbody><tr><td colspan="4">Loading...</td></tr></tbody>
        </table>
    `;
}

function addWordPage() {
    return `
        <h1>Add Word</h1>
        <table>
            <tbody>
                <tr><th>Word</th><td><input type="text" id="new-word" placeholder="Enter word"></td></tr>
                <tr><th>Part of Speech</th><td><input type="text" id="new-pos" placeholder="Enter part of speech"></td></tr>
                <tr><th>Language</th><td id="add-word-lang-cell">Loading...</td></tr>
            </tbody>
        </table>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button id="add-save-btn" disabled>Save</button>
            <button id="add-reset-btn" class="btn-secondary">Reset</button>
        </div>
        <div id="add-word-message"></div>
    `;
}

function languagesPage() {
    return `
        <h1>Languages</h1>
        <table id="language-table">
            <thead><tr><th>ID</th><th>Code</th><th>Name</th></tr></thead>
            <tbody><tr><td colspan="3">Loading...</td></tr></tbody>
        </table>
    `;
}

function addLanguagePage() {
    return `
        <h1>Add Language</h1>
        <table>
            <tbody>
                <tr><th>Code</th><td><input type="text" id="new-lang-code" placeholder="e.g. en"></td></tr>
                <tr><th>Name</th><td><input type="text" id="new-lang-name" placeholder="e.g. English"></td></tr>
            </tbody>
        </table>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button id="add-lang-save-btn" disabled>Save</button>
            <button id="add-lang-reset-btn" class="btn-secondary">Reset</button>
        </div>
        <div id="add-lang-message"></div>
    `;
}

function languageDetailPage() {
    return `
        <h1>Language Detail</h1>
        <table id="language-detail">
            <tbody><tr><td>Loading...</td></tr></tbody>
        </table>
        <div id="language-actions" style="margin-top: 16px;"></div>
        <div id="language-message"></div>
        <p style="margin-top: 16px;"><a href="/languages" data-link>&larr; Back to language list</a></p>
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
    const langMatch = path.match(/^\/language\/(\d+)$/);
    if (langMatch) return { page: languageDetailPage, params: { id: langMatch[1], type: "language" } };
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
    if (path === "/add-word") {
        initAddWordForm();
    }
    if (path === "/languages") {
        loadLanguages();
    }
    if (path === "/add-language") {
        initAddLanguageForm();
    }
    if (params.type === "language" && page === languageDetailPage) {
        loadLanguageDetail(params.id);
    }
}

async function loadWords() {
    const tbody = document.querySelector("#word-table tbody");
    try {
        await fetchLanguageMap();
        const res = await fetch(`${API_BASE}/api/words`);
        const data = await res.json();
        tbody.innerHTML = data.words
            .map((w) => `<tr><td>${w.id}</td><td><a href="/word/${w.id}" data-link>${w.word}</a></td><td>${w.pos}</td><td>${languageLink(w.language)}</td></tr>`)
            .join("");
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4">Could not load words</td></tr>';
    }
}

let currentWord = null;

async function loadWordDetail(id) {
    const tbody = document.querySelector("#word-detail tbody");
    try {
        await fetchLanguageMap();
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
        <tr><th>Language</th><td>${languageLink(currentWord.language)}</td></tr>
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
        <tr><th>Language</th><td>${languageSelect("edit-language", currentWord.language)}</td></tr>
    `;
    actions.innerHTML = `
        <button id="save-btn" disabled>Save</button>
        <button id="cancel-btn" class="btn-secondary">Cancel</button>
    `;
    const wordInput = document.getElementById("edit-word");
    const posInput = document.getElementById("edit-pos");
    const langInput = document.getElementById("edit-language");
    const saveBtn = document.getElementById("save-btn");

    function checkChanges() {
        const changed = wordInput.value !== currentWord.word || posInput.value !== currentWord.pos || langInput.value !== currentWord.language;
        saveBtn.disabled = !changed;
    }

    wordInput.addEventListener("input", checkChanges);
    posInput.addEventListener("input", checkChanges);
    langInput.addEventListener("change", checkChanges);
    saveBtn.addEventListener("click", saveWord);
    document.getElementById("cancel-btn").addEventListener("click", renderWordView);
}

async function saveWord() {
    const wordVal = document.getElementById("edit-word").value;
    const posVal = document.getElementById("edit-pos").value;
    const langVal = document.getElementById("edit-language").value;
    const msgEl = document.getElementById("word-message");
    try {
        const res = await fetch(`${API_BASE}/api/word`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentWord.id, word: wordVal, pos: posVal, language: langVal }),
        });
        const data = await res.json();
        if (res.ok) {
            currentWord.word = wordVal;
            currentWord.pos = posVal;
            currentWord.language = langVal;
            await fetchLanguageMap();
            renderWordView();
            showMessage(msgEl, data.message, "success");
        } else {
            showMessage(msgEl, data.error || "Unknown error", "error");
        }
    } catch (err) {
        showMessage(msgEl, "Could not connect to server", "error");
    }
}

async function initAddWordForm() {
    await fetchLanguageMap();
    document.getElementById("add-word-lang-cell").innerHTML = languageSelect("new-language", getDefaultLanguage());

    const wordInput = document.getElementById("new-word");
    const posInput = document.getElementById("new-pos");
    const saveBtn = document.getElementById("add-save-btn");
    const resetBtn = document.getElementById("add-reset-btn");

    function checkFilled() {
        saveBtn.disabled = !wordInput.value.trim() || !posInput.value.trim();
    }

    wordInput.addEventListener("input", checkFilled);
    posInput.addEventListener("input", checkFilled);
    saveBtn.addEventListener("click", submitNewWord);
    resetBtn.addEventListener("click", () => {
        wordInput.value = "";
        posInput.value = "";
        document.getElementById("new-language").value = getDefaultLanguage();
        saveBtn.disabled = true;
    });
}

async function submitNewWord() {
    const wordVal = document.getElementById("new-word").value;
    const posVal = document.getElementById("new-pos").value;
    const langVal = document.getElementById("new-language").value;
    const msgEl = document.getElementById("add-word-message");
    try {
        const res = await fetch(`${API_BASE}/api/word`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word: wordVal, pos: posVal, language: langVal }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("lastWordLanguage", langVal);
            document.getElementById("new-word").value = "";
            document.getElementById("new-pos").value = "";
            document.getElementById("add-save-btn").disabled = true;
            showMessage(msgEl, data.message, "success");
        } else {
            showMessage(msgEl, data.error || "Unknown error", "error");
        }
    } catch (err) {
        showMessage(msgEl, "Could not connect to server", "error");
    }
}

// --- Languages ---

async function loadLanguages() {
    const tbody = document.querySelector("#language-table tbody");
    try {
        const res = await fetch(`${API_BASE}/api/languages`);
        const data = await res.json();
        if (data.languages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No languages yet</td></tr>';
        } else {
            tbody.innerHTML = data.languages
                .map((l) => `<tr><td>${l.id}</td><td><a href="/language/${l.id}" data-link>${l.code}</a></td><td>${l.name}</td></tr>`)
                .join("");
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Could not load languages</td></tr>';
    }
}

let currentLanguage = null;

async function loadLanguageDetail(id) {
    const tbody = document.querySelector("#language-detail tbody");
    try {
        const res = await fetch(`${API_BASE}/api/languages/${id}`);
        const data = await res.json();
        if (res.ok) {
            currentLanguage = data;
            renderLanguageView();
        } else {
            tbody.innerHTML = `<tr><td>${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = "<tr><td>Could not load language</td></tr>";
    }
}

function renderLanguageView() {
    const tbody = document.querySelector("#language-detail tbody");
    const actions = document.getElementById("language-actions");
    tbody.innerHTML = `
        <tr><th>ID</th><td>${currentLanguage.id}</td></tr>
        <tr><th>Code</th><td>${currentLanguage.code}</td></tr>
        <tr><th>Name</th><td>${currentLanguage.name}</td></tr>
    `;
    actions.innerHTML = `<button id="edit-lang-btn">Edit</button>`;
    document.getElementById("edit-lang-btn").addEventListener("click", enterLanguageEditMode);
}

function enterLanguageEditMode() {
    const tbody = document.querySelector("#language-detail tbody");
    const actions = document.getElementById("language-actions");
    tbody.innerHTML = `
        <tr><th>ID</th><td>${currentLanguage.id}</td></tr>
        <tr><th>Code</th><td><input type="text" id="edit-lang-code" value="${currentLanguage.code}"></td></tr>
        <tr><th>Name</th><td><input type="text" id="edit-lang-name" value="${currentLanguage.name}"></td></tr>
    `;
    actions.innerHTML = `
        <button id="save-lang-btn" disabled>Save</button>
        <button id="cancel-lang-btn" class="btn-secondary">Cancel</button>
    `;
    const codeInput = document.getElementById("edit-lang-code");
    const nameInput = document.getElementById("edit-lang-name");
    const saveBtn = document.getElementById("save-lang-btn");

    function checkChanges() {
        const changed = codeInput.value !== currentLanguage.code || nameInput.value !== currentLanguage.name;
        saveBtn.disabled = !changed;
    }

    codeInput.addEventListener("input", checkChanges);
    nameInput.addEventListener("input", checkChanges);
    saveBtn.addEventListener("click", saveLanguage);
    document.getElementById("cancel-lang-btn").addEventListener("click", renderLanguageView);
}

async function saveLanguage() {
    const codeVal = document.getElementById("edit-lang-code").value;
    const nameVal = document.getElementById("edit-lang-name").value;
    const msgEl = document.getElementById("language-message");
    try {
        const res = await fetch(`${API_BASE}/api/language`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentLanguage.id, code: codeVal, name: nameVal }),
        });
        const data = await res.json();
        if (res.ok) {
            currentLanguage.code = codeVal;
            currentLanguage.name = nameVal;
            renderLanguageView();
            showMessage(msgEl, data.message, "success");
        } else {
            showMessage(msgEl, data.error || "Unknown error", "error");
        }
    } catch (err) {
        showMessage(msgEl, "Could not connect to server", "error");
    }
}

function initAddLanguageForm() {
    const codeInput = document.getElementById("new-lang-code");
    const nameInput = document.getElementById("new-lang-name");
    const saveBtn = document.getElementById("add-lang-save-btn");
    const resetBtn = document.getElementById("add-lang-reset-btn");

    function checkFilled() {
        saveBtn.disabled = !codeInput.value.trim() || !nameInput.value.trim();
    }

    codeInput.addEventListener("input", checkFilled);
    nameInput.addEventListener("input", checkFilled);
    saveBtn.addEventListener("click", submitNewLanguage);
    resetBtn.addEventListener("click", () => {
        codeInput.value = "";
        nameInput.value = "";
        saveBtn.disabled = true;
    });
}

async function submitNewLanguage() {
    const codeVal = document.getElementById("new-lang-code").value;
    const nameVal = document.getElementById("new-lang-name").value;
    const msgEl = document.getElementById("add-lang-message");
    try {
        const res = await fetch(`${API_BASE}/api/language`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeVal, name: nameVal }),
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById("new-lang-code").value = "";
            document.getElementById("new-lang-name").value = "";
            document.getElementById("add-lang-save-btn").disabled = true;
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
