# Freshline

A proactive risk-scoring engine for perishable inventory at quick-commerce dark stores — flagging at-risk stock before it expires, instead of discovering write-offs during manual checks.

**[Live site](#)** · *(replace with your GitHub Pages URL once deployed — see below)*

## What's in this repo

- `index.html` — landing page: the problem, the solution, and an embedded live demo
- `dashboard.html` + `js/dashboard.js` — the actual working prototype (vanilla JS, no build step), generating synthetic dark-store inventory and running a real risk-scoring formula on it
- `css/style.css` — shared styling

## How the risk engine works

For every SKU:

```
days_to_sell_out = current_stock ÷ daily_sales_velocity
risk_score       = days_to_sell_out − days_to_expiry
```

If `risk_score > 0`, the item is projected to expire before it sells through, and gets flagged with a suggested action (graduated discount, B2B offload, or NGO donation routing) before it becomes a write-off.

This is a deterministic v1 — intentionally simple and auditable. A v2 would replace the velocity assumption with a trained model using hyperlocal demand, weather, and festival calendars.

## Data

All inventory data is synthetically generated (seeded random, so it's consistent across reloads) — no real Zepto data is used anywhere in this repo.

## Running locally

No build step needed. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`
4. Save — your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two

## Status

Working prototype, not affiliated with Zepto. Built as an independent proposal exploring expiry-loss reduction for quick-commerce dark stores.
