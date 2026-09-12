"""
Merged Crop Recommendation API
Connects three data sources built across this project:

1. Global soil/climate classifier (Kaggle Crop_recommendation.csv,
   trained by the student: Random Forest / Naive Bayes on N-P-K + weather)
2. Sri Lanka AgStat historical suitability data (DOA/SEPC, 2016-2024) —
   season-based yield/extent/trend rankings, built earlier in this project
3. Sri Lanka DOA released-variety catalogs (rice, vegetables, fruits, field
   crops, root & tuber, leafy vegetables) — scraped by the student

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import joblib
import glob
import os

app = FastAPI(
    title="Sri Lanka Crop Recommendation API (Merged)",
    description="Soil/climate prediction + Sri Lanka historical suitability + local variety lookup.",
    version="2.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ============================================================
# Load artifacts
# ============================================================
rf_model = joblib.load("random_forest_model.pkl")            # soil/climate classifier (no scaling needed)
nb_model = joblib.load("naive_bayes_model.pkl")               # alt. soil/climate classifier
scaler = joblib.load("scaler.pkl")                             # scaler for the Naive Bayes model

suitability = pd.read_csv("crop_suitability_scores.csv")       # AgStat: crop x season suitability
history = pd.read_csv("crop_recommendation_dataset_clean.csv")  # AgStat: crop x year x season detail
paddy_history = pd.read_csv("paddy_ml_dataset_clean.csv")
fruit_history = pd.read_csv("fruits_ml_dataset_clean.csv")
forecast_model = joblib.load("yield_forecast_model.joblib")
forecast_columns = joblib.load("yield_forecast_columns.joblib")
weather_seasonal = pd.read_csv("weather_seasonal.csv")
district_paddy = pd.read_csv("district_paddy_irrigation.csv").set_index("district")

# Sri Lanka per-crop "ideal condition" reference table (100 crops): a
# representative district/agro-zone + typical N-P-K/temperature/pH/rainfall
# per crop. Unlike the AgStat sources above (national/seasonal statistics),
# this file gives a genuine per-district growing example for many crops the
# AgStat suitability scores don't cover at all (e.g. Bell Pepper, Dragon
# Fruit, Kohila) - so it's used both to enrich /predict-soil results and to
# extend /recommend-by-district beyond the ~93 AgStat-tracked crops.
ideal_conditions = pd.read_csv("sl_ideal_conditions.csv")

from districts import DISTRICT_ZONE, ZONE_LABELS

# Load every DOA variety spreadsheet once, keyed by filename
VARIETY_SHEETS = {}
for fp in glob.glob("sl_varieties/*.xlsx"):
    name = os.path.basename(fp).split("_2026")[0]  # e.g. "vegetable-varieties"
    VARIETY_SHEETS[name] = pd.read_excel(fp)

# ============================================================
# Crop identity map: Kaggle label -> Sri Lanka data sources
# ============================================================
# "agstat" tells us where to find real yield/extent/trend history.
# "variety_sheet" + "variety_crop" tell us where to find real local varieties.
# Crops absent from AgStat's national statistics (grapes, pomegranate,
# watermelon) still have a DOA variety catalog entry - shown as "grown in
# Sri Lanka on a small scale" rather than backed by full yield stats.
# Crops with neither are honestly flagged as having no Sri Lanka data.
CROP_MAP = {
    "rice":        {"agstat": ("paddy", None), "variety_sheet": "paddy-varieties", "variety_crop": None},
    "maize":       {"agstat": ("ofc", "Maize"), "variety_sheet": "field-crop-varieties", "variety_crop": "Maize"},
    "blackgram":   {"agstat": ("ofc", "Blackgram"), "variety_sheet": "field-crop-varieties", "variety_crop": "Black Gram"},
    "mungbean":    {"agstat": ("ofc", "Green gram"), "variety_sheet": "field-crop-varieties", "variety_crop": "Green gram"},
    "banana":      {"agstat": ("fruit", "Banana"), "variety_sheet": "fruit-varieties", "variety_crop": "Banana"},
    "mango":       {"agstat": ("fruit", "Mango"), "variety_sheet": "fruit-varieties", "variety_crop": "Mango"},
    "orange":      {"agstat": ("fruit", "Orange"), "variety_sheet": "fruit-varieties", "variety_crop": "Orange"},
    "papaya":      {"agstat": ("fruit", "Papaw"), "variety_sheet": "fruit-varieties", "variety_crop": "Papaw"},
    "watermelon":  {"agstat": None, "variety_sheet": "fruit-varieties", "variety_crop": "Water Melon"},
    "pomegranate": {"agstat": None, "variety_sheet": "fruit-varieties", "variety_crop": "Pomegranate"},
    "grapes":      {"agstat": None, "variety_sheet": "fruit-varieties", "variety_crop": "Grapes"},
    # Remaining Kaggle crops (apple, chickpea, coconut, coffee, cotton, jute,
    # kidneybeans, lentil, mothbeans, muskmelon, pigeonpeas) have no matching
    # entry here - handled generically as "no Sri Lanka data available".
}


def get_local_stats(kaggle_label: str, season: Optional[str]):
    """Return AgStat historical stats for a crop, if we have them."""
    m = CROP_MAP.get(kaggle_label)
    if not m or not m["agstat"]:
        return None
    source, agstat_name = m["agstat"]

    if source == "paddy":
        d = paddy_history[paddy_history["season"] == (season or "Annual")]
        if d.empty:
            return None
        row = d.iloc[-1]  # most recent year
        return {
            "source": "AgStat national paddy statistics",
            "avg_yield_t_ha": round(row["avg_yield_kg_ha"] / 1000, 2),
            "latest_year": int(row["year"]),
        }
    if source == "ofc":
        d = suitability[(suitability["crop"] == agstat_name) & (suitability["season"] == (season or "Yala"))]
        if d.empty:
            return None
        row = d.iloc[0]
        return {
            "source": "AgStat Other Field Crops statistics",
            "avg_yield_t_ha": round(row["avg_yield"], 2),
            "avg_extent_ha": round(row["avg_extent"], 0),
            "yield_trend_per_year": round(row["yield_trend_per_year"], 3),
            "suitability_score": round(row["suitability_score"], 3),
        }
    if source == "fruit":
        d = fruit_history[fruit_history["crop"] == agstat_name].sort_values("data_year")
        if d.empty:
            return None
        row = d.iloc[-1]
        return {
            "source": "AgStat fruit crop statistics",
            "extent_ha": row["extent_ha"],
            "production_t": row["production_t"],
            "latest_year": int(row["data_year"]),
        }
    return None


# Kaggle label -> matching prefix(es) in ideal_conditions.crop_name (that file
# uses local/variety names, e.g. "Paddy (Samba)", "Banana (Embul)", so we
# match on the base crop name rather than requiring an exact string).
IDEAL_NAME_MATCH = {
    "rice": ["Paddy"], "maize": ["Maize"], "mungbean": ["Green Gram"],
    "blackgram": ["Black Gram"], "banana": ["Banana"], "mango": ["Mango"],
    "grapes": ["Grapes"], "papaya": ["Papaya"], "coconut": ["Coconut"],
    "coffee": ["Coffee"], "pomegranate": ["Pomegranate"], "orange": ["Mandarin Orange"],
}

# Our 3-way DISTRICT_ZONE (dry/intermediate/wet) is coarser than
# ideal_conditions.agro_zone (e.g. "Up Country Wet Zone", "Mid Country
# Intermediate Zone"). Match by keyword so every sub-zone counts.
ZONE_KEYWORD = {"dry": "Dry", "intermediate": "Intermediate", "wet": "Wet"}


def get_ideal_reference(kaggle_label: str):
    """Real Sri Lanka growing example(s) for a crop: district, agro-zone and
    typical N-P-K/temperature/pH/rainfall, from the 100-crop reference table."""
    prefixes = IDEAL_NAME_MATCH.get(kaggle_label)
    if not prefixes:
        return []
    mask = ideal_conditions["crop_name"].apply(lambda n: any(n.startswith(p) for p in prefixes))
    return ideal_conditions[mask].to_dict("records")


def local_matches_for_district(district: str, zone: str, exclude_crops: set):
    """Crops from the 100-crop reference table relevant to this district,
    split into two evidence tiers, excluding crops already covered by the
    national AgStat suitability ranking (exclude_crops, lower-cased)."""
    zone_kw = ZONE_KEYWORD[zone]
    zone_rows = ideal_conditions[ideal_conditions["agro_zone"].str.contains(zone_kw, case=False)]

    exact = zone_rows[zone_rows["district"].str.lower() == district.lower()]
    typical = zone_rows[zone_rows["district"].str.lower() != district.lower()]

    def to_list(df, tier):
        out = []
        seen = set(exclude_crops)
        for _, row in df.iterrows():
            base = row["crop_name"].split(" (")[0].strip().lower()
            if base in seen:
                continue
            seen.add(base)
            out.append({
                "crop": row["crop_name"], "crop_group": row["category"], "tier": tier,
                "district": row["district"], "agro_zone": row["agro_zone"],
                "N": row["N"], "P": row["P"], "K": row["K"],
                "temperature": row["temperature"], "ph": row["ph"], "rainfall": row["rainfall"],
            })
        return out

    exact_list = to_list(exact, "district_match")
    exact_bases = {r["crop"].split(" (")[0].strip().lower() for r in exact_list}
    typical_list = to_list(typical, "zone_typical")
    typical_list = [r for r in typical_list if r["crop"].split(" (")[0].strip().lower() not in exact_bases]
    return exact_list, typical_list


def get_varieties(kaggle_label: str, limit: int = 8):
    """Return real DOA-released local varieties for a crop, if we have them."""
    m = CROP_MAP.get(kaggle_label)
    if not m:
        return []
    sheet = VARIETY_SHEETS.get(m["variety_sheet"])
    if sheet is None:
        return []
    if m["variety_crop"] is None:  # paddy sheet has no "Crop" column - every row is a rice variety
        d = sheet
    else:
        d = sheet[sheet["Crop"] == m["variety_crop"]]
    return d.head(limit).fillna("-").to_dict("records")


# ============================================================
# Request/response models
# ============================================================
class SoilInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    season: Optional[str] = None  # "Maha" or "Yala" - optional, enables local suitability lookup


# ============================================================
# Endpoints
# ============================================================
@app.get("/")
def root():
    return {
        "name": "Sri Lanka Crop Recommendation API (Merged)",
        "endpoints": ["/predict-soil", "/recommend", "/forecast", "/crop/{name}/history"],
        "crops_with_full_local_data": [k for k, v in CROP_MAP.items() if v["agstat"]],
        "crops_with_variety_data_only": [k for k, v in CROP_MAP.items() if not v["agstat"]],
    }


@app.post("/predict-soil")
def predict_soil(data: SoilInput):
    """
    Predict suitable crop(s) from soil/climate readings (N, P, K, temperature,
    humidity, pH, rainfall), then enrich each candidate with real Sri Lanka
    yield history (if AgStat tracks it) and real DOA-released local varieties
    (if the crop is in the DOA catalog).
    """
    input_data = pd.DataFrame([[data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall]],
                               columns=["N", "P", "K", "temperature", "humidity", "ph", "rainfall"])

    probabilities = rf_model.predict_proba(input_data)[0]
    classes = rf_model.classes_
    top_indices = probabilities.argsort()[::-1][:3]

    results = []
    for idx in top_indices:
        crop = classes[idx]
        local_stats = get_local_stats(crop, data.season)
        varieties = get_varieties(crop)
        ideal_reference = get_ideal_reference(crop)
        results.append({
            "crop": crop,
            "global_model_confidence_pct": round(float(probabilities[idx] * 100), 2),
            "grown_in_sri_lanka": crop in CROP_MAP,
            "local_stats": local_stats,
            "local_varieties": varieties,
            "sl_ideal_reference": ideal_reference,
            "note": None if crop in CROP_MAP else
                    "No Sri Lanka cultivation data available for this crop - "
                    "the global model suggests it fits the soil/climate profile, "
                    "but it is not tracked in Sri Lankan DOA statistics.",
        })

    return {"input": data.dict(), "recommendations": results}


@app.get("/recommend")
def recommend(season: str = Query(...), crop_group: Optional[str] = Query(None), top_n: Optional[int] = Query(None, ge=1, le=200)):
    """Season-based recommendation from AgStat history alone (no soil data needed).
    Returns every matching crop, ranked, unless top_n is explicitly passed."""
    d = suitability[suitability["season"] == season]
    if crop_group:
        d = d[d["crop_group"] == crop_group]
    d = d.sort_values("suitability_score", ascending=False)
    if top_n:
        d = d.head(top_n)
    return d.to_dict("records")


@app.get("/forecast")
def forecast(crop: str, season: str, year: int):
    row = pd.DataFrame([{"crop": crop, "season": season, "data_year": year}])
    row_enc = pd.get_dummies(row, columns=["crop", "season"]).reindex(columns=forecast_columns, fill_value=0)
    pred = float(forecast_model.predict(row_enc)[0])
    return {"crop": crop, "season": season, "year": year, "predicted_yield_t_ha": round(pred, 2)}


@app.get("/crop/{name}/history")
def crop_history(name: str, season: str = "Annual"):
    d = history[(history["crop"] == name) & (history["season"] == season)].sort_values("data_year")
    if d.empty:
        raise HTTPException(404, f"No {season} history for '{name}'")
    return {
        "crop": name,
        "years": d["data_year"].tolist(),
        "yields": d["avg_yield_t_ha"].round(2).tolist(),
        "extents": d["extent_ha"].round(0).tolist(),
    }


# ============================================================
# Crop cultivation guide (steps, fertilizer, watering, resources)
# ============================================================
# This is general agronomy guidance templated by crop category, not a
# per-crop verified protocol - the fertilizer/watering numbers below are
# derived from this project's own reference N-P-K/rainfall data, and the
# response explicitly tells the farmer to confirm exact doses/timing with
# their local Agrarian Service Centre or DOA extension officer before
# applying anything. Resource links are generated search-result URLs
# (YouTube / DOA site search), not specific videos or documents we've
# verified exist, since we can't vouch for a specific video's accuracy.
from urllib.parse import quote_plus

CATEGORY_STEPS = {
    "cereal": [
        ("Prepare the land", "Plough and harrow the field 2-3 weeks before sowing to break up clods, then level it so water and fertilizer spread evenly."),
        ("Choose a released variety", "Pick a DOA-released variety suited to your district and season (see the variety list for {crop}) rather than uncertified seed."),
        ("Sow at the right time", "Sow at the start of the Maha or Yala season so the crop's growth stages line up with expected rainfall."),
        ("Apply basal fertilizer", "Work the basal dose into the soil at or just after sowing, then top-dress in 2-3 further splits through tillering and panicle stages."),
        ("Manage water", "Maintain a shallow standing water level (for paddy) or keep soil moist without waterlogging (for other cereals) through the vegetative stage."),
        ("Control weeds and pests", "Hand-weed or use a recommended herbicide within the first 3-4 weeks; scout weekly for pests and treat early."),
        ("Harvest and dry", "Harvest once grains are firm and golden, then dry promptly to a safe moisture level before storage."),
    ],
    "vegetable": [
        ("Prepare beds", "Dig and loosen the soil into raised beds with good drainage; mix in compost or well-rotted manure before planting."),
        ("Raise or source seedlings", "Raise seedlings in a nursery (for transplanted crops) or select certified seed for direct-sown crops."),
        ("Transplant / sow with spacing", "Space plants to give each one room for full canopy growth and easy access for weeding and harvesting."),
        ("Apply fertilizer in splits", "Apply a basal dose at planting, then top-dress in 2-3 splits as the crop grows, following the split schedule for {crop}."),
        ("Water regularly", "Keep the root zone consistently moist, especially during flowering and fruit set - irregular watering causes cracking or poor fruit set in many vegetables."),
        ("Stake or trellis if needed", "Provide support for climbing/vining crops to keep fruit off the ground and improve airflow."),
        ("Harvest at the right stage", "Pick regularly once fruits/leaves reach market size - frequent harvesting often encourages more yield."),
    ],
    "fruit": [
        ("Select a planting site", "Choose a well-drained site with full sun; dig a generous planting pit and enrich it with compost before planting."),
        ("Choose a released variety", "Pick a DOA-released variety of {crop} suited to your zone (see the variety list) for reliable yield and disease tolerance."),
        ("Plant and stake young trees", "Plant at the start of the wetter season so roots establish before any dry spell; stake young trees against wind."),
        ("Apply fertilizer as the tree matures", "Apply fertilizer in a ring around the drip-line (not touching the trunk), increasing the dose each year as the tree grows."),
        ("Water during establishment", "Water young trees regularly for the first 1-2 years; established trees of most fruit crops need less frequent watering."),
        ("Prune and manage canopy", "Prune out dead, crossing, or overcrowded branches to maintain airflow and make harvesting easier."),
        ("Harvest at maturity", "Harvest when fruit reaches full size/colour for {crop} - many tree fruits don't ripen much further once picked."),
    ],
    "spice": [
        ("Prepare the site", "Most spice crops prefer partial shade and rich, well-drained soil - prepare planting pits or beds with added organic matter."),
        ("Source healthy planting material", "Use disease-free cuttings, rhizomes, or seedlings from a reliable/DOA-recommended source."),
        ("Plant with adequate spacing", "Space plants to allow airflow, which reduces fungal disease pressure common in many spice crops."),
        ("Apply organic-heavy fertilizer", "Spice crops generally respond well to compost/organic matter with modest chemical fertilizer top-ups - avoid over-fertilizing with nitrogen."),
        ("Manage shade and moisture", "Maintain consistent soil moisture and appropriate shade level, adjusting as the plant matures."),
        ("Watch for fungal disease", "Inspect regularly for fungal issues, which spread quickly in humid, poorly-ventilated plantings."),
        ("Harvest and cure properly", "Harvest at the recommended maturity stage for {crop} and follow proper drying/curing, which strongly affects final quality."),
    ],
    "pulse": [
        ("Prepare a well-drained bed", "Pulses generally dislike waterlogging - prepare a well-drained bed and avoid low-lying plots."),
        ("Inoculate seed if possible", "Where available, treat seed with the appropriate Rhizobium inoculant to boost natural nitrogen fixation."),
        ("Sow at recommended spacing", "Direct-sow at the start of the season at the spacing recommended for {crop}."),
        ("Apply a light basal fertilizer", "Pulses need relatively little nitrogen (they fix some themselves) but benefit from basal phosphorus and potassium."),
        ("Water at flowering and pod-fill", "Keep soil moist particularly during flowering and pod-filling - this is the most drought-sensitive stage."),
        ("Control pod borers and weeds", "Scout for pod-boring insects around flowering and weed early, since pulses compete poorly with weeds."),
        ("Harvest before pods shatter", "Harvest once pods dry but before they shatter and drop seed in the field."),
    ],
    "tuber": [
        ("Prepare loose, deep soil", "Tuber crops need deep, loose, well-drained soil (often ridged or mounded) so tubers can expand freely."),
        ("Select healthy planting material", "Use disease-free setts, vines, or seed tubers from a clean source."),
        ("Plant on ridges or mounds", "Plant on ridges/mounds at recommended spacing to improve drainage and ease of harvest."),
        ("Apply fertilizer at planting and earthing-up", "Apply basal fertilizer at planting, then top-dress and earth up around the base as the crop grows."),
        ("Water consistently, especially at bulking", "Keep soil moisture even during the tuber bulking stage - fluctuating moisture can crack or deform tubers."),
        ("Control weeds early", "Weed early while plants are small; later canopy growth naturally suppresses most weeds."),
        ("Harvest at full maturity", "Harvest once the vine/leaves start yellowing and dying back, indicating the tubers have matured."),
    ],
    "leafy": [
        ("Prepare a fertile, loose bed", "Leafy greens grow fastest in loose, fertile, well-drained soil rich in organic matter."),
        ("Sow or plant close together", "Sow direct or transplant at close spacing since these are typically fast, short-duration crops."),
        ("Feed lightly but often", "Apply a light, nitrogen-leaning fertilizer regularly (small frequent doses) to sustain fast leaf growth."),
        ("Water frequently", "Keep soil consistently moist - leafy greens wilt and turn bitter quickly under water stress."),
        ("Watch for leaf pests", "Check the underside of leaves regularly for pests, since leafy crops are eaten fresh and need low-residue pest control."),
        ("Harvest young and often", "Harvest {crop} while leaves are young and tender for the best quality; repeated cutting can extend the harvest window."),
    ],
    "plantation": [
        ("Plan spacing for the long term", "Plantation/commercial crops occupy the land for years, so plan permanent spacing and access paths from the start."),
        ("Establish with care", "Plant healthy nursery material at the start of the wetter season and stake/shade young plants as needed."),
        ("Build fertility gradually", "Apply organic matter generously at establishment, then increase chemical fertilizer doses gradually as the plant matures."),
        ("Manage water in the early years", "Water regularly during the first 1-2 years; most plantation crops become more drought-tolerant once established."),
        ("Maintain and prune", "Carry out routine pruning/maintenance appropriate to {crop} to keep the plantation productive and manageable."),
        ("Harvest on a regular cycle", "Once mature, harvest on the regular cycle typical for {crop} rather than waiting for one large harvest."),
    ],
    "general": [
        ("Prepare the land", "Clear, plough, and level the plot, working in compost or well-rotted manure before planting."),
        ("Source good planting material", "Use certified seed or disease-free planting material suited to your zone."),
        ("Plant at the right spacing", "Follow recommended spacing for {crop} to balance yield per plant against yield per unit area."),
        ("Fertilize in splits", "Apply a basal dose at planting and top-dress in further splits as the crop develops."),
        ("Water appropriately", "Match watering frequency to the crop's rainfall requirement and your local season."),
        ("Manage weeds and pests", "Weed early and scout regularly so pest or disease problems are caught before they spread."),
        ("Harvest at the right stage", "Harvest {crop} at full maturity for the best yield and quality."),
    ],
}


def normalize_category(category: Optional[str]) -> str:
    c = (category or "").lower()
    if "cereal" in c or "paddy" in c:
        return "cereal"
    if "leafy" in c:
        return "leafy"
    if "vegetable" in c:
        return "vegetable"
    if "fruit" in c:
        return "fruit"
    if "spice" in c or "aromatic" in c:
        return "spice"
    if "pulse" in c or "oilseed" in c:
        return "pulse"
    if "tuber" in c:
        return "tuber"
    if "plantation" in c or "commercial" in c or "cash crop" in c or "nut" in c or "beverage" in c:
        return "plantation"
    return "general"


def fertilizer_guide(N: Optional[float], P: Optional[float], K: Optional[float]):
    organic = (
        "Apply well-rotted compost or farmyard manure (roughly 8-12 t/ha) worked into the soil "
        "at land preparation as the main organic base. Where available, green manure crops "
        "(e.g. Gliricidia, Sesbania) cut and worked into the soil add further organic nitrogen "
        "and improve soil structure."
    )
    if N is None and P is None and K is None:
        chemical = (
            "No specific N-P-K reference is available for this crop in our dataset - check the "
            "Department of Agriculture's fertilizer recommendation for this crop before applying "
            "any chemical fertilizer."
        )
        reference_npk = None
    else:
        chemical = (
            f"This project's reference nutrient target for this crop is about "
            f"{N if N is not None else '—'} kg/ha N, {P if P is not None else '—'} kg/ha P and "
            f"{K if K is not None else '—'} kg/ha K. In Sri Lanka these are commonly supplied as "
            "Urea (N), Triple Super Phosphate/Eppawala Rock Phosphate (P), and Muriate of Potash "
            "(K), split into a basal dose plus 1-2 top-dressings. Exact bag quantities and the "
            "split schedule vary by crop, soil test, and variety, so confirm them with your area's "
            "Agrarian Service Centre or the DOA fertilizer recommendation before applying."
        )
        reference_npk = {"N": N, "P": P, "K": K}
    return {"organic": organic, "chemical": chemical, "reference_npk": reference_npk}


def watering_guide(rainfall: Optional[float]):
    if rainfall is None:
        return (
            "No rainfall reference is available for this crop - as a general rule, keep the root "
            "zone consistently moist without waterlogging, and increase watering frequency during "
            "flowering and fruit/grain-fill, which are usually the most drought-sensitive stages."
        )
    if rainfall >= 2000:
        return (
            f"This crop's reference water requirement is high (around {rainfall:.0f} mm over the "
            "growing period), so in Sri Lanka's wetter zones it can mostly rely on natural rainfall "
            "- add irrigation only during unusually dry spells."
        )
    if rainfall >= 1300:
        return (
            f"This crop needs a moderate amount of water (around {rainfall:.0f} mm over the growing "
            "season). Rainfed cultivation can work in the Intermediate/Wet zones, but plan on "
            "supplementary irrigation roughly twice a week during dry periods."
        )
    return (
        f"This crop is relatively drought-tolerant (around {rainfall:.0f} mm reference requirement) "
        "and suits the Dry Zone, but young plants still need regular watering (every 2-3 days) "
        "until they're established."
    )


def resource_links(crop_name: str):
    base_query = f"{crop_name} cultivation Sri Lanka"
    return {
        "youtube_search": f"https://www.youtube.com/results?search_query={quote_plus(base_query + ' guide')}",
        "document_search": f"https://www.google.com/search?q={quote_plus(base_query + ' cultivation guide site:doa.gov.lk OR filetype:pdf')}",
    }


@app.get("/crop-guide")
def crop_guide(
    crop: str = Query(...),
    category: Optional[str] = Query(None),
    N: Optional[float] = Query(None),
    P: Optional[float] = Query(None),
    K: Optional[float] = Query(None),
    rainfall: Optional[float] = Query(None),
):
    """
    Step-by-step cultivation guidance for a crop, generated from a category
    template (cereal/vegetable/fruit/spice/pulse/tuber/leafy/plantation), plus
    fertilizer and watering guidance derived from this project's own N-P-K/
    rainfall reference data where the caller supplies it (e.g. from the
    selected recommendation card). See the disclaimer field - this is general
    guidance, not a verified per-crop protocol.
    """
    cat_key = normalize_category(category)
    steps = [
        {"title": title, "description": desc.format(crop=crop)}
        for title, desc in CATEGORY_STEPS[cat_key]
    ]
    return {
        "crop": crop,
        "category": category,
        "steps": steps,
        "fertilizer": fertilizer_guide(N, P, K),
        "watering": watering_guide(rainfall),
        "resources": resource_links(crop),
        "disclaimer": (
            "This is general cultivation guidance templated by crop category and this project's "
            "own reference data - it is not a verified, crop-specific protocol. Always confirm "
            "exact fertilizer doses, timing, and pest/disease control with your local Agrarian "
            "Service Centre or a Department of Agriculture extension officer before applying "
            "anything, and treat the linked searches as a starting point to evaluate, not "
            "pre-vetted sources."
        ),
    }


# ============================================================
# Contact form (demo persistence - appends to a local JSON file,
# does not send email; swap in a real mail service before deploying)
# ============================================================
import json
from datetime import datetime, timezone

CONTACT_LOG = "contact_messages.json"


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


@app.post("/contact")
def submit_contact(msg: ContactMessage):
    entry = {**msg.dict(), "received_at": datetime.now(timezone.utc).isoformat()}
    try:
        existing = json.load(open(CONTACT_LOG)) if os.path.exists(CONTACT_LOG) else []
    except (json.JSONDecodeError, FileNotFoundError):
        existing = []
    existing.append(entry)
    with open(CONTACT_LOG, "w") as f:
        json.dump(existing, f, indent=2)
    return {"status": "received"}


# ============================================================
# District-based recommendation
# ============================================================
@app.get("/districts")
def list_districts():
    """List all supported districts grouped by their agro-climatic zone."""
    return {
        "districts": sorted(DISTRICT_ZONE.keys()),
        "zone_of": DISTRICT_ZONE,
        "zone_labels": ZONE_LABELS,
    }


@app.get("/recommend-by-district")
def recommend_by_district(
    district: str = Query(..., description="e.g. Anuradhapura, Kandy, Galle"),
    season: str = Query(..., description="Maha or Yala"),
    crop_group: Optional[str] = Query(None),
    top_n: Optional[int] = Query(None, ge=1, le=200),
):
    """
    Recommend crops for a district by mapping it to its agro-climatic zone
    (Dry / Intermediate / Wet) and returning every relevant crop (not just a
    top handful), in three evidence tiers:
      1. district_match  - genuinely grown in this district (100-crop
         reference table), the strongest evidence we have per-crop.
      2. national         - AgStat national suitability ranking (all of it,
         sorted by suitability_score - no cap unless top_n is passed).
      3. zone_typical      - typical for this district's agro-zone from the
         reference table, for crops AgStat doesn't track nationally at all.
    Also returns that zone's recent climate averages (real AgStat weather data).

    Honesty note: AgStat tracks yield/extent nationally, not per-district, so
    tier 2's ranking itself is national - only tier 1 and the climate context
    are genuinely district/zone-specific. This is surfaced explicitly below
    rather than implying a district-level yield model that doesn't exist.
    """
    if district not in DISTRICT_ZONE:
        raise HTTPException(400, f"Unknown district '{district}'. See /districts for the supported list.")
    zone = DISTRICT_ZONE[district]

    # Most recent year's climate averages for this zone + season
    w = weather_seasonal[weather_seasonal["season"] == season].sort_values("data_year")
    zone_climate = None
    if not w.empty:
        row = w.iloc[-1]
        zone_climate = {
            "year": int(row["data_year"]),
            "rainfall_mm_total": row.get(f"{zone}_rainfall_mm_total"),
            "max_temp_c_avg": row.get(f"{zone}_max_temp_c_avg"),
            "min_temp_c_avg": row.get(f"{zone}_min_temp_c_avg"),
            "rh_morning_pct_avg": row.get(f"{zone}_rh_morning_pct_avg"),
            "bsh_per_day_avg": row.get(f"{zone}_bsh_per_day_avg"),
        }

    d = suitability[suitability["season"] == season].copy()
    if crop_group:
        d = d[d["crop_group"] == crop_group]

    # Real district-specific adjustment for paddy: districts with major irrigation
    # schemes get their cropping-intensity data reflected in paddy's score, since
    # this is genuine per-district evidence (unlike the rest of the ranking, which
    # is national). Districts absent from this table get no adjustment - we don't
    # penalize them without evidence, since smaller-scale/minor-tank paddy farming
    # may still happen there.
    paddy_note = None
    if "Paddy (rice)" in d["crop"].values and district in district_paddy.index:
        info = district_paddy.loc[district]
        # cropping_intensity ranges ~0-2 (2 = both Maha+Yala reliably cultivated);
        # center the bonus at 1.0 so only above-average districts get boosted.
        bonus = (info["avg_cropping_intensity"] - 1.0) * 0.8
        d.loc[d["crop"] == "Paddy (rice)", "suitability_score"] += bonus
        paddy_note = (
            f"{district} has {info['n_schemes']:.0f} major irrigation scheme(s) covering "
            f"{info['total_cultivated_extent_ha']:.0f} ha, with an average cropping intensity of "
            f"{info['avg_cropping_intensity']:.2f} (out of 2.0 seasons/year) as of {info['data_year']:.0f} - "
            "this is real district-specific data, reflected in Paddy's ranking above."
        )
    elif "Paddy (rice)" in d["crop"].values:
        paddy_note = (
            f"No major irrigation scheme data is available for {district} - it likely relies on "
            "minor tanks or rainfed cultivation for paddy, which AgStat doesn't track by district. "
            "Paddy's ranking here uses the national average, unadjusted."
        )

    d = d.sort_values("suitability_score", ascending=False)
    national_records = d.to_dict("records")
    for r in national_records:
        r["tier"] = "national"

    covered = {str(r["crop"]).split(" (")[0].strip().lower() for r in national_records}
    district_match, zone_typical = local_matches_for_district(district, zone, covered)

    combined = district_match + zone_typical + national_records
    if top_n:
        combined = combined[:top_n]

    return {
        "district": district,
        "zone": zone,
        "zone_label": ZONE_LABELS[zone],
        "season": season,
        "zone_climate": zone_climate,
        "recommendations": combined,
        "tier_counts": {
            "district_match": len(district_match),
            "national": len(national_records),
            "zone_typical": len(zone_typical),
        },
        "paddy_irrigation_note": paddy_note,
        "note": "district_match = genuinely grown in this exact district (Sri Lanka reference "
                "table). national = AgStat national suitability ranking (all tracked crops, not "
                "just a top handful) - adjusted for Paddy using real district irrigation data "
                "where available (see paddy_irrigation_note). zone_typical = typical for this "
                "district's agro-zone but not tracked in AgStat's national statistics at all.",
    }
