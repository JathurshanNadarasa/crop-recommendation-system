import React, { useState, useEffect } from "react";
import {
  FlaskConical, MapPin, ArrowLeft, ChevronDown, ChevronUp, Leaf, Loader2,
} from "lucide-react";
import { COLORS, SEASON_META, SeasonToggle, RankedList, SectionHeading, CropCardGrid, CropGuideModal } from "../shared.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ---------------- Landing ----------------
function ModePicker({ onSelect }) {
  return (
    <div className="ca-rise" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="ca-mode-card" onClick={() => onSelect("soil")} style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: "28px 22px", background: "#fff" }}>
        <FlaskConical size={24} color={COLORS.green} />
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 20, margin: "14px 0 8px", color: COLORS.inkSoft }}>
          Enter a soil test
        </h3>
        <p style={{ fontSize: 13.5, color: COLORS.textFaint, lineHeight: 1.5, margin: 0 }}>
          Have N-P-K, temperature, humidity, pH and rainfall readings? Get a
          precise prediction, validated against Sri Lankan yield data.
        </p>
      </div>
      <div className="ca-mode-card" onClick={() => onSelect("district")} style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: "28px 22px", background: "#fff" }}>
        <MapPin size={24} color={COLORS.green} />
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 20, margin: "14px 0 8px", color: COLORS.inkSoft }}>
          Just pick your district
        </h3>
        <p style={{ fontSize: 13.5, color: COLORS.textFaint, lineHeight: 1.5, margin: 0 }}>
          No soil test on hand? Select your district and season for a
          historically-grounded recommendation.
        </p>
      </div>
    </div>
  );
}

// ---------------- Soil mode ----------------
const SOIL_FIELDS = [
  { key: "N", label: "Nitrogen (N)", unit: "kg/ha", placeholder: "e.g. 90" },
  { key: "P", label: "Phosphorus (P)", unit: "kg/ha", placeholder: "e.g. 42" },
  { key: "K", label: "Potassium (K)", unit: "kg/ha", placeholder: "e.g. 43" },
  { key: "temperature", label: "Temperature", unit: "°C", placeholder: "e.g. 27" },
  { key: "humidity", label: "Humidity", unit: "%", placeholder: "e.g. 82" },
  { key: "ph", label: "Soil pH", unit: "", placeholder: "e.g. 6.5" },
  { key: "rainfall", label: "Rainfall", unit: "mm", placeholder: "e.g. 220" },
];

function SoilMode({ onBack }) {
  const [season, setSeason] = useState("Yala");
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);

  const allFilled = SOIL_FIELDS.every((f) => values[f.key] !== undefined && values[f.key] !== "");

  const submit = () => {
    setLoading(true);
    setError(null);
    const payload = { season };
    SOIL_FIELDS.forEach((f) => (payload[f.key] = parseFloat(values[f.key])));

    fetch(`${API_BASE}/predict-soil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error(`API returned ${res.status}`); return res.json(); })
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="ca-fade">
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: COLORS.textFaint, fontSize: 13.5, padding: 0, marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to mode selection
      </button>
      <SectionHeading eyebrow="Soil / climate prediction" title="Enter your soil test results" />
      <SeasonToggle season={season} setSeason={setSeason} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        {SOIL_FIELDS.map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12.5, color: COLORS.textFaint, fontWeight: 500, display: "block", marginBottom: 5 }}>
              {f.label} {f.unit && <span style={{ opacity: 0.6 }}>({f.unit})</span>}
            </label>
            <input
              className="ca-input"
              type="number"
              step="any"
              placeholder={f.placeholder}
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 3, fontSize: 14, fontFamily: "'Inter', sans-serif", background: "#fff" }}
            />
          </div>
        ))}
      </div>

      <button
        className="ca-submit"
        disabled={!allFilled || loading}
        onClick={submit}
        style={{
          width: "100%", padding: "13px", background: allFilled ? COLORS.green : "#c2bca9", color: "#fff", border: "none",
          borderRadius: 3, fontSize: 14.5, fontWeight: 600, cursor: allFilled ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {loading ? <><Loader2 size={16} className="spin" /> Predicting…</> : "Get recommendation"}
      </button>

      {error && <div style={{ color: COLORS.rust, fontSize: 14, marginTop: 16 }}>Couldn't reach the API — {error}</div>}

      {result && (
        <div style={{ marginTop: 32 }}>
          {result.recommendations.map((rec, i) => (
            <div key={rec.crop} className="ca-card" style={{ animationDelay: `${i * 80}ms`, border: `1.5px solid ${COLORS.borderSoft}`, borderRadius: 6, padding: "18px 20px", marginBottom: 12, background: i === 0 ? "#FBFAF5" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, textTransform: "capitalize", color: COLORS.inkSoft }}>{rec.crop}</span>
                <span style={{ fontSize: 13, color: COLORS.green, fontWeight: 600 }}>{rec.global_model_confidence_pct}% match</span>
              </div>

              {rec.local_stats ? (
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "8px 0 0" }}>
                  {rec.local_stats.source}: {rec.local_stats.avg_yield_t_ha ?? "—"} t/ha average
                  {rec.local_stats.latest_year && ` (${rec.local_stats.latest_year})`}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: COLORS.textFaintest, margin: "8px 0 0", fontStyle: "italic" }}>{rec.note}</p>
              )}

              {rec.sl_ideal_reference && rec.sl_ideal_reference.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {rec.sl_ideal_reference.map((ref, ri) => (
                    <span key={ri} style={{ fontSize: 11.5, padding: "4px 9px", background: COLORS.sage, borderRadius: 12, color: COLORS.textMuted }}>
                      {ref.crop_name} — {ref.district} ({ref.agro_zone})
                    </span>
                  ))}
                </div>
              )}

              {rec.local_varieties && rec.local_varieties.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => setExpanded(expanded === rec.crop ? null : rec.crop)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: COLORS.indigo, fontSize: 12.5, fontWeight: 600, padding: 0 }}
                  >
                    <Leaf size={12} /> {rec.local_varieties.length} local varieties
                    {expanded === rec.crop ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {expanded === rec.crop && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {rec.local_varieties.map((v, vi) => (
                        <span key={vi} style={{ fontSize: 12, padding: "4px 9px", background: COLORS.sage, borderRadius: 12, color: COLORS.ink }}>
                          {v["Variety Name"]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  const ref = (rec.sl_ideal_reference || [])[0];
                  setSelectedCrop({
                    name: rec.crop,
                    category: ref ? ref.category : undefined,
                    N: ref ? ref.N : undefined,
                    P: ref ? ref.P : undefined,
                    K: ref ? ref.K : undefined,
                    rainfall: ref ? ref.rainfall : undefined,
                  });
                }}
                style={{ display: "block", marginTop: 12, background: "none", border: "none", cursor: "pointer", color: COLORS.green, fontSize: 12.5, fontWeight: 600, padding: 0 }}
              >
                How to grow this →
              </button>
            </div>
          ))}
        </div>
      )}
      {selectedCrop && <CropGuideModal crop={selectedCrop} apiBase={API_BASE} onClose={() => setSelectedCrop(null)} />}
    </div>
  );
}

function rowToGuideCrop(row) {
  return {
    name: row.crop,
    category: row.crop_group,
    N: row.N, P: row.P, K: row.K, rainfall: row.rainfall,
  };
}

// ---------------- District mode ----------------
function DistrictMode({ onBack }) {
  const [season, setSeason] = useState("Yala");
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/districts`)
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data.districts);
        if (data.districts.length) setDistrict(data.districts[0]);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!district) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/recommend-by-district?district=${encodeURIComponent(district)}&season=${season}`)
      .then((res) => { if (!res.ok) throw new Error(`API returned ${res.status}`); return res.json(); })
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [district, season]);

  return (
    <div className="ca-fade">
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: COLORS.textFaint, fontSize: 13.5, padding: 0, marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to mode selection
      </button>
      <SectionHeading eyebrow="District-based recommendation" title="Select your district" />
      <SeasonToggle season={season} setSeason={setSeason} />

      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        className="ca-input"
        style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${COLORS.border}`, borderRadius: 3, fontSize: 15, fontFamily: "'Inter', sans-serif", background: "#fff", marginBottom: 24 }}
      >
        {districts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {loading && <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.textFainter, padding: "16px 0" }}><Loader2 size={16} className="spin" /> Loading…</div>}
      {error && <div style={{ color: COLORS.rust, fontSize: 14, padding: "16px 0" }}>Couldn't reach the API — {error}</div>}

      {result && !loading && (
        <>
          <div style={{ background: COLORS.sage, borderRadius: 4, padding: "14px 18px", marginBottom: 24, fontSize: 13.5, color: COLORS.indigo }}>
            <strong>{result.district}</strong> is in the <strong>{result.zone_label}</strong>.
            {result.zone_climate && (
              <> Last season: {result.zone_climate.rainfall_mm_total} mm rainfall, avg {result.zone_climate.max_temp_c_avg}°C.</>
            )}
          </div>
          {result.tier_counts && (() => {
            const local = result.recommendations.filter((r) => r.tier === "district_match" || r.tier === "zone_typical");
            const national = result.recommendations.filter((r) => r.tier === "national");
            return (
              <>
                <p style={{ fontSize: 12, color: COLORS.textFaintest, margin: "0 0 16px" }}>
                  Showing all {result.recommendations.length} matching crops for {result.district}.
                </p>

                <h4 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 17, color: COLORS.inkSoft, margin: "0 0 4px" }}>
                  Suitable for your district
                </h4>
                <p style={{ fontSize: 12, color: COLORS.textFainter, margin: "0 0 12px" }}>
                  {result.tier_counts.district_match} grown right in {result.district}, {result.tier_counts.zone_typical} typical for its zone. Tap a crop for a growing guide.
                </p>
                <CropCardGrid rows={local} onSelect={(row) => setSelectedCrop(rowToGuideCrop(row))} />

                <h4 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 17, color: COLORS.inkSoft, margin: "28px 0 4px" }}>
                  National agriculture report (AgStat)
                </h4>
                <p style={{ fontSize: 12, color: COLORS.textFainter, margin: "0 0 12px" }}>
                  {result.tier_counts.national} crops ranked by national yield/extent/trend statistics.
                </p>
                <CropCardGrid rows={national} onSelect={(row) => setSelectedCrop(rowToGuideCrop(row))} />
              </>
            );
          })()}
          {result.paddy_irrigation_note && (
            <div style={{ background: "#FBF6E8", borderRadius: 4, padding: "12px 16px", marginTop: 16, fontSize: 12.5, color: "#8a6d1a", lineHeight: 1.5 }}>
              <strong>Paddy note:</strong> {result.paddy_irrigation_note}
            </div>
          )}
          <p style={{ fontSize: 12, color: COLORS.textFaintest, marginTop: 20, lineHeight: 1.6 }}>{result.note}</p>
        </>
      )}
      {selectedCrop && <CropGuideModal crop={selectedCrop} apiBase={API_BASE} onClose={() => setSelectedCrop(null)} />}
    </div>
  );
}

// ---------------- Page ----------------
export default function Advisor() {
  const [mode, setMode] = useState("picker"); // picker | soil | district

  return (
    <div style={{ maxWidth: mode === "district" ? 860 : 680, margin: "0 auto", padding: "48px 28px 80px" }}>
      {mode === "picker" && (
        <>
          <SectionHeading
            eyebrow="Get a recommendation"
            title="How would you like to start?"
            sub="Choose whichever information you have on hand."
          />
          <ModePicker onSelect={setMode} />
        </>
      )}
      {mode === "soil" && <SoilMode onBack={() => setMode("picker")} />}
      {mode === "district" && <DistrictMode onBack={() => setMode("picker")} />}
    </div>
  );
}
