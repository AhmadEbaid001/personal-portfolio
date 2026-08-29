# Personal portfolio — Ahmed Mohamed Ebaid

Static single-page portfolio. No framework, no build step, no dependencies — three
files served as-is.

**Live:** deployed behind Cloudflare → HAProxy → on-premises origin.

---

## Structure

```
index.html    the whole page
styles.css    design tokens + layout
script.js     theme, navigation, scroll reveals, three interactive figures
health.html   plain "OK" body — the target of the HAProxy health check
cv/           LaTeX sources for the résumé PDFs
```

## Running locally

Any static server will do:

```bash
python -m http.server 5173
```

Then open <http://localhost:5173>.

## Design

Minimal, grid-based, hairline structure — no gradients, shadows or glow. Single accent
colour, used sparingly. Palette follows the light/dark token mapping published by
hackerrank.com (`#10843E` on white, `#22CD6E` on `#030914`), with their greyscale and
red ramps.

Type: Space Grotesk (display), Inter (body), JetBrains Mono (labels and data).

Every text token was measured against its background: **≥ 4.68:1 in light, ≥ 5.73:1 in
dark**. All icons are inline SVG — no icon fonts, no emoji.

### Interactive figures

Three panels a visitor can drive. Each runs the rule its real system runs rather than
being decorative animation:

| Figure | What it does |
|---|---|
| **Defence in depth** (hero) | Requests stream through WAF → TLS → AuthZ gates. Switch a gate off and the attack class it answers reaches the origin and counts as a breach. |
| **Hybrid burst** (AURA) | HAProxy holds traffic on-premises to `maxconn 50`, then diverts the overflow to Azure. The slider drives that threshold. |
| **Integrity chain** (GEMP) | Alter a stored record and the verify walk stops there — every later record becomes unverifiable. |

All three are keyboard-operable, announce state through `role="status"`, and render a
correct final state under `prefers-reduced-motion` (they switch instantly instead of
easing). The counters beside each figure carry the same information as text, so the
canvas is never load-bearing.

## Résumé

`cv/` holds the LaTeX sources for two builds of the same content:

- `resume_pretty.tex` — typographic version, small-caps headings and header icons
- `resume_ats.tex` — plain version ordered for applicant tracking systems

Both are hardened for text extraction: `cmap` + `lmodern` with ligatures disabled (so
`Configured` does not extract as `Congured`), no tables anywhere, hyphenation off, and
FontAwesome glyphs mapped to spaces.

```bash
cd cv && pdflatex resume_ats.tex && pdflatex resume_pretty.tex
```

The published PDFs live at the repository root; `index.html` links
`Ahmed_Mohamed_Ebaid_Resume.pdf` from the hero.

## Licence

Content and design © Ahmed Mohamed Ebaid. Code is free to read and learn from.
