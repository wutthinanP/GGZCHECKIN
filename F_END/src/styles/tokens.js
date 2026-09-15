// ═══════════════════════════════════════════════════════════════
// Check-in System Design Tokens (KU Green Theme)
// Adapted from Finalwebsite/KU Shop design system
// ═══════════════════════════════════════════════════════════════

// 🎨 Colors
export const PRIMARY_DARK = "#003D1F";
export const PRIMARY = "#006633";
export const TEXT_MUTED = "rgba(0,61,31,0.45)";
export const GOLD = "#F5C518";
export const GOLD_DARK = "#E6B000";
export const GREEN = "#21ff0cff";
export const GRAY = "#5b5a58ff";
export const RED = "#f10000ff";

// 🌈 Background Gradients
export const BG_PAGE =
  "linear-gradient(135deg,#E8F5EE 0%,#C8E6D4 28%,#A8D8BC 52%,#B8DFC8 72%,#D4EDE0 100%)";

export const BG_HOME =
  "linear-gradient(135deg,#C8E8D4 0%,#A0D4B4 25%,#7EC4A0 50%,#98D4B8 72%,#B8E0CC 100%)";

// 🪟 Glass Styles
export const GLASS_FRAME = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1.5px solid rgba(255,255,255,0.65)",
  boxShadow:
    "0 32px 80px rgba(0,80,40,0.16), inset 0 1px 0 rgba(255,255,255,0.85)",
};

export const GLASS_CARD = {
  background: "rgba(255,255,255,0.32)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow:
    "0 4px 20px rgba(0,80,40,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
};

export const GLASS_TOPBAR = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 4px 16px rgba(0,80,40,0.08)",
};

export const GLASS_MODAL = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1.5px solid rgba(255,255,255,0.7)",
  boxShadow:
    "0 32px 80px rgba(0,80,40,0.2), inset 0 1px 0 rgba(255,255,255,0.85)",
};

export const GLASS_PILL = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.4)",
};

// 📝 Input Style (returns dynamic style based on focus)
export const inputStyle = (isFocused) => ({
  background: isFocused
    ? "rgba(255,255,255,0.85)"
    : "rgba(255,255,255,0.55)",
  border: isFocused
    ? "1.5px solid rgba(0,102,51,0.5)"
    : "1.5px solid rgba(255,255,255,0.7)",
  backdropFilter: "blur(8px)",
  color: PRIMARY_DARK,
  boxShadow: isFocused ? "0 0 0 4px rgba(0,102,51,0.1)" : "none",
  fontFamily: "'Nunito', sans-serif",
});

// ✨ Shared Decorative Styles
export const SHIMMER_TOP =
  "linear-gradient(90deg,transparent,rgba(245,197,24,0.9),rgba(0,102,51,0.6),rgba(245,197,24,0.9),transparent)";

export const SHIMMER_BOTTOM =
  "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)";

export const DIVIDER = {
  height: "1px",
  background:
    "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
};
