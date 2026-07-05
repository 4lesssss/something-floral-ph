import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { formatPeso } from "../utils/format";
import BouquetImage from "./BouquetImage";

export default function ProductCard({ product, variant = "gallery", onQuickView, index = 0 }) {
  const reserveLink = `/reserve?bouquet=${encodeURIComponent(product.name)}&price=${product.price}`;
  const [hover, setHover] = useState(false);

  return (
    <article
      className={`product-card product-card--interactive${hover ? " is-hovered" : ""}`}
      data-category={product.category}
      style={{ animationDelay: `${index * 0.06}s` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="product-image">
        <BouquetImage src={`/${product.image}`} alt={`${product.name} bouquet`} />
        <div className="product-card__overlay">
          {onQuickView && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onQuickView(product)}>
              Quick View
            </button>
          )}
          <Link to={reserveLink} className="btn btn-primary btn-sm">
            Reserve
          </Link>
        </div>
        <span className="product-card__category">{product.category}</span>
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-price">{formatPeso(product.price)}</p>
        <p className="product-desc">{product.description}</p>
        <div className="product-card__actions">
          <Link
            to={reserveLink}
            className={`btn ${variant === "home" ? "btn-outline btn-sm" : "btn-primary btn-sm"}`}
          >
            Reserve
          </Link>
          {onQuickView && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onQuickView(product)}>
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductModal({ product, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!product) return null;

  const reserveLink = `/reserve?bouquet=${encodeURIComponent(product.name)}&price=${product.price}`;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card product-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="productModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="product-modal__grid">
          <div className="product-modal__image">
            <BouquetImage src={`/${product.image}`} alt={`${product.name} bouquet`} />
          </div>
          <div className="product-modal__info">
            <span className="section-eyebrow">{product.category}</span>
            <h2 id="productModalTitle">{product.name}</h2>
            <p className="product-price" style={{ fontSize: "1.5rem" }}>
              {formatPeso(product.price)}
            </p>
            <p>{product.description}</p>
            <p className="form-note">Stock: {product.stock?.replace(/_/g, " ") || "Available"}</p>
            <div className="btn-group" style={{ marginTop: "1.25rem" }}>
              <Link to={reserveLink} className="btn btn-primary" onClick={onClose}>
                Reserve This Bouquet
              </Link>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
