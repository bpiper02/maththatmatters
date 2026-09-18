# Math That Matters

A fast, configurable numerical-fluency trainer inspired by Zetamac, focused on arithmetic, percentages, fractions, ratios, and applied quantitative reasoning.

## Product rules

- Keyboard-first drill loop.
- Explicit numeric ranges instead of opaque difficulty labels.
- Deterministic question generators; no AI in the live drill.
- Track accuracy and response time, including correct-but-slow answers.
- Same underlying skill can appear in pure math, startup, finance, poker, and CS contexts.
- Local-first persistence for the MVP.
- Restrained Windows 95/97 visual language.
- Dense, familiar UI: no SaaS hero, no decorative dashboard, no unnecessary copy.
- User-customizable workspace without coupling presentation to drill logic.

## Current MVP

- Independent ranges for addition, subtraction and multiplication.
- Divisor + quotient ranges for exact whole-number division.
- Percentage range/base controls with clean-answer mode.
- Fraction numerator/denominator controls and common-fraction mode.
- Ratio scaling.
- Applied startup, finance, probability and EV questions.
- 60 second, 2 minute, 5 minute and 10 minute sessions.
- Auto-advance on correct answer or explicit Enter-submit.
- Persistent wrong/slow attempt history.
- Skill-level adaptive weighting.
- Personalized slow thresholds after enough history.
- Review and progress tables.
- Customizable Windows 97 workspace.

## Run locally

```bash
npm install
npm run dev
```

QA:

```bash
npm test
npm run build
```

## Deploy

### Cloudflare Pages: simplest MVP path

Import this GitHub repository in **Workers & Pages → Pages → Import existing Git repository**.

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

After that, pushes to `main` deploy automatically and pull requests get preview deployments.

### Cloudflare Workers static assets

The repo also includes `wrangler.jsonc`.

```bash
npm run deploy
```

The app is static/local-first today. If we later add D1 or an API, move the deployment fully onto Workers without changing the drill engine.

## Sprint history

0. Repository + architecture
1. Deterministic question engine + generator QA
2. Range configuration + timed drill loop
3. Persistent tracking + wrong/slow review + adaptive weighting
4. User customization + Windows 97 shell
5. CI + Cloudflare-ready deployment

## Next useful work

- More generator QA for percentage/fraction edge cases.
- Saved named drill presets.
- True retry-similar by exact skill.
- Better applied question coverage: funnels, payback, compounding, estimation and card odds.
- Import/export local progress.
- Optional cross-device sync only after the local product proves useful.
