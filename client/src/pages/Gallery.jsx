import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import ProductCard, { ProductModal } from "../components/ProductCard";
import ScrollReveal from "../hooks/useInteractive";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "roses", label: "Roses" },
  { id: "mixed", label: "Mixed" },
  { id: "seasonal", label: "Seasonal" },
];

export default function Gallery() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const changeFilter = (id) => {
    if (id === filter) return;
    setAnimating(true);
    setTimeout(() => {
      setFilter(id);
      setAnimating(false);
    }, 180);
  };

  const visible = useMemo(() => {
    let list = filter === "all" ? products : products.filter((p) => p.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, filter, search]);

  return (
    <main>
      <section className="page-banner page-banner--scrapbook">
        <div className="container">
          <span className="sticker-label">✿ shop blooms</span>
          <h1>Our Flower Gallery</h1>
          <p>Browse handcrafted bouquets and reserve your favorites for campus pickup.</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="gallery-toolbar">
            <div className="filter-bar" role="group" aria-label="Filter bouquets by category">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-btn${filter === f.id ? " active" : ""}`}
                  onClick={() => changeFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="gallery-search">
              <span className="gallery-search__icon">🔍</span>
              <input
                type="search"
                placeholder="Search bouquets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search bouquets"
              />
            </div>
            <span className="gallery-count">
              {visible.length} bouquet{visible.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-card" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__emoji">🌸</div>
              <p>No bouquets match your search. Try another filter or keyword.</p>
            </div>
          ) : (
            <ScrollReveal>
              <div className={`product-grid product-grid--filtered${animating ? " product-grid--animating" : ""}`}>
                {visible.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    onQuickView={setQuickView}
                  />
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {quickView && <ProductModal product={quickView} onClose={() => setQuickView(null)} />}
    </main>
  );
}
