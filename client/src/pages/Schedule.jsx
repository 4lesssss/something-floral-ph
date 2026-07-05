import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import ScrollReveal from "../hooks/useInteractive";

function statusClass(status) {
  if (status === "limited") return "status-sticker--limited";
  return "status-sticker--open";
}

function statusLabel(status) {
  if (status === "limited") return "Few slots!";
  return "Open ♡";
}

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSchedule().then(data => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();
      
      const realTimeEvents = data.map(ev => {
        let evDate = new Date(`${ev.month} ${ev.day}, ${currentYear}`);
        if (evDate < today) {
          evDate.setMonth(evDate.getMonth() + 1);
        }
        return {
          ...ev,
          month: evDate.toLocaleString("en-US", { month: "short" }),
          day: evDate.getDate(),
          dow: evDate.toLocaleString("en-US", { weekday: "short" })
        };
      });
      // Sort them by the computed date so they appear in chronological order
      realTimeEvents.sort((a, b) => new Date(`${a.month} ${a.day}, ${currentYear}`) - new Date(`${b.month} ${b.day}, ${currentYear}`));
      setEvents(realTimeEvents);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <>
      <div className="scrapbook-deco" aria-hidden="true">
        <span className="deco deco-heart deco-1">♥</span>
        <span className="deco deco-heart deco-2">♡</span>
        <span className="deco deco-flower deco-3">✿</span>
        <span className="deco deco-flower deco-4">🌸</span>
        <span className="deco deco-coffee deco-5">☕</span>
        <span className="deco deco-spark deco-6">✦</span>
        <span className="deco deco-tape deco-tape-1" />
        <span className="deco deco-tape deco-tape-2" />
        <span className="deco deco-sticker deco-sticker-1">pop-up!</span>
        <span className="deco deco-sticker deco-sticker-2">fresh blooms</span>
      </div>

      <main>
        <section className="page-banner page-banner--scrapbook">
          <div className="container">
            <span className="sticker-label">✿ this week’s board</span>
            <h1>Pop-Up Schedule</h1>
            <p>Find us on campus & at cute coffee spots - tap a card for details!</p>
          </div>
        </section>

        <section className="section section--board">
          <div className="container">
            <div className="board-header">
              <div className="board-week">
                <span className="board-week__label">
                  {new Date().toLocaleString("en-US", { month: "long" })} {new Date().getFullYear()}
                </span>
                <h2>Upcoming Pop-Ups</h2>
              </div>
              <p className="board-note">♡ {events.length} events · Click a card to expand</p>
            </div>

            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton-card" />
                ))}
              </div>
            ) : (
              <div className="event-board">
                {events.map((ev, i) => (
                  <ScrollReveal key={ev.id} delay={i * 80}>
                    <article
                      className={`event-card event-card--interactive ${ev.cardClass || ""}${expanded === ev.id ? " is-expanded" : ""}`.trim()}
                      onClick={() => toggle(ev.id)}
                      onKeyDown={(e) => e.key === "Enter" && toggle(ev.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded === ev.id}
                    >
                      <span className="card-tape card-tape--top" aria-hidden="true" />
                      <span className="event-doodle" aria-hidden="true">
                        {ev.doodle}
                      </span>
                      <div className="event-date-block">
                        <span className="event-day">{String(ev.day).padStart(2, "0")}</span>
                        <span className="event-meta">
                          <span className="event-month">{ev.month}</span>
                          <span className="event-dow">{ev.dow}</span>
                        </span>
                      </div>
                      <h3 className="event-title">{ev.title}</h3>
                      <p className="event-venue">
                        <span className="venue-icon" aria-hidden="true">
                          {ev.icon}
                        </span>
                        {ev.venue}
                      </p>
                      <div className="event-times">
                        <span className="time-badge">{ev.time}</span>
                      </div>
                      <span className={`status-sticker ${statusClass(ev.status)}`}>{statusLabel(ev.status)}</span>

                      {expanded === ev.id && (
                        <div className="event-card__expand">
                          <p>
                            Reserve ahead and pick up at this location. Walk-ins welcome while slots last!
                          </p>
                          <Link
                            to={`/reserve?location=${encodeURIComponent(ev.title)}`}
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: "0.5rem" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Reserve for this pop-up →
                          </Link>
                        </div>
                      )}
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
