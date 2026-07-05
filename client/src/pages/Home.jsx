import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard";
import BouquetImage from "../components/BouquetImage";
import ScrollReveal from "../hooks/useInteractive";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ bouquets: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getSchedule()])
      .then(([products, schedule]) => {
        setFeatured(products.slice(0, 3));
        setStats({ bouquets: products.length, events: schedule.length });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const introItems = [
    { icon: "🌷", title: "Handpicked Blooms", text: "Every arrangement uses fresh seasonal flowers carefully styled for lasting beauty." },
    { icon: "📍", title: "Campus Pop-Ups", text: "Find us at Mapúa, FEU, DLSU, UST, and more - check our schedule for dates and times." },
    { icon: "💌", title: "Personal Touch", text: "Add a custom message card to make your gift extra special for someone you love." },
  ];

  return (
    <main>
      <section className="hero hero--interactive" id="hero">
        <div className="floral-blob floral-blob--pink" aria-hidden="true" />
        <div className="floral-blob floral-blob--green" aria-hidden="true" />
        <div className="hero-content container">
          <div className="hero-text">
            <span className="badge">Pop-Up Floral Shop · Metro Manila</span>
            <h1>
              Fresh Blooms for <span>Every Moment</span>
            </h1>
            <p>
              Handcrafted flower arrangements delivered to your favorite campus pop-ups. Perfect for
              birthdays, graduations, or just because.
            </p>
            <div className="btn-group">
              <Link to="/gallery" className="btn btn-primary">
                View Flowers
              </Link>
              <Link to="/reserve" className="btn btn-secondary">
                Reserve Now
              </Link>
            </div>
            <div className="hero-stats">
              <span className="hero-stat-pill">🌸 {stats.bouquets} bouquets</span>
              <span className="hero-stat-pill">📍 {stats.events} pop-ups</span>
              <span className="hero-stat-pill">⚡ Live booking</span>
            </div>
          </div>
          <div className="hero-visual">
            <BouquetImage
              src="/ellise.png"
              alt="Ellise - Imported roses with carnations & eucalyptus"
              className="hero-bouquet-img"
            />
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <ScrollReveal className="section-header">
            <span className="section-eyebrow">About Us</span>
            <h2>Welcome to Something Floral PH</h2>
            <p>
              Something Floral PH is a passion-driven flower business dedicated to crafting fresh,
              handcrafted bouquets that bring joy and meaning to every occasion. Through our pop-ups
              and floral creations, we share the beauty of blooms with the community - spreading love,
              color, and happiness one bouquet at a time.
            </p>
          </ScrollReveal>
          <div className="intro-grid">
            {introItems.map((item, i) => (
              <ScrollReveal
                key={item.title}
                as="article"
                className="intro-card intro-card--interactive"
                delay={i * 100}
              >
                <div className="icon" aria-hidden="true">
                  {item.icon}
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white" id="featured">
        <div className="container">
          <ScrollReveal className="section-header">
            <span className="section-eyebrow">Our Bestsellers</span>
            <h2>Featured Arrangements</h2>
            <p>Our most-loved bouquets - reserve ahead and pick up at your nearest pop-up.</p>
          </ScrollReveal>
          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} variant="home" index={i} />
              ))}
            </div>
          )}
          <ScrollReveal className="text-center mt-lg">
            <Link to="/gallery" className="btn btn-primary">
              View All Flowers
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section className="section section--cta">
        <ScrollReveal className="container">
          <span className="section-eyebrow">Get Started</span>
          <h2>Ready to Send Flowers?</h2>
          <p className="section-cta-text">
            Reserve your bouquet online and pick it up at our next campus pop-up. It&apos;s quick and
            easy — just fill out the form and we&apos;ll have your flowers ready!
          </p>
          <div className="btn-group" style={{ justifyContent: "center" }}>
            <Link to="/schedule" className="btn btn-secondary">
              See Pop-Up Schedule
            </Link>
            <Link to="/reserve" className="btn btn-primary">
              Reserve Now
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
