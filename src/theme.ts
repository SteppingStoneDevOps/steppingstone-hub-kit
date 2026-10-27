// Server-safe theme constants (no "use client"). A hub's server `app/layout.tsx` builds its
// no-flash <script> from these; importing THEME_KEY from the client ThemeProvider module gave the
// server a client reference instead of the string, so the inline script shipped Next's
// "Attempted to call THEME_KEY() from the server" text, threw a SyntaxError, and a saved light
// theme was not applied before paint (v0.23.0).

export type ThemeChoice = "light" | "dark";

/** localStorage key holding the user's theme choice. */
export const THEME_KEY = "th-theme";

/**
 * Inline script for the root layout's <head>: applies the saved theme before first paint (dark
 * unless "light" is stored). Render with
 * `<script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />`.
 */
export const noFlashThemeScript = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');document.documentElement.setAttribute('data-theme',c==='light'?'light':'dark');}catch(e){}})();`;
