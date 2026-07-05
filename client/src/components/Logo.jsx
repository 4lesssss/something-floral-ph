/**
 * Brand logo — uses the actual Something Floral PH logo image.
 * variants: header | footer | auth | sidebar
 */
export default function Logo({ variant = "header", className = "" }) {
  const sizes = {
    header: { width: 70, height: 70 },
    footer: { width: 56, height: 56 },
    auth: { width: 100, height: 100 },
    sidebar: { width: 44, height: 44 },
  };

  const isCompact = variant === "sidebar";
  const isFooter = variant === "footer";
  const isAuth = variant === "auth";
  const size = sizes[variant] || sizes.header;

  return (
    <span className={`brand-logo brand-logo--${variant} ${className}`.trim()} aria-hidden={false}>
      <img
        className="brand-logo__mark"
        src="/logo.png"
        alt="Something Floral PH Logo"
        width={size.width}
        height={size.height}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />

      <span className="brand-logo__text">
        <span className="brand-logo__name">
          {isCompact ? "Something Floral" : "Something"}
          {!isCompact && <span className="brand-logo__name-accent"> Floral</span>}
        </span>
        <span className="brand-logo__tagline">
          {isFooter ? "Fresh Flowers · Pop-Up Shop" : isAuth ? "Fresh campus bouquets" : "PH · Fresh Flowers"}
        </span>
      </span>
    </span>
  );
}
