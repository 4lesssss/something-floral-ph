import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatPeso, formatDate } from "../utils/format";
import BouquetImage from "../components/BouquetImage";

export default function Confirmation() {
  const { orderId } = useParams();
  const { role } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <main className="form-page">
        <div className="container" style={{ padding: "4rem", textAlign: "center" }}>
          <div className="skeleton-card" style={{ maxWidth: 480, margin: "0 auto", height: 200 }} />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading confirmation…</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="form-page">
        <div className="container">
          <div className="form-card empty-state">
            <div className="empty-state__emoji">📋</div>
            <h2>No Order Found</h2>
            <p style={{ margin: "1rem 0 1.5rem" }}>
              Submit a reservation from the form to see your confirmation here.
            </p>
            <Link to="/reserve" className="btn btn-primary">
              Make a Reservation
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="form-page">
      <section className="section">
        <div className="container">
          <div className="form-card confirmation-card confirmation-card--success">
            <span className="confirm-badge">✓ Reservation confirmed</span>
            <span className="section-eyebrow">Success</span>
            <h2>Reservation Confirmed!</h2>
            <p className="confirm-ref">
              Order Reference: <strong>{order.id}</strong>
            </p>

            <div style={{ maxWidth: 200, margin: "1rem auto" }}>
              <BouquetImage src={`/${order.bouquet.toLowerCase().replace(/\s+/g, "-")}.png`} alt={order.bouquet} />
            </div>

            <div className="confirmation-grid">
              <div className="confirm-block">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Bouquet</span>
                  <span>{order.bouquet}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <span>{order.quantity}</span>
                </div>
                <div className="summary-row">
                  <span>Unit Price</span>
                  <span>{formatPeso(order.unitPrice)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPeso(order.totalPrice)}</span>
                </div>
                <div className="summary-row">
                  <span>Payment</span>
                  <span>{order.paymentMethod}</span>
                </div>
              </div>

              <div className="confirm-block">
                <h3>Customer Information</h3>
                <div className="summary-row">
                  <span>Name</span>
                  <span>{order.fullName}</span>
                </div>
                <div className="summary-row">
                  <span>Contact</span>
                  <span>{order.contactNumber}</span>
                </div>
                <div className="summary-row">
                  <span>Email</span>
                  <span>{order.email}</span>
                </div>
              </div>

              <div className="confirm-block">
                <h3>Pickup Information</h3>
                <div className="summary-row">
                  <span>Location</span>
                  <span>{order.pickupLocation}</span>
                </div>
                <div className="summary-row">
                  <span>Date</span>
                  <span>{formatDate(order.pickupDate)}</span>
                </div>
                {order.messageNote && (
                  <div className="summary-row">
                    <span>Message</span>
                    <span>{order.messageNote}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: "2rem", justifyContent: "center" }}>
              <Link to="/" className="btn btn-secondary">
                Back to Home
              </Link>
              {role === "client" && (
                <Link to="/account/dashboard" className="btn btn-primary">
                  View in My Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
