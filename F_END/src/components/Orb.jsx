import { motion } from "framer-motion";

/**
 * Floating decorative orb used as background decoration.
 * @param {{ style: React.CSSProperties, anim: object }} props
 */
export default function Orb({ style, anim }) {
  return (
    <motion.div
      animate={anim}
      transition={{
        duration: 7,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}
