# Header visual QA

- Source visual truth: `/var/folders/gh/k41hsrq92w7837_gp_wybmt80000gn/T/TemporaryItems/NSIRD_screencaptureui_vaOdKj/Capture d’écran 2026-08-14 à 09.36.59.png`
- Implementation: browser-rendered `http://localhost:8080/`, captured in the Codex in-app browser.
- Viewport: 2048 × 360 CSS px; compared header crop: 2048 × 280 px.
- State: desktop, default navigation state.

## Comparison

The implementation matches the reference’s two-tier dark header: utility links above, green separator rules, text-only NEXIUM MARKETS wordmark with subtitle, centered three-item navigation, and paired rounded account/client actions. The visible globe and chevron use the existing icon library.

### Required fidelity surfaces

- Fonts and typography: high-weight, tracked uppercase wordmark and UI labels reproduce the visual hierarchy; navigation uses a softer semibold weight.
- Spacing and layout rhythm: measured desktop groups place the wordmark at 80 px, navigation from 672 px, and actions from 1471 px, matching the reference’s three-column rhythm.
- Colors and tokens: near-black surfaces, muted blue-gray dividers, white type, and neon green actions follow the source palette.
- Image quality and asset fidelity: no image assets are present in the selected header reference; the globe uses the existing icon library.
- Copy and content: labels match the supplied French reference, including `OUVRIR UN COMPTE` and `ESPACE CLIENT`.

## Interaction checks

- Primary navigation links, account action, and client-area action remain functional route links.
- Mobile menu remains available below the desktop breakpoint.
- Browser console was checked after reload; no current implementation errors were found. An earlier stale Vite HMR message referenced the already-removed experimental logo component and does not reproduce after reload.

## Findings

No actionable P0, P1, or P2 differences remain for the supplied desktop header crop.

final result: passed
