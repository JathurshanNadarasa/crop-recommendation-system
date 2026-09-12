import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Home from "./pages/Home.jsx";
import Advisor from "./pages/Advisor.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import { GLOBAL_STYLES, COLORS } from "./shared.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: COLORS.cream, minHeight: "100vh", color: COLORS.ink, display: "flex", flexDirection: "column" }}>
        <style>{GLOBAL_STYLES}</style>
        <ScrollToTop />
        <Navbar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
