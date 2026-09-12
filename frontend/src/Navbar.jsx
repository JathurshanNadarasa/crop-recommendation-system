import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sprout, Menu, X } from "lucide-react";
import { COLORS } from "./shared.jsx";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/advisor", label: "Get a Recommendation" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50, background: scrolled ? "rgba(245,243,234,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(8px)" : "none", borderBottom: scrolled ? `1px solid ${COLORS.borderSoft}` : "1px solid transparent",
      transition: "background .25s ease, border-color .25s ease",
    }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Sprout size={20} color={COLORS.green} strokeWidth={2} />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, color: COLORS.inkSoft }}>
            Crop Advisor
          </span>
        </Link>

        <div style={{ display: "flex", gap: 28 }} className="ca-nav-desktop">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`ca-nav-link ${location.pathname === l.to ? "active" : ""}`}
              style={{
                textDecoration: "none", fontSize: 14, fontWeight: 500,
                color: location.pathname === l.to ? COLORS.inkSoft : COLORS.textFaint,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button onClick={() => setOpen(!open)} className="ca-nav-mobile-btn" style={{ display: "none", background: "none", border: "none", cursor: "pointer" }}>
          {open ? <X size={22} color={COLORS.inkSoft} /> : <Menu size={22} color={COLORS.inkSoft} />}
        </button>
      </div>

      {open && (
        <div className="ca-fade" style={{ padding: "0 28px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} style={{ textDecoration: "none", fontSize: 15, fontWeight: 500, color: location.pathname === l.to ? COLORS.inkSoft : COLORS.textFaint }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .ca-nav-desktop { display: none !important; }
          .ca-nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
