import React from "react";
import { Sun, Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const COLORS = {
  cream: "#F5F3EA",
  ink: "#1A2A20",
  inkSoft: "#14231C",
  textMuted: "#4b473d",
  textFaint: "#6b6558",
  textFainter: "#8a8474",
  textFaintest: "#a8a290",
  border: "#D8D3C4",
  borderSoft: "#E7E2D2",
  green: "#1F4D3D",
  greenDark: "#163a2d",
  gold: "#D6A419",
  goldSoft: "#F6EAC7",
  indigo: "#3D5A80",
  indigoSoft: "#DCE4EE",
  rust: "#8C3A2B",
  rustSoft: "#F6E6E0",
  sage: "#F1F4EE",
  card: "#FFFFFF",
};

export const SEASON_META = {
  Yala: { label: "Yala", dates: "April – September", icon: Sun, color: COLORS.gold, soft: COLORS.goldSoft },
  Maha: { label: "Maha", dates: "October – March", icon: Droplets, color: COLORS.indigo, soft: COLORS.indigoSoft },
};

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; }

  .ca-rise { animation: caRise 0.6s cubic-bezier(.2,.8,.2,1) backwards; }
  @keyframes caRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  .ca-fade { animation: caFade 0.5s ease backwards; }
  @keyframes caFade { from { opacity: 0; } to { opacity: 1; } }

  .ca-card { animation: caCardRise 0.5s cubic-bezier(.2,.8,.2,1) backwards; }
  @keyframes caCardRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .ca-bar-fill { transition: width .6s cubic-bezier(.2,.8,.2,1); }
  .ca-group-btn:hover { opacity: 0.75; }
  .ca-mode-card { transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; cursor: pointer; }
  .ca-mode-card:hover { transform: translateY(-3px); border-color: ${COLORS.green}; box-shadow: 0 8px 24px rgba(31,77,61,0.08); }
  .ca-input:focus { outline: none; border-color: ${COLORS.green}; }
  .ca-submit:hover { background: ${COLORS.greenDark}; }
  .ca-nav-link { position: relative; transition: color .2s ease; }
  .ca-nav-link::after {
    content: ""; position: absolute; left: 0; right: 100%; bottom: -4px; height: 1.5px;
    background: ${COLORS.green}; transition: right .25s ease;
  }
  .ca-nav-link:hover::after, .ca-nav-link.active::after { right: 0; }
  .ca-feature-card { transition: transform .25s ease, box-shadow .25s ease; }
  .ca-feature-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(20,35,28,0.07); }
  .ca-stat-num { animation: caCountIn 0.7s cubic-bezier(.2,.8,.2,1) backwards; }
  @keyframes caCountIn { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .ca-btn-primary { transition: background .2s ease, transform .15s ease; }
  .ca-btn-primary:hover { background: ${COLORS.greenDark}; transform: translateY(-1px); }
  .ca-btn-primary:active { transform: translateY(0); }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .ca-underline-grow { position: relative; display: inline-block; }
  .ca-underline-grow::after {
    content: ""; position: absolute; left: 0; bottom: -2px; height: 2px; width: 100%;
    background: ${COLORS.gold}; transform: scaleX(0); transform-origin: left;
    animation: caUnderline 0.8s cubic-bezier(.2,.8,.2,1) 0.3s forwards;
  }
  @keyframes caUnderline { to { transform: scaleX(1); } }
`;

export function trendInfo(v) {
  if (v > 0.05) return { label: "Rising", Icon: TrendingUp, tone: COLORS.green };
  if (v < -0.05) return { label: "Falling", Icon: TrendingDown, tone: COLORS.rust };
  return { label: "Stable", Icon: Minus, tone: COLORS.textFaint };
}

export function Eyebrow({ children }) {
  return (
    <span style={{ fontSize: 13, color: COLORS.textFaint, fontWeight: 500, letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, sub, align = "left" }) {
  return (
    <div className="ca-rise" style={{ marginBottom: 36, textAlign: align, maxWidth: align === "center" ? 640 : 560, marginLeft: align === "center" ? "auto" : 0, marginRight: align === "center" ? "auto" : 0 }}>
      {eyebrow && <div style={{ marginBottom: 10 }}><Eyebrow>{eyebrow}</Eyebrow></div>}
      <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.2, margin: "0 0 12px", color: COLORS.inkSoft }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 15.5, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export function SeasonToggle({ season, setSeason }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
      {Object.keys(SEASON_META).map((key) => {
        const s = SEASON_META[key];
        const active = season === key;
        return (
          <button key={key} onClick={() => setSeason(key)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 3,
            border: `1.5px solid ${active ? s.color : COLORS.border}`, background: active ? s.soft : "transparent",
            cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: active ? COLORS.inkSoft : COLORS.textFainter,
          }}>
            <s.icon size={15} color={active ? s.color : COLORS.textFaintest} />
            {s.label}
            <span style={{ fontWeight: 400, fontSize: 12.5, opacity: 0.75 }}>{s.dates}</span>
          </button>
        );
      })}
    </div>
  );
}

const TIER_BADGE = {
  district_match: { label: "Grown in your district", bg: COLORS.goldSoft, fg: "#8a6d1a" },
  zone_typical: { label: "Typical for your zone", bg: COLORS.indigoSoft, fg: COLORS.indigo },
};

function NationalRow({ row, i, meta, minScore, range }) {
  const trend = trendInfo(row.yield_trend_per_year);
  const barPct = 18 + (82 * (row.suitability_score - minScore)) / range;
  return (
    <div className="ca-card" style={{ animationDelay: `${i * 35}ms`, display: "flex", alignItems: "center", gap: 18, padding: "16px 4px", borderBottom: `1px solid ${COLORS.borderSoft}` }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: i === 0 ? meta.color : "#c2bca9", width: 30, flexShrink: 0, textAlign: "right" }}>{i + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: COLORS.inkSoft }}>{row.crop}</span>
          <span style={{ fontSize: 12, color: COLORS.textFaintest }}>
            {row.crop_group === "ofc" ? "field crop" : row.crop_group === "fruits" ? "fruit" : "vegetable"}
          </span>
          {row.is_annual_only && (
            <span style={{ fontSize: 10.5, color: COLORS.rust, background: COLORS.rustSoft, padding: "1px 6px", borderRadius: 8 }}>
              annual data only
            </span>
          )}
        </div>
        <div style={{ height: 5, background: COLORS.borderSoft, borderRadius: 2, overflow: "hidden", maxWidth: 260 }}>
          <div className="ca-bar-fill" style={{ height: "100%", width: `${barPct}%`, background: meta.color, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.inkSoft }}>
          {row.avg_yield.toFixed(1)} <span style={{ fontWeight: 400, fontSize: 11.5, color: COLORS.textFainter }}>t/ha</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
          <trend.Icon size={12} color={trend.tone} />
          <span style={{ fontSize: 11.5, color: trend.tone, fontWeight: 500 }}>{trend.label}</span>
        </div>
      </div>
    </div>
  );
}

function ReferenceRow({ row, i }) {
  const badge = TIER_BADGE[row.tier];
  return (
    <div className="ca-card" style={{ animationDelay: `${i * 35}ms`, padding: "14px 4px", borderBottom: `1px solid ${COLORS.borderSoft}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 15.5, color: COLORS.inkSoft }}>{row.crop}</span>
        {badge && (
          <span style={{ fontSize: 10.5, color: badge.fg, background: badge.bg, padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>
            {badge.label}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textFainter, marginBottom: 6 }}>
        {row.district} · {row.agro_zone}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[["N", row.N], ["P", row.P], ["K", row.K], ["temp", `${row.temperature}°C`], ["pH", row.ph], ["rain", `${row.rainfall}mm`]].map(([k, v]) => (
          <span key={k} style={{ fontSize: 11, color: COLORS.textFaint, background: COLORS.sage, padding: "2px 7px", borderRadius: 10 }}>
            {k} {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------- Crop cards + cultivation guide modal ----------------
export function CropCard({ row, onSelect }) {
  const badge = TIER_BADGE[row.tier];
  const isNational = row.tier === "national" || !row.tier;
  return (
    <div
      onClick={() => onSelect(row)}
      className="ca-mode-card"
      style={{ border: `1.5px solid ${COLORS.borderSoft}`, borderRadius: 6, padding: "16px 16px", background: "#fff", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 15.5, color: COLORS.inkSoft }}>{row.crop}</span>
        {badge && (
          <span style={{ fontSize: 10, color: badge.fg, background: badge.bg, padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>
            {badge.label}
          </span>
        )}
      </div>
      {isNational ? (
        <>
          <div style={{ fontSize: 12, color: COLORS.textFaintest, marginBottom: 6 }}>
            {row.crop_group === "ofc" ? "field crop" : row.crop_group === "fruits" ? "fruit" : "vegetable"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.inkSoft }}>{row.avg_yield.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: COLORS.textFainter }}>t/ha avg</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: COLORS.textFainter, marginBottom: 8 }}>{row.district} · {row.agro_zone}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[["N", row.N], ["P", row.P], ["K", row.K]].map(([k, v]) => (
              <span key={k} style={{ fontSize: 10.5, color: COLORS.textFaint, background: COLORS.sage, padding: "2px 6px", borderRadius: 8 }}>{k} {v}</span>
            ))}
          </div>
        </>
      )}
      <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, marginTop: 10 }}>How to grow this →</div>
    </div>
  );
}

export function CropCardGrid({ rows, onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {rows.map((row, i) => (
        <div key={`${row.tier || "n"}-${row.crop}`} className="ca-card" style={{ animationDelay: `${i * 30}ms` }}>
          <CropCard row={row} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

export function CropGuideModal({ crop, apiBase, onClose }) {
  const [guide, setGuide] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    setGuide(null);
    const params = new URLSearchParams({ crop: crop.name });
    if (crop.category) params.set("category", crop.category);
    if (crop.N != null) params.set("N", crop.N);
    if (crop.P != null) params.set("P", crop.P);
    if (crop.K != null) params.set("K", crop.K);
    if (crop.rainfall != null) params.set("rainfall", crop.rainfall);
    fetch(`${apiBase}/crop-guide?${params.toString()}`)
      .then((res) => { if (!res.ok) throw new Error(`API returned ${res.status}`); return res.json(); })
      .then(setGuide)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [crop.name]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,35,28,0.45)", zIndex: 50, display: "flex", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="ca-fade" style={{ background: "#fff", borderRadius: 8, maxWidth: 620, width: "100%", padding: "30px 28px", position: "relative", height: "fit-content" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: COLORS.textFaint, lineHeight: 1 }}>×</button>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 24, margin: "0 0 4px", color: COLORS.inkSoft }}>{crop.name}</h3>
        <p style={{ fontSize: 13, color: COLORS.textFaint, margin: "0 0 22px" }}>How to grow it, fertilizer, watering, and where to learn more</p>

        {loading && <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.textFainter, fontSize: 14, padding: "10px 0" }}><Loader2Icon /> Loading guide…</div>}
        {error && <div style={{ color: COLORS.rust, fontSize: 14 }}>Couldn't load guide — {error}</div>}

        {guide && (
          <>
            <div style={{ marginBottom: 24 }}>
              {guide.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.sage, color: COLORS.green, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.inkSoft, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{s.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ background: COLORS.sage, borderRadius: 6, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Fertilizer</div>
                <p style={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.5, margin: "0 0 8px" }}>{guide.fertilizer.organic}</p>
                <p style={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{guide.fertilizer.chemical}</p>
              </div>
              <div style={{ background: COLORS.indigoSoft, borderRadius: 6, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.indigo, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Watering</div>
                <p style={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{guide.watering}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <a href={guide.resources.youtube_search} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: COLORS.rust, padding: "9px 16px", borderRadius: 4, textDecoration: "none" }}>
                ▶ Search YouTube guides
              </a>
              <a href={guide.resources.document_search} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, background: "#fff", border: `1.5px solid ${COLORS.border}`, padding: "9px 16px", borderRadius: 4, textDecoration: "none" }}>
                Search documents & guides
              </a>
            </div>

            <p style={{ fontSize: 11, color: COLORS.textFaintest, lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>{guide.disclaimer}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Loader2Icon() {
  return (
    <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function RankedList({ rows, season }) {
  const meta = SEASON_META[season];
  const nationalRows = rows.filter((r) => r.tier === "national" || !r.tier);
  const scores = nationalRows.map((r) => r.suitability_score);
  const maxScore = scores.length ? Math.max(...scores) : 1;
  const minScore = scores.length ? Math.min(...scores) : 0;
  const range = Math.max(maxScore - minScore, 0.01);

  let nationalIdx = 0;
  return (
    <div>
      {rows.map((row, i) => {
        if (row.tier === "district_match" || row.tier === "zone_typical") {
          return <ReferenceRow key={`${row.tier}-${row.crop}`} row={row} i={i} />;
        }
        const idx = nationalIdx++;
        return <NationalRow key={row.crop} row={row} i={idx} meta={meta} minScore={minScore} range={range} />;
      })}
    </div>
  );
}
