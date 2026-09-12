import React, { useState } from "react";
import { Mail, Send, CheckCircle2, Loader2, MapPin, GraduationCap } from "lucide-react";
import { COLORS, SectionHeading } from "../shared.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const FIELDS = [
  { key: "name", label: "Your name", type: "text", placeholder: "e.g. Kasun Perera" },
  { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
];

export default function Contact() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const allFilled = values.name && values.email && values.message;

  const submit = (e) => {
    e.preventDefault();
    setStatus("sending");
    fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(() => setStatus("sent"))
      .catch(() => setStatus("error"));
  };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 28px 90px" }}>
      <SectionHeading
        eyebrow="Get in touch"
        title="Questions, feedback, or a district we're missing?"
        sub="This is a student research project — feedback on the recommendations, data gaps, or bugs is genuinely useful."
      />

      {status === "sent" ? (
        <div className="ca-card" style={{ background: COLORS.sage, borderRadius: 8, padding: "40px 28px", textAlign: "center" }}>
          <CheckCircle2 size={36} color={COLORS.green} style={{ marginBottom: 14 }} />
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 20, margin: "0 0 8px", color: COLORS.inkSoft }}>
            Message sent
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0 }}>
            Thanks, {values.name.split(" ")[0]} — this has been recorded.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="ca-fade">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 12.5, color: COLORS.textFaint, fontWeight: 500, display: "block", marginBottom: 5 }}>{f.label}</label>
                <input
                  className="ca-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 3, fontSize: 14, fontFamily: "'Inter', sans-serif", background: "#fff" }}
                />
              </div>
            ))}
          </div>

          <label style={{ fontSize: 12.5, color: COLORS.textFaint, fontWeight: 500, display: "block", marginBottom: 5 }}>Message</label>
          <textarea
            className="ca-input"
            rows={5}
            placeholder="What's on your mind?"
            value={values.message}
            onChange={(e) => setValues({ ...values, message: e.target.value })}
            required
            style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 3, fontSize: 14, fontFamily: "'Inter', sans-serif", background: "#fff", resize: "vertical", marginBottom: 18 }}
          />

          <button
            type="submit"
            className="ca-submit"
            disabled={!allFilled || status === "sending"}
            style={{
              width: "100%", padding: "13px", background: allFilled ? COLORS.green : "#c2bca9", color: "#fff", border: "none",
              borderRadius: 3, fontSize: 14.5, fontWeight: 600, cursor: allFilled ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {status === "sending" ? <><Loader2 size={16} className="spin" /> Sending…</> : <><Send size={15} /> Send message</>}
          </button>

          {status === "error" && (
            <p style={{ color: COLORS.rust, fontSize: 13, marginTop: 12 }}>
              Couldn't reach the server — make sure the backend is running.
            </p>
          )}
        </form>
      )}

      <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${COLORS.borderSoft}`, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Mail size={18} color={COLORS.textFaint} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13.5, color: COLORS.textFaint }}>Messages are stored by the backend for review — no email is sent automatically in this demo build.</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <GraduationCap size={18} color={COLORS.textFaint} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13.5, color: COLORS.textFaint }}>Final-year project, University of Moratuwa (COL) — Bachelor of Information Technology.</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <MapPin size={18} color={COLORS.textFaint} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13.5, color: COLORS.textFaint }}>Sri Lanka</span>
        </div>
      </div>
    </div>
  );
}
