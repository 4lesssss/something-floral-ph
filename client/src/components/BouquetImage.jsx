import { useState } from "react";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #fce8ec, #f58ca1)",
  "linear-gradient(135deg, #fff5e6, #f58ca1)",
  "linear-gradient(135deg, #edf7ee, #8bc99a)",
  "linear-gradient(135deg, #f3e8f5, #c96b84)",
];

export default function BouquetImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  const gradient = FALLBACK_GRADIENTS[(alt?.length || 0) % FALLBACK_GRADIENTS.length];

  if (failed || !src) {
    return (
      <div className={`bouquet-fallback ${className}`} style={{ background: gradient }} role="img" aria-label={alt}>
        <span className="bouquet-fallback__emoji">💐</span>
        <span className="bouquet-fallback__label">{alt?.replace(/ bouquet$/i, "") || "Bouquet"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
