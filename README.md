# Crop Advisor — Sri Lanka Crop Recommendation System

A multi-page full-stack app combining three data sources:
1. **AgStat 2016–2024** (DOA/SEPC) — historical yield/extent/trend by crop & season
2. **A soil/climate classifier** (Kaggle Crop_recommendation.csv, N-P-K + weather → crop)
3. **DOA released-variety catalogs** (rice, vegetables, fruits, field crops, etc.)

## Pages
- **Home** (`/`) — hero, animated stats, feature highlights, methodology callout
- **Advisor** (`/advisor`) — the core tool: soil-test mode or district-pick mode
- **About** (`/about`) — data sources, honest methodology explanation, limitations
- **Contact** (`/contact`) — working contact form (stored server-side, no email sending)

## Structure
```
backend/    FastAPI app — all API endpoints
frontend/   Vite + React, react-router-dom multi-page site
```

## Run it

**1. Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Check it's up: http://localhost:8000/docs
(Windows: if `localhost` doesn't resolve from the frontend, use `127.0.0.1` instead.)

**2. Frontend** (separate terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173

## All backend endpoints
| Endpoint | Purpose |
|---|---|
| `POST /predict-soil` | Soil/climate → top-3 crops, enriched with local stats + varieties |
| `GET /recommend` | Season-only national ranking |
| `GET /recommend-by-district` | District + season → zone climate + ranking (paddy adjusted with real irrigation data where available) |
| `GET /districts` | List of 25 districts and their zone |
| `GET /forecast` | Year-ahead yield forecast for a crop/season |
| `GET /crop/{name}/history` | Full 2016–2024 history for one crop |
| `POST /contact` | Stores a contact message (appends to `backend/contact_messages.json`) |

## For your FYP report
- District mode's crop ranking is national except for Paddy, which is adjusted
  using real major-irrigation-scheme data where a district has it — this
  distinction is stated explicitly in both the API response and the About page.
- Fruit crop data is annual-only in AgStat (no Maha/Yala split) — flagged with
  an "annual data only" badge wherever fruit entries appear.
- The climate-yield methodology finding (R² ≈ −0.07 within-crop) is written up
  on the About page — a genuine negative result, not a bug, and worth
  presenting as such in your viva.
- The contact form persists to a local JSON file for demo purposes; wire in a
  real mail service (e.g. SMTP, SendGrid) before any real deployment.
