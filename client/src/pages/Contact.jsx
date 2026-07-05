import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^09\d{9}$/;

export default function Contact() {
  const { user, role } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    phone: user?.phone || "",
    subject: "",
    message: "",
  });

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    update("phone", digits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!form.name.trim()) errs.name = "Name is required.";
    else if (form.name.trim().length > 50) errs.name = "Max 50 characters.";

    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Please enter a valid email address.";

    if (form.phone && !PHONE_REGEX.test(form.phone))
      errs.phone = "Must be a valid PH mobile number (e.g. 09171234567).";

    if (!form.subject.trim()) errs.subject = "Subject is required.";
    else if (form.subject.trim().length > 150) errs.subject = "Max 150 characters.";

    if (!form.message.trim()) errs.message = "Message is required.";
    else if (form.message.trim().length > 2000) errs.message = "Max 2000 characters.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await api.createInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || "",
        subject: form.subject.trim(),
        message: form.message.trim(),
        clientId: role === "client" ? user?.id : null,
      });
      setSubmitted(true);
      toast("Inquiry sent! We'll get back to you soon.");
    } catch (err) {
      toast(err.message || "Could not send inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="form-page">
        <section className="section">
          <div className="container">
            <div className="form-card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💌</div>
              <h2 style={{ color: "var(--pink-deep)" }}>Inquiry Sent!</h2>
              <p style={{ margin: "1rem 0", color: "var(--text-muted)" }}>
                Thank you for reaching out. We&apos;ll reply as soon as possible.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", phone: "", subject: "", message: "" });
                }}
              >
                Send Another Inquiry
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: "0.25rem" }} role="alert">
        {errors[name]}
      </p>
    ) : null;

  return (
    <main className="form-page">
      <section className="section">
        <div className="container">
          <div className="form-card">
            <span className="section-eyebrow">Get in Touch</span>
            <h2>Contact Us</h2>
            <p>Have a question about our bouquets, pop-up schedule, or a special order? Send us a message!</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactName">
                    Your Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Juan Dela Cruz"
                    maxLength={50}
                    required
                  />
                  <FieldError name="name" />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">
                    Email Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                  <FieldError name="email" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone">Phone (optional)</label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="09XX XXX XXXX"
                  maxLength={11}
                />
                <FieldError name="phone" />
              </div>

              <div className="form-group">
                <label htmlFor="contactSubject">
                  Subject <span aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="contactSubject"
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="e.g. Custom bouquet request, Bulk order inquiry"
                  maxLength={150}
                  required
                />
                <FieldError name="subject" />
              </div>

              <div className="form-group">
                <label htmlFor="contactMessage">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contactMessage"
                  rows={5}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us about your inquiry..."
                  required
                />
                <p className="form-note">{form.message.length}/2000 characters</p>
                <FieldError name="message" />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
