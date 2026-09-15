import Orb from "./Orb";
import { BG_PAGE } from "../styles/tokens";

/**
 * Standard page background with gradient + floating orbs.
 * Wraps page content and provides the KU green gradient background.
 */
export default function PageBackground({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={{ background: BG_PAGE }}
    >
      {/* Decorative orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Orb
          style={{
            width: 440,
            height: 440,
            top: "-80px",
            right: "-60px",
            background:
              "radial-gradient(circle,rgba(0,102,51,0.16) 0%,transparent 70%)",
          }}
          anim={{ x: [0, 18, 0], y: [0, -14, 0] }}
        />
        <Orb
          style={{
            width: 300,
            height: 300,
            bottom: "-50px",
            left: "-30px",
            background:
              "radial-gradient(circle,rgba(26,140,78,0.18) 0%,transparent 70%)",
          }}
          anim={{ y: [0, -16, 0] }}
        />
        <Orb
          style={{
            width: 180,
            height: 180,
            top: "40%",
            left: "5%",
            background:
              "radial-gradient(circle,rgba(245,197,24,0.25) 0%,transparent 70%)",
          }}
          anim={{ x: [0, -10, 0], y: [0, 12, 0] }}
        />
        {[[38, 12], [62, 55]].map(([left, top], index) => (
          <Orb
            key={index}
            style={{
              width: 24 + index * 4,
              height: 24 + index * 4,
              top: `${top}%`,
              left: `${left}%`,
              background: "radial-gradient(circle,#F5C518,#E6B000)",
              boxShadow: "0 3px 12px rgba(245,197,24,0.5)",
              opacity: 0.85,
            }}
            anim={{ y: [0, -12 - index * 2, 0] }}
          />
        ))}
      </div>

      {children}
    </div>
  );
}
