import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import OrderTimeline from "../components/OrderTimeline";
import Logo from "../components/Logo";
import { formatPeso, formatDate, STATUS_LABELS } from "../utils/format";
import { toast } from "../components/Toast";
import "../styles/dashboard.css";

const STATUS_FILTERS = ["all", "pending", "preparing", "ready", "completed"];

export default function ClientDashboard() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveTime, setLiveTime] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryDetail, setInquiryDetail] = useState(null);
  const [inquiryReply, setInquiryReply] = useState("");

  const loadOrders = () => api.clientOrders().then(setOrders).catch(console.error);
  const loadInquiries = () => api.clientInquiries().then(inqs => setInquiries(Array.isArray(inqs) ? inqs : [])).catch(console.error);

  useEffect(() => {
    loadOrders();
    loadInquiries();
    const t = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/account/login");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(profile);
      await refresh();
      setEditing(false);
      toast("Profile updated!");
    } catch (err) {
      toast(err.message);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast("New passwords do not match");
      return;
    }
    try {
      await api.updatePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: "", new: "", confirm: "" });
      toast("Password updated!");
    } catch (err) {
      toast(err.message);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const recentOrder = orders[0];
  const memberSince = user?.joinedAt ? formatDate(user.joinedAt) : "-";

  const navBtn = (id, label, icon) => (
    <button
      type="button"
      className={panel === id ? "active" : ""}
      onClick={() => {
        setPanel(id);
        setSidebarOpen(false);
      }}
    >
      <span className="nav-icon">{icon}</span> {label}
    </button>
  );

  return (
    <div className="scrapbook-site dash-body">
      <div className={`sidebar-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className="dash-layout dash-layout--client">
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-logo">
            <Logo variant="sidebar" />
          </div>
          <nav className="sidebar-nav">
            {navBtn("overview", "Overview", "🏠")}
            {navBtn("orders", "My Orders", "📋")}
            {navBtn("tracking", "Order Tracking", "📍")}
            {navBtn("profile", "Profile", "👤")}
            {navBtn("favorites", "Favorites", "❤️")}
            {navBtn("inquiries", "My Inquiries", "💬")}
            <div className="sidebar-nav-label">Shop</div>
            <Link to="/gallery">🌸 Browse Flowers</Link>
            <Link to="/reserve">📝 New Reservation</Link>
            <Link to="/schedule">📅 Pop-Up Schedule</Link>
            <div className="sidebar-nav-label">Store</div>
            <Link to="/">🏠 Visit Storefront</Link>
            <Link to="/gallery">🌷 Flower Gallery</Link>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">{(user?.firstName || "U").charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 700, color: "rgba(255,250,246,0.95)", fontSize: "0.85rem" }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,250,246,0.55)" }}>{user?.email}</div>
              </div>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              🚪 Sign Out
            </button>
          </div>
        </aside>

        <div className="dash-main">
          <div className="dash-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <span />
                <span />
                <span />
              </button>
              <span style={{ fontFamily: "var(--font-display)", color: "var(--pink-deep)" }}>My Dashboard</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{liveTime}</span>
              <Link to="/reserve" className="btn btn-primary btn-sm">
                + New Reservation
              </Link>
            </div>
          </div>

          <div className="dash-content">
            {/* ===== OVERVIEW PANEL ===== */}
            <div className={`dash-panel${panel === "overview" ? " active" : ""}`}>
              <div className="dashboard-header">
                <div>
                  <span className="section-eyebrow">Welcome Back</span>
                  <h2 style={{ color: "var(--pink-deep)" }}>
                    Hello, {user?.firstName || "there"} 🌸
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    Member since {memberSince} · {stats.total} total orders
                  </p>
                </div>
              </div>

              {/* Stats cards */}
              <div className="stats-row" style={{ marginBottom: "var(--space-lg)" }}>
                <div className="stat-card">
                  <div className="number">{stats.total}</div>
                  <div className="label">Total Orders</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.pending}</div>
                  <div className="label">Pending</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.preparing}</div>
                  <div className="label">Preparing</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.ready}</div>
                  <div className="label">Ready</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.completed}</div>
                  <div className="label">Completed</div>
                </div>
              </div>

              {/* Total Spent Card */}
              <div className="dash-section-card" style={{ marginBottom: "var(--space-lg)" }}>
                <div className="dash-section-header">
                  <h3>💰 Spending Summary</h3>
                </div>
                <div className="dash-section-body" style={{ padding: "var(--space-md) var(--space-lg)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Total Spent</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--pink-deep)" }}>{formatPeso(stats.totalSpent)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Average Order</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--green-deep)" }}>
                        {stats.total > 0 ? formatPeso(Math.round(stats.totalSpent / stats.total)) : "-"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Favorite Bouquet</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-dark)" }}>
                        {orders.length > 0
                          ? Object.entries(orders.reduce((acc, o) => ({ ...acc, [o.bouquet]: (acc[o.bouquet] || 0) + 1 }), {}))
                              .sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <h3>Recent Orders</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setPanel("orders")}>
                    View All ({stats.total})
                  </button>
                </div>
                <div className="dash-section-body" style={{ padding: "var(--space-md)" }}>
                  {orders.slice(0, 3).map((o) => (
                    <OrderTimeline key={o.id} order={o} />
                  ))}
                  {!orders.length && (
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
                      No orders yet. <Link to="/reserve">Reserve your first bouquet!</Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "var(--space-lg)" }}>
                <Link to="/reserve" className="quick-card" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="quick-card-icon qc-pink">🌷</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>New Reservation</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Order a fresh bouquet</div>
                  </div>
                </Link>
                <Link to="/gallery" className="quick-card" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="quick-card-icon qc-green">🌸</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>Browse Flowers</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>See all arrangements</div>
                  </div>
                </Link>
                <Link to="/schedule" className="quick-card" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="quick-card-icon qc-blue">📅</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>Pop-Up Schedule</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Find us near you</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* ===== ORDERS PANEL ===== */}
            <div className={`dash-panel${panel === "orders" ? " active" : ""}`}>
              <div className="dashboard-header">
                <div>
                  <span className="section-eyebrow">Orders</span>
                  <h2 style={{ color: "var(--pink-deep)" }}>Order History</h2>
                </div>
                <Link to="/reserve" className="btn btn-primary btn-sm">+ New Reservation</Link>
              </div>

              {/* Stats row */}
              <div className="stats-row" style={{ marginBottom: "var(--space-md)" }}>
                <div className="stat-card">
                  <div className="number">{stats.total}</div>
                  <div className="label">Total Orders</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.pending}</div>
                  <div className="label">Pending</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.preparing}</div>
                  <div className="label">Preparing</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.ready + stats.completed}</div>
                  <div className="label">Ready / Done</div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="filter-bar" style={{ marginBottom: "1rem" }}>
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`filter-btn${statusFilter === s ? " active" : ""}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "all" ? "All Orders" : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Order table */}
              <div className="dash-section-card">
                <div style={{ overflowX: "auto" }}>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Pickup Location</th>
                        <th>Pickup Date</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td><strong>{o.id}</strong></td>
                          <td>{o.bouquet}</td>
                          <td>{o.quantity}</td>
                          <td>{o.pickupLocation}</td>
                          <td>{formatDate(o.pickupDate)}</td>
                          <td><span className={`payment-badge payment-${o.paymentMethod.toLowerCase().replace(/\s+/g, "-")}`}>{o.paymentMethod}</span></td>
                          <td><strong>{formatPeso(o.totalPrice)}</strong></td>
                          <td>
                            <span className={`order-status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline cards below table */}
              {filteredOrders.map((o) => (
                <OrderTimeline key={o.id} order={o} />
              ))}
              {!filteredOrders.length && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No orders match this filter.</p>}
            </div>

            {/* ===== TRACKING PANEL ===== */}
            <div className={`dash-panel${panel === "tracking" ? " active" : ""}`}>
              <div className="dashboard-header">
                <div>
                  <span className="section-eyebrow">Tracking</span>
                  <h2 style={{ color: "var(--pink-deep)" }}>Order Tracking</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    Track the real-time status of your active orders
                  </p>
                </div>
              </div>

              {orders.filter((o) => o.status !== "completed").length === 0 ? (
                <div className="dash-section-card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                  <h3>All Caught Up!</h3>
                  <p style={{ color: "var(--text-muted)" }}>All your orders have been completed.</p>
                  <Link to="/reserve" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                    Place a New Order
                  </Link>
                </div>
              ) : (
                orders
                  .filter((o) => o.status !== "completed")
                  .map((o) => (
                    <div key={o.id} className="dash-section-card" style={{ marginBottom: "var(--space-md)" }}>
                      <div className="dash-section-header">
                        <h3>{o.id} · {o.bouquet}</h3>
                        <span className={`order-status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                      </div>
                      <div className="dash-section-body" style={{ padding: "var(--space-md) var(--space-lg)" }}>
                        <OrderTimeline order={o} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginTop: "0.75rem", fontSize: "0.88rem" }}>
                          <div>
                            <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.75rem" }}>PICKUP LOCATION</div>
                            <div>{o.pickupLocation}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.75rem" }}>PICKUP DATE</div>
                            <div>{formatDate(o.pickupDate)}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.75rem" }}>PAYMENT</div>
                            <div>{o.paymentMethod}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.75rem" }}>TOTAL</div>
                            <div style={{ fontWeight: 800, color: "var(--pink-deep)" }}>{formatPeso(o.totalPrice)}</div>
                          </div>
                        </div>
                        {o.messageNote && (
                          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--pink-light)", borderRadius: "var(--radius-sm)", fontSize: "0.88rem" }}>
                            <strong>Note:</strong> {o.messageNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* ===== FAVORITES PANEL ===== */}
            <div className={`dash-panel${panel === "favorites" ? " active" : ""}`}>
              <div className="dashboard-header">
                <div>
                  <span className="section-eyebrow">Favorites</span>
                  <h2 style={{ color: "var(--pink-deep)" }}>Your Favorite Bouquets</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    Based on your order history
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {Object.entries(
                  orders.reduce((acc, o) => {
                    if (!acc[o.bouquet]) acc[o.bouquet] = { name: o.bouquet, count: 0, totalSpent: 0, lastOrdered: o.createdAt };
                    acc[o.bouquet].count += o.quantity;
                    acc[o.bouquet].totalSpent += o.totalPrice;
                    if (o.createdAt > acc[o.bouquet].lastOrdered) acc[o.bouquet].lastOrdered = o.createdAt;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([name, data]) => (
                    <div key={name} className="dash-section-card">
                      <div className="dash-section-body" style={{ padding: "var(--space-md)" }}>
                        <h3 style={{ marginBottom: "0.5rem" }}>🌷 {name}</h3>
                        <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <span>Ordered <strong>{data.count}×</strong></span>
                          <span>Spent: <strong>{formatPeso(data.totalSpent)}</strong></span>
                          <span>Last: {formatDate(data.lastOrdered)}</span>
                        </div>
                        <Link
                          to={`/reserve?bouquet=${encodeURIComponent(name)}`}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: "0.75rem", display: "inline-block" }}
                        >
                          Reorder
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>

              {!orders.length && (
                <div className="dash-section-card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💐</div>
                  <p style={{ color: "var(--text-muted)" }}>No order history yet. Your favorites will show up here!</p>
                </div>
              )}
            </div>

            {/* ===== PROFILE PANEL ===== */}
            <div className={`dash-panel${panel === "profile" ? " active" : ""}`}>
              {/* Account Info Summary */}
              <div className="dash-section-card" style={{ marginBottom: "var(--space-lg)" }}>
                <div className="dash-section-body" style={{ padding: "var(--space-lg)", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div className="profile-avatar-lg">{(user?.firstName || "U").charAt(0)}</div>
                  <div>
                    <h2 style={{ color: "var(--pink-deep)", marginBottom: "0.25rem" }}>{user?.firstName} {user?.lastName}</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{user?.email}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                      📞 {user?.phone || "-"} · 📅 Member since {memberSince}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <h3>Personal Information</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing((v) => !v)}>
                    {editing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>
                <div className="dash-section-body" style={{ padding: "var(--space-md) var(--space-lg)" }}>
                  <form onSubmit={saveProfile}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          value={profile.firstName}
                          readOnly={!editing}
                          onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          value={profile.lastName}
                          readOnly={!editing}
                          onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly={!editing}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        value={profile.phone}
                        readOnly={!editing}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    {editing && (
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save Changes
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Change Password */}
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <h3>Change Password</h3>
                </div>
                <div className="dash-section-body" style={{ padding: "var(--space-md) var(--space-lg)" }}>
                  <form onSubmit={savePassword}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>

              {/* Account Stats */}
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <h3>Account Activity</h3>
                </div>
                <div className="dash-section-body" style={{ padding: "var(--space-md) var(--space-lg)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--pink-deep)" }}>{stats.total}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Total Orders</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green-deep)" }}>{formatPeso(stats.totalSpent)}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Total Spent</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark)" }}>{stats.completed}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>Completed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d4a017" }}>{stats.pending + stats.preparing}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>In Progress</div>
                    </div>
                  </div>
                </div>
            </div>

            {/* ===== INQUIRIES PANEL ===== */}
            <div className={`dash-panel${panel === "inquiries" ? " active" : ""}`}>
              <div className="dashboard-header">
                <div>
                  <span className="section-eyebrow">Support</span>
                  <h2 style={{ color: "var(--pink-deep)" }}>My Inquiries</h2>
                </div>
              </div>
              <ClientInquiriesPanel
                inquiries={inquiries}
                selectedInquiry={selectedInquiry}
                inquiryDetail={inquiryDetail}
                inquiryReply={inquiryReply}
                setInquiryReply={setInquiryReply}
                onSelect={async (inq) => {
                  setSelectedInquiry(inq.id);
                  try {
                    const detail = await api.getInquiry(inq.id);
                    setInquiryDetail(detail);
                  } catch (e) {
                    toast("Failed to load inquiry details.");
                  }
                }}
                onReply={async () => {
                  if (!inquiryReply.trim() || !selectedInquiry) return;
                  try {
                    await api.addReply(selectedInquiry, inquiryReply.trim());
                    setInquiryReply("");
                    const detail = await api.getInquiry(selectedInquiry);
                    setInquiryDetail(detail);
                    toast("Reply sent!");
                    loadInquiries();
                  } catch (e) { toast(e.message); }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

/* ── Client Inquiries Panel Component ──────────────────────────── */
function ClientInquiriesPanel({ inquiries = [], selectedInquiry, inquiryDetail, inquiryReply, setInquiryReply, onSelect, onReply }) {
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const fmtFull = (d) => new Date(d).toLocaleString("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "var(--space-md)", minHeight: 500 }}>
      {/* Left: Message list */}
      <div style={{ background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--pink-light)", overflow: "hidden" }}>
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          {inquiries.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>You have not submitted any inquiries.</div>
          ) : inquiries.map((inq) => (
            <div
              key={inq.id}
              onClick={() => onSelect(inq)}
              style={{
                padding: "1rem", borderBottom: "1px solid var(--pink-light)", cursor: "pointer",
                background: selectedInquiry === inq.id ? "var(--pink-light)" : "var(--white)",
                borderLeft: `4px solid ${selectedInquiry === inq.id ? "var(--pink-main)" : "transparent"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--text-dark)" }}>{inq.subject}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "0.5rem" }}>{fmtDate(inq.createdAt)}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inq.message.substring(0, 60)}{inq.message.length > 60 ? "…" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail view */}
      <div style={{ background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--pink-light)", display: "flex", flexDirection: "column" }}>
        {!inquiryDetail ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Select an inquiry to view details
          </div>
        ) : (
          <>
            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--pink-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{inquiryDetail.subject}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Submitted {fmtFull(inquiryDetail.createdAt)}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Original Message */}
              <div style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem", textAlign: "right" }}>YOU</div>
                <div style={{ background: "var(--pink-light)", padding: "1rem", borderRadius: "12px 12px 0 12px", fontSize: "0.9rem" }}>
                  {inquiryDetail.message}
                </div>
              </div>

              {/* Replies */}
              {inquiryDetail.replies && inquiryDetail.replies.map((r) => {
                const isMe = r.senderRole === "client";
                return (
                  <div key={r.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem", textAlign: isMe ? "right" : "left" }}>
                      {isMe ? "YOU" : r.senderName.toUpperCase()} · {fmtFull(r.createdAt)}
                    </div>
                    <div style={{ background: isMe ? "var(--pink-light)" : "#f4f4f4", padding: "1rem", borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0", fontSize: "0.9rem" }}>
                      {r.message}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "1rem", borderTop: "1px solid var(--pink-light)", background: "#fafafa" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>Reply</div>
              <textarea
                value={inquiryReply}
                onChange={(e) => setInquiryReply(e.target.value)}
                placeholder="Type your reply..."
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "8px", resize: "none", height: "80px", marginBottom: "0.5rem", fontSize: "0.88rem" }}
              />
              <button className="btn btn-primary btn-sm" onClick={onReply}>Send Reply</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
