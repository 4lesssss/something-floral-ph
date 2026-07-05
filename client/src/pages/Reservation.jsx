import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatPeso } from "../utils/format";
import { toast } from "../components/Toast";

// Dynamic pickup locations loaded from the schedule API

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^09\d{9}$/;

/* ── Sign-In Gate Modal ── */
function SignInGate() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "fadeInUp 0.35s ease",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔒</div>
        <h2
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.5rem",
            color: "#7b2d3f",
          }}
        >
          Sign In Required
        </h2>
        <p
          style={{
            color: "#666",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          You need to be signed in to reserve a bouquet. Please log in to your
          account or create a new one to continue.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ width: "100%", textAlign: "center" }}
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="btn btn-secondary"
            style={{ width: "100%", textAlign: "center" }}
          >
            Create an Account
          </Link>
          <Link
            to="/"
            style={{
              color: "#999",
              fontSize: "0.85rem",
              marginTop: "0.25rem",
              textDecoration: "underline",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Reservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Fetch unique locations from the schedule API
    api.getSchedule().then(data => {
      const uniqueLocs = [...new Set(data.map(ev => ev.title))];
      setLocations(uniqueLocs);
    }).catch(() => {
      // Fallback
      setLocations(["Mapúa University", "FEU Manila", "DLSU Taft", "UST España", "Yardstick Coffee Makati", "Common Room BGC"]);
    });
  }, []);

  // Compute today's date for the min attribute (updates on each render)
  const today = new Date().toISOString().split("T")[0];

  // Inline validation errors
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    bouquet: searchParams.get("bouquet") || "",
    quantity: 1,
    pickupLocation: "",
    pickupDate: "",
    messageNote: "",
  });

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    if (user && role === "client") {
      setForm((f) => ({
        ...f,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || f.fullName,
        email: user.email || f.email,
        contactNumber: user.phone || f.contactNumber,
      }));
    }
  }, [user, role]);

  const selected = products.find((p) => p.name === form.bouquet);
  const unitPrice = selected?.price || parseInt(searchParams.get("price"), 10) || 0;
  const total = unitPrice * (parseInt(form.quantity, 10) || 1);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: "" }));
    }
  };

  // Strip non-digits and cap at 11 characters for phone input
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    update("contactNumber", digits);
  };

  // Validate phone on blur
  const handlePhoneBlur = () => {
    if (form.contactNumber && !PHONE_REGEX.test(form.contactNumber)) {
      setErrors((e) => ({
        ...e,
        contactNumber: "Must be a valid PH mobile number (e.g. 09171234567)",
      }));
    }
  };

  // Validate email on blur
  const handleEmailBlur = () => {
    if (form.email && !EMAIL_REGEX.test(form.email)) {
      setErrors((e) => ({
        ...e,
        email: "Please enter a valid email address",
      }));
    }
  };

  const validateForm = () => {
    const errs = {};
    const name = form.fullName.trim();
    if (!name) errs.fullName = "Full name is required.";
    else if (name.length > 50) errs.fullName = "Full name must be 50 characters or fewer.";

    if (!form.email) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email)) errs.email = "Please enter a valid email address.";

    if (!form.contactNumber) errs.contactNumber = "Contact number is required.";
    else if (!PHONE_REGEX.test(form.contactNumber))
      errs.contactNumber = "Must be a valid PH mobile number starting with 09 (11 digits).";

    if (!form.bouquet) errs.bouquet = "Please select a bouquet.";
    if (!form.pickupLocation) errs.pickupLocation = "Please select a pickup location.";

    if (!form.pickupDate) errs.pickupDate = "Pickup date is required.";
    else if (form.pickupDate < today) errs.pickupDate = "Pickup date cannot be in the past.";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.createOrder({
        fullName: form.fullName.trim(),
        contactNumber: form.contactNumber,
        email: form.email.trim(),
        bouquet: form.bouquet,
        quantity: parseInt(form.quantity, 10) || 1,
        unitPrice,
        pickupLocation: form.pickupLocation,
        pickupDate: form.pickupDate,
        messageNote: form.messageNote.trim(),
        paymentMethod: "Cash on Pickup",
        clientId: role === "client" ? user?.id : null,
      });
      toast("Reservation saved! Redirecting…");
      navigate(`/confirmation/${order.id}`);
    } catch (err) {
      toast(err.message || "Could not submit reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const isSignedIn = !loading && user && role === "client";

  if (loading) {
    return (
      <main className="form-page">
        <section className="section">
          <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
            <p>Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="form-page">
      {!isSignedIn && <SignInGate />}
      <section className="section">
        <div className="container">
          <div className="form-card">
            <span className="section-eyebrow">Book Now</span>
            <h2>Reserve Your Bouquet</h2>
            <p>Fill out the form below — your reservation is saved and will appear in the admin dashboard.</p>

            <form id="reservationForm" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name <span aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Juan Dela Cruz"
                  maxLength={50}
                  required
                />
                {errors.fullName && (
                  <p className="form-note" role="alert" style={{ color: "#c0392b", fontSize: "0.78rem" }}>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactNumber">
                    Contact Number <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    value={form.contactNumber}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    placeholder="09XX XXX XXXX"
                    maxLength={11}
                    required
                  />
                  {errors.contactNumber && (
                    <p className="form-note" role="alert" style={{ color: "#c0392b", fontSize: "0.78rem" }}>
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="you@email.com"
                    required
                  />
                  {errors.email && (
                    <p className="form-note" role="alert" style={{ color: "#c0392b", fontSize: "0.78rem" }}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bouquet">
                    Selected Bouquet <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="bouquet"
                    value={form.bouquet}
                    onChange={(e) => update("bouquet", e.target.value)}
                    required
                  >
                    <option value="">Choose a bouquet...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} — {formatPeso(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">
                    Quantity <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min={1}
                    max={10}
                    value={form.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupLocation">
                    Pickup Location <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="pickupLocation"
                    value={form.pickupLocation}
                    onChange={(e) => update("pickupLocation", e.target.value)}
                    required
                  >
                    <option value="">Select campus...</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="pickupDate">
                    Pickup Date <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="date"
                    id="pickupDate"
                    value={form.pickupDate}
                    onChange={(e) => update("pickupDate", e.target.value)}
                    min={today}
                    required
                  />
                  {errors.pickupDate && (
                    <p className="form-note" role="alert" style={{ color: "#c0392b", fontSize: "0.78rem" }}>
                      {errors.pickupDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="messageNote">Message Card Note</label>
                <textarea
                  id="messageNote"
                  rows={3}
                  maxLength={150}
                  value={form.messageNote}
                  onChange={(e) => update("messageNote", e.target.value)}
                  placeholder="Write a short message for the recipient (optional)..."
                />
                <p className="form-note">Max 150 characters. We&apos;ll handwrite your note on a floral card.</p>
              </div>

              <div className="form-group">
                <label>
                  Payment Method <span aria-hidden="true">*</span>
                </label>
                <div
                  style={{
                    marginTop: "0.35rem",
                    padding: "1rem",
                    border: "2px solid var(--pink-light)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--cream-warm)",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>💵</span>
                  <p style={{ fontWeight: 800, fontSize: "0.88rem", marginTop: "0.35rem" }}>
                    Cash on Pickup
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Pay when you pick up your bouquet at the pop-up location.
                  </p>
                </div>
              </div>

              <div className="summary-block" style={{ marginBottom: "1.5rem" }}>
                <h3>Order Preview</h3>
                <div className="summary-row">
                  <span>Unit Price</span>
                  <span>{unitPrice ? formatPeso(unitPrice) : "—"}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <span>{form.quantity}</span>
                </div>
                <div className="summary-row total">
                  <span>Estimated Total</span>
                  <span>{unitPrice ? formatPeso(total) : "—"}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Reservation"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
