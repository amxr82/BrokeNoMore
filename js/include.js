const THEME_STORAGE_KEY = "bnm-theme";

function getPreferredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
    } catch {
        // ignore
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("theme-dark", isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
}

// Apply as early as possible to reduce theme flash
applyTheme(getPreferredTheme());

function initThemeToggle() {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    const iconEl = btn.querySelector(".theme-toggle__icon");
    const labelEl = btn.querySelector(".theme-toggle__label");

    const moonSvg =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M21 13.4A8.5 8.5 0 0 1 10.6 3.2a.75.75 0 0 0-1.05-.9A9.5 9.5 0 1 0 21.9 14.45a.75.75 0 0 0-.9-1.05Z"/></svg>';
    const sunSvg =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></g></svg>';

    const render = () => {
        const isDark = document.documentElement.classList.contains("theme-dark");

        // Match screenshot behavior: show the *target* theme on the button
        const nextTheme = isDark ? "light" : "dark";
        btn.dataset.nextTheme = nextTheme;

        btn.setAttribute("aria-pressed", isDark ? "true" : "false");
        btn.setAttribute(
            "aria-label",
            nextTheme === "dark" ? "Zu Dark wechseln" : "Zu Light wechseln"
        );

        if (labelEl) labelEl.textContent = nextTheme === "dark" ? "Dark" : "Light";
        if (iconEl) iconEl.innerHTML = nextTheme === "dark" ? moonSvg : sunSvg;
    };

    render();

    btn.addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("theme-dark");
        const next = isDark ? "light" : "dark";
        applyTheme(next);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // ignore
        }

        render();
        if (typeof window.__setHeaderSpace === "function") {
            window.__setHeaderSpace();
        }
    });

    // If user didn't explicitly choose, follow system changes
    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onSystemChange = () => {
        let hasStored = false;
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            hasStored = stored === "dark" || stored === "light";
        } catch {
            hasStored = false;
        }
        if (hasStored) return;
        applyTheme(mq && mq.matches ? "dark" : "light");
        render();
    };

    if (mq && typeof mq.addEventListener === "function") {
        mq.addEventListener("change", onSystemChange);
    } else if (mq && typeof mq.addListener === "function") {
        mq.addListener(onSystemChange);
    }
}

function initScrollHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const threshold = 48;
    let ticking = false;

    const update = () => {
        const scrolled = window.scrollY > threshold;
        header.classList.toggle("is-scrolled", scrolled);
        if (typeof window.__setHeaderSpace === "function") {
            window.__setHeaderSpace();
        }
        ticking = false;
    };

    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
}

function initHeaderSpacer() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const setSpace = () => {
        const rect = header.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(header).top || "0") || 0;
        const space = Math.ceil(rect.height + top + 18);
        document.documentElement.style.setProperty("--header-space", `${space}px`);
    };

    window.__setHeaderSpace = setSpace;

    setSpace();
    window.addEventListener("resize", setSpace);
}

document.addEventListener("DOMContentLoaded", async () => {
    const includes = Array.from(document.querySelectorAll("[data-include]"));

    await Promise.all(
        includes.map(async (el) => {
            try {
                const res = await fetch(el.getAttribute("data-include"));
                const data = await res.text();
                el.innerHTML = data;
            } catch (err) {
                console.error("Include-Fehler:", err);
            }
        })
    );

    initThemeToggle();
    initHeaderSpacer();
    initScrollHeader();
});
