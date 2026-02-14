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
        <ul id="word-list"><li>Loading...</li></ul>
    `;
}

function navigate(path) {
    history.pushState(null, null, path);
    render();
}

function render() {
    const path = window.location.pathname;
    const page = routes[path] || homePage;
    document.getElementById("app").innerHTML = page();

    if (path === "/test") {
        document.getElementById("test-btn").addEventListener("click", runTest);
    }
    if (path === "/words") {
        loadWords();
    }
}

async function loadWords() {
    const list = document.getElementById("word-list");
    try {
        const res = await fetch(`${API_BASE}/words`);
        const data = await res.json();
        list.innerHTML = data.words.map((w) => `<li>${w}</li>`).join("");
    } catch (err) {
        list.innerHTML = "<li>Could not load words</li>";
    }
}

async function runTest() {
    const result = document.getElementById("test-result");
    try {
        const res = await fetch(`${API_BASE}/test`);
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
