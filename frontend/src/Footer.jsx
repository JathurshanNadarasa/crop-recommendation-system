import React from "react";
import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { COLORS } from "./shared.jsx";

export default function Footer() {
  return (
    <div style={{ borderTop: `1px solid ${COLORS.borderSoft}`, marginTop: 80 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sprout size={16} color={COLORS.green} />
          <span style={{ fontSize: 13, color: COLORS.textFaint }}>
            Crop Advisor — built on AgStat 2016–2024, Dept. of Agriculture, Sri Lanka
          </span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <Link to="/about" style={{ fontSize: 13, color: COLORS.textFaint, textDecoration: "none" }}>About</Link>
          <Link to="/contact" style={{ fontSize: 13, color: COLORS.textFaint, textDecoration: "none" }}>Contact</Link>
        </div>
      </div>
    </div>
  );
}
