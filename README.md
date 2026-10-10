# Converter

Convert files on your phone or laptop. Nothing is uploaded, everything runs in your browser.

**Live:** https://nameabuser.github.io/converter/

## What it does
- **Image:** convert to JPEG, PNG, WebP or PDF. Rotate and crop first. HEIC photos work too.
- **PDF:** turn a PDF into text, a smaller PDF, or JPEG / PNG / WebP pages.
- **Text:** turn plain text into a PDF.
- Compression choice (none, medium, strong) to make files smaller.
- Light and dark theme, works offline, installs like an app.

## Use on iPhone
Open the live link in Safari, then Share > Add to Home Screen.

## Files
- `index.html`, `style.css`, `app.js` - the app
- `sw.js`, `manifest.webmanifest`, `icons/` - offline and home-screen install
- `lib/` - third-party libraries (jsPDF, PDF.js, heic2any) with their licenses where included

Host over HTTPS on any static host. GitHub Pages serves this repo from the main branch root.
