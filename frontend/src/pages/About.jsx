import React from "react";
import { Database, FlaskConical, Leaf, AlertTriangle, GraduationCap } from "lucide-react";
import { COLORS, SectionHeading } from "../shared.jsx";

const SOURCES = [
  {
    icon: Database,
    title: "AgStat 2016–2024",
    body: "Nine annual statistical reports from Sri Lanka's Department of Agriculture (Socio Economics and Planning Centre). Extent, production, and yield for paddy, other field crops, vegetables and fruit crops, plus monthly weather records for the Dry, Wet and Intermediate zones.",
  },
  {
    icon: FlaskConical,
    title: "Soil/climate classifier",
    body: "A Random Forest and Naive Bayes model trained on the widely-used Crop_recommendation.csv dataset (N, P, K, temperature, humidity, pH, rainfall → crop), giving a global agronomic-fit prediction from soil readings.",
  },
  {
    icon: Leaf,
    title: "DOA variety catalog",
    body: "Officially released crop varieties for rice, vegetables, fruits, field crops, and root & tuber crops, scraped from the Department of Agriculture's own listings — used to turn a crop name into an actual variety to plant.",
  },
];

function Callout({ icon: Icon, title, children, tone = "sage" }) {
  const bg = tone === "sage" ? COLORS.sage : "#FBF6E8";
  const iconColor = tone === "sage" ? COLORS.indigo : "#8a6d1a";
  return (
    <div className="ca-card" style={{ background: bg, borderRadius: 8, padding: "26px 24px", display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
      <Icon size={22} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 17, margin: "0 0 8px", color: COLORS.inkSoft }}>{title}</h3>
        <div style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 28px 80px" }}>
      <SectionHeading
        eyebrow="About this project"
        title="A recommendation engine that says what it doesn't know"
        sub="Built as a final-year project connecting three separate Sri Lankan agricultural data sources into one honest advisor."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
        {SOURCES.map((s, i) => (
          <div key={s.title} className="ca-card" style={{ animationDelay: `${i * 100}ms`, background: "#fff", border: `1px solid ${COLORS.borderSoft}`, borderRadius: 6, padding: "22px 18px" }}>
            <s.icon size={20} color={COLORS.green} />
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 16, margin: "12px 0 8px", color: COLORS.inkSoft }}>{s.title}</h3>
            <p style={{ fontSize: 12.5, color: COLORS.textFaint, lineHeight: 1.55, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <SectionHeading eyebrow="Methodology" title="Why this isn't a climate-response model" />
      <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 20 }}>
        An early version of this project tried to predict crop yield directly
        from seasonal climate variables (rainfall, temperature, humidity) at
        the agro-climatic zone level. Tested properly — isolating the
        within-crop, year-to-year signal rather than just comparing across
        crop types — climate explained essentially none of the yield
        variation (R² ≈ −0.07, worse than guessing "no change").
      </p>
      <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 32 }}>
        That's a real finding, not a failure: nine years per crop is too
        short a record, a single weather station can't represent a whole
        zone, and bigger drivers — fertilizer policy, market prices, pest
        years — aren't in AgStat at all. So instead, this engine ranks
        crops by <em>historical</em> yield, cultivated extent, and trend —
        and only adjusts for real district-level evidence where it
        genuinely exists (paddy's ranking shifts using actual irrigation
        scheme data; most other crops don't have an equivalent district
        signal, and the app says so rather than inventing one).
      </p>

      <Callout icon={AlertTriangle} title="What the district picker actually does" tone="gold">
        Selecting a district shows that district's real agro-climatic zone
        and recent climate figures. For most crops, the ranking itself
        stays national — AgStat doesn't publish district-level yield for
        vegetables, other field crops, or fruit. Paddy is the exception:
        its score is adjusted using real major-irrigation-scheme data,
        where a district has it.
      </Callout>

      <Callout icon={Database} title="Data limitations, stated plainly" tone="sage">
        Fruit crop data is annual only — AgStat doesn't split it by Maha/Yala,
        so fruit entries carry an "annual data only" note wherever they
        appear. The district→zone mapping assigns each district a single
        dominant zone, though several genuinely span two. Weather is one
        representative station per zone, not a dense network.
      </Callout>

      <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${COLORS.borderSoft}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <GraduationCap size={22} color={COLORS.green} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13.5, color: COLORS.textFaint, lineHeight: 1.6, margin: 0 }}>
          Developed as a final-year project for the Bachelor of Information
          Technology, University of Moratuwa (Centre for Open and Distance
          Learning), supervised by Mr. Muaadh.
        </p>
      </div>
    </div>
  );
}
