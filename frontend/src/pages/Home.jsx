import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, FlaskConical, MapPin, Leaf, ArrowRight, Database, TrendingUp } from "lucide-react";
import { COLORS, Eyebrow, SectionHeading } from "../shared.jsx";

function useCountUp(target, duration = 1200, start) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    let raf;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Stat({ value, suffix, label, delay }) {
  const [ref, inView] = useInView();
  const count = useCountUp(value, 1200, inView);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div className="ca-stat-num" style={{ animationDelay: `${delay}ms`, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(32px, 5vw, 44px)", color: COLORS.green }}>
        {inView ? count : 0}{suffix}
      </div>
      <div style={{ fontSize: 13, color: COLORS.textFaint, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Soil-test prediction",
    body: "Enter N-P-K, temperature, humidity, pH and rainfall readings. A trained classifier suggests the best-fit crops, cross-checked against real Sri Lankan yield data.",
  },
  {
    icon: MapPin,
    title: "District-based advice",
    body: "No soil test on hand? Pick your district and season. Paddy recommendations are adjusted using real irrigation-scheme data where it exists — not a generic guess.",
  },
  {
    icon: Leaf,
    title: "Real local varieties",
    body: "Every recommendation is enriched with actual DOA-released variety names — not just a crop name, but which variety to actually plant.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 28px 40px" }}>
        <div className="ca-rise" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Sprout size={22} color={COLORS.green} strokeWidth={2} />
          <Eyebrow>Dept. of Agriculture · AgStat 2016–2024</Eyebrow>
        </div>
        <h1 className="ca-rise" style={{
          animationDelay: "80ms", fontFamily: "'Fraunces', serif", fontWeight: 500,
          fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.1, margin: "0 0 22px", color: COLORS.inkSoft, maxWidth: 720,
        }}>
          What should you <span className="ca-underline-grow">grow</span> this season?
        </h1>
        <p className="ca-rise" style={{ animationDelay: "160ms", fontSize: 17, color: COLORS.textMuted, maxWidth: 520, lineHeight: 1.6, marginBottom: 32 }}>
          A recommendation engine grounded in nine years of Sri Lankan
          agricultural statistics — not a generic global model. Get a
          crop suggestion from a soil test, or just your district.
        </p>
        <div className="ca-rise" style={{ animationDelay: "240ms", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link to="/advisor" className="ca-btn-primary" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", background: COLORS.green, color: "#fff",
            borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            Get a recommendation <ArrowRight size={16} />
          </Link>
          <Link to="/about" style={{
            display: "flex", alignItems: "center", padding: "13px 24px", border: `1.5px solid ${COLORS.border}`,
            borderRadius: 3, fontSize: 15, fontWeight: 600, color: COLORS.inkSoft, textDecoration: "none",
          }}>
            How it works
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: "#fff", borderTop: `1px solid ${COLORS.borderSoft}`, borderBottom: `1px solid ${COLORS.borderSoft}`, margin: "48px 0" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          <Stat value={34} suffix="" label="crops covered" delay={0} />
          <Stat value={9} suffix=" yrs" label="of AgStat history" delay={80} />
          <Stat value={25} suffix="" label="districts mapped" delay={160} />
          <Stat value={3} suffix="" label="agro-climatic zones" delay={240} />
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 28px 60px" }}>
        <SectionHeading
          eyebrow="Two ways to get an answer"
          title="Built for whoever's asking"
          sub="Whether you have precise readings or just know where you farm, there's a path to a grounded recommendation."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="ca-feature-card ca-card" style={{
              animationDelay: `${i * 100}ms`, background: "#fff", border: `1px solid ${COLORS.borderSoft}`,
              borderRadius: 6, padding: "26px 22px",
            }}>
              <f.icon size={22} color={COLORS.green} />
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 18, margin: "16px 0 8px", color: COLORS.inkSoft }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13.5, color: COLORS.textFaint, lineHeight: 1.55, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Honesty callout */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 28px 72px" }}>
        <div className="ca-card" style={{
          background: COLORS.sage, borderRadius: 8, padding: "32px 28px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
        }}>
          <Database size={26} color={COLORS.indigo} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 19, margin: "0 0 8px", color: COLORS.inkSoft }}>
              We tested a climate-yield model. It didn't hold up.
            </h3>
            <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
              Weather at zone-level doesn't meaningfully predict a crop's
              yield year to year in this data — so instead of pretending
              otherwise, the engine ranks crops by historical performance,
              extent, and trend, and only adjusts for real district-level
              evidence when it actually exists (like paddy irrigation data).{" "}
              <Link to="/about" style={{ color: COLORS.indigo, fontWeight: 600 }}>Read the full methodology →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
