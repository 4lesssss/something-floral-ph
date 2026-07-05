import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatPeso, formatDate, STATUS_LABELS } from "../utils/format";
import Logo from "../components/Logo";
import OrderMobileCards from "../components/OrderMobileCards";
import { toast } from "../components/Toast";
import "../styles/dashboard.css";

const STATUS_FILTERS = ["all", "pending", "preparing", "ready", "completed"];
const PANEL_TITLES = { overview: "Overview", orders: "Orders", products: "Products", clients: "Clients", schedule: "Schedule", analytics: "Analytics", inquiries: "Inquiries" };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveTime, setLiveTime] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryDetail, setInquiryDetail] = useState(null);
  const [inquiryReply, setInquiryReply] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [inquirySearch, setInquirySearch] = useState("");

  const loadAll = async () => {
    const [o, s, p, c, sch] = await Promise.all([
      api.adminOrders(),
      api.adminStats(),
      api.getProducts(),
      api.adminClients(),
      api.getSchedule(),
    ]);
    setOrders(o);
    setStats(s);
    setProducts(p);
    setClients(c);
    setSchedule(sch);
  };

  const loadInquiries = async () => {
    try {
      const inqs = await api.adminInquiries();
      setInquiries(Array.isArray(inqs) ? inqs : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadAll().catch(console.error);
    loadInquiries();
    
    // Update live clock
    const t = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    
    // Poll orders, stats, and inquiries every 10 seconds silently
    const poll = setInterval(() => {
      api.adminOrders().then(setOrders).catch(console.error);
      api.adminStats().then(setStats).catch(console.error);
      api.adminInquiries().then(setInquiries).catch(console.error);
    }, 10000);
    
    return () => { 
      clearInterval(t); 
      clearInterval(poll); 
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      toast(`Order ${id} → ${STATUS_LABELS[status]}`);
      loadAll();
    } catch (err) {
      toast(err.message);
    }
  };

  const updateProductPrice = async (id, price) => {
    try {
      await api.updateProduct(id, { price: parseInt(price, 10) });
      toast("Product updated");
      loadAll();
    } catch (err) {
      toast(err.message);
    }
  };

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const adminName = user?.username || user?.name || "Admin";

  // Analytics computed data
  const revenueByProduct = orders.reduce((acc, o) => {
    acc[o.bouquet] = (acc[o.bouquet] || 0) + o.totalPrice;
    return acc;
  }, {});
  const ordersByLocation = orders.reduce((acc, o) => {
    acc[o.pickupLocation] = (acc[o.pickupLocation] || 0) + 1;
    return acc;
  }, {});
  const ordersByPayment = orders.reduce((acc, o) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + 1;
    return acc;
  }, {});
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

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
      <div className="dash-layout dash-layout--admin">
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-logo">
            <Logo variant="sidebar" />
            <span className="admin-pill">ADMIN</span>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-nav-label">Main</div>
            {navBtn("overview", "Overview", "📊")}
            {navBtn("orders", "Orders", "📋")}
            {navBtn("products", "Products", "🌸")}
            {navBtn("clients", "Clients", "👥")}
            <div className="sidebar-nav-label">Schedule</div>
            {navBtn("schedule", "Pop-Up Schedule", "📅")}
            <Link to="/reserve">📝 New Reservation</Link>
            <div className="sidebar-nav-label">Reports</div>
            {navBtn("analytics", "Analytics", "📈")}
            <div className="sidebar-nav-label">Support</div>
            {navBtn("inquiries", "Inquiries", "💬")}
            <div className="sidebar-nav-label">Store</div>
            <Link to="/">🏠 Visit Storefront</Link>
            <Link to="/gallery">🌷 Flower Gallery</Link>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar sidebar-avatar--admin">A</div>
              <div>
                <div style={{ fontWeight: 700, color: "rgba(255,250,246,0.95)", fontSize: "1.05rem" }}>
                  {adminName.charAt(0).toUpperCase() + adminName.slice(1)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,250,246,0.65)" }}>Administrator</div>
              </div>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </aside>

        <div className="dash-main">
          <div className="dash-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                <span />
                <span />
                <span />
              </button>
              <span style={{ fontFamily: "var(--font-display)", color: "var(--pink-deep)" }}>
                {PANEL_TITLES[panel] || "Admin Dashboard"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{liveTime}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>

          <div className="dash-content">
            {/* ===== OVERVIEW ===== */}
            {panel === "overview" && stats && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Dashboard</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>
                      Good day, {adminName.charAt(0).toUpperCase() + adminName.slice(1)} 🌸
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      Here&apos;s what&apos;s happening with your flower shop today.
                    </p>
                  </div>
                  <Link to="/reserve" className="btn btn-primary btn-sm">+ New Reservation</Link>
                </div>

                {/* Quick stat cards */}
                <div className="quick-actions">
                  <div className="quick-card">
                    <div className="quick-card-icon qc-pink">📦</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Orders</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>{stats.total}</div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-blue">⏳</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Pending</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>{stats.pending}</div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-purple">🔧</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Preparing</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>{stats.preparing}</div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-green">✅</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Ready / Done</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>
                        {stats.ready + stats.completed}
                      </div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-purple">💰</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Revenue</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>
                        {formatPeso(stats.revenue)}
                      </div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-pink">👥</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Clients</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>{clients.length}</div>
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
                  <div style={{ overflowX: "auto" }}>
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Pickup</th>
                          <th>Payment</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o.id}>
                            <td><strong>{o.id}</strong></td>
                            <td>{o.fullName}</td>
                            <td>{o.bouquet}</td>
                            <td>{o.quantity}</td>
                            <td>
                              {o.pickupLocation}
                              <br />
                              <small>{formatDate(o.pickupDate)}</small>
                            </td>
                            <td><span className={`payment-badge payment-${o.paymentMethod.toLowerCase().replace(/\s+/g, "-")}`}>{o.paymentMethod}</span></td>
                            <td><strong>{formatPeso(o.totalPrice)}</strong></td>
                            <td>
                              <span className={`order-status status-${o.status}`}>
                                {STATUS_LABELS[o.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Products + Recent Clients side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-lg)", marginTop: "var(--space-lg)" }}>
                  <div className="dash-section-card">
                    <div className="dash-section-header">
                      <h3>🌷 Top Products</h3>
                    </div>
                    <div style={{ padding: "var(--space-sm)" }}>
                      {Object.entries(revenueByProduct)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([name, rev], i) => (
                          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0.75rem", borderBottom: i < 4 ? "1px solid var(--pink-light)" : "none" }}>
                            <span style={{ fontWeight: 700 }}>{name}</span>
                            <span style={{ fontWeight: 800, color: "var(--pink-deep)" }}>{formatPeso(rev)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="dash-section-card">
                    <div className="dash-section-header">
                      <h3>👥 Recent Clients</h3>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setPanel("clients")}>
                        View All
                      </button>
                    </div>
                    <div style={{ padding: "var(--space-sm)" }}>
                      {clients.slice(0, 5).map((c, i) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0.75rem", borderBottom: i < clients.length - 1 && i < 4 ? "1px solid var(--pink-light)" : "none" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{c.firstName} {c.lastName}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.email}</div>
                          </div>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--green-deep)" }}>{c.orderCount} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            {panel === "orders" && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Orders</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>Order Management</h2>
                  </div>
                  <Link to="/reserve" className="btn btn-primary btn-sm">+ New Reservation</Link>
                </div>

                <div className="stats-row" style={{ marginBottom: "var(--space-md)" }}>
                  <div className="stat-card">
                    <div className="number">{stats?.total || 0}</div>
                    <div className="label">Total Orders</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{stats?.pending || 0}</div>
                    <div className="label">Pending</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{stats?.preparing || 0}</div>
                    <div className="label">Preparing</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{(stats?.ready || 0) + (stats?.completed || 0)}</div>
                    <div className="label">Ready / Done</div>
                  </div>
                </div>

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
                <div className="table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
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
                          <td>{o.fullName}</td>
                          <td>{o.bouquet}</td>
                          <td>{o.quantity}</td>
                          <td>{o.pickupLocation}</td>
                          <td>{formatDate(o.pickupDate)}</td>
                          <td><span className={`payment-badge payment-${o.paymentMethod.toLowerCase().replace(/\s+/g, "-")}`}>{o.paymentMethod}</span></td>
                          <td><strong>{formatPeso(o.totalPrice)}</strong></td>
                          <td>
                            <select
                              className="status-select"
                              value={o.status}
                              onChange={(e) => updateStatus(o.id, e.target.value)}
                            >
                              {STATUS_FILTERS.filter((x) => x !== "all").map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <OrderMobileCards
                  orders={filteredOrders}
                  renderStatus={(o) => (
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      aria-label={`Status for ${o.id}`}
                    >
                      {STATUS_FILTERS.filter((x) => x !== "all").map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            )}

            {/* ===== PRODUCTS ===== */}
            {panel === "products" && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Products</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>Flower Inventory</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {products.length} products · {products.filter(p => p.stock === "in_stock").length} in stock · {products.filter(p => p.stock === "low_stock").length} low stock
                    </p>
                  </div>
                  <Link to="/gallery" className="btn btn-outline btn-sm">View Gallery</Link>
                </div>

                <div className="stats-row" style={{ marginBottom: "var(--space-md)" }}>
                  <div className="stat-card">
                    <div className="number">{products.length}</div>
                    <div className="label">Total Products</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{products.filter(p => p.stock === "in_stock").length}</div>
                    <div className="label">In Stock</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{products.filter(p => p.stock === "low_stock").length}</div>
                    <div className="label">Low Stock</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{products.filter(p => p.stock === "pre_order").length}</div>
                    <div className="label">Pre-Order</div>
                  </div>
                </div>

                <div className="dash-section-card">
                  <div style={{ overflowX: "auto" }}>
                    <table className="manage-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Category</th>
                          <th>Stock</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const pOrders = orders.filter(o => o.bouquet === p.name);
                          const pRevenue = pOrders.reduce((s, o) => s + o.totalPrice, 0);
                          return (
                            <tr key={p.id}>
                              <td><strong>{p.name}</strong></td>
                              <td>
                                <input
                                  type="number"
                                  defaultValue={p.price}
                                  style={{ width: 90 }}
                                  onBlur={(e) => {
                                    if (parseInt(e.target.value, 10) !== p.price) {
                                      updateProductPrice(p.id, e.target.value);
                                    }
                                  }}
                                />
                              </td>
                              <td><span className="category-badge">{p.category}</span></td>
                              <td><span className={`stock-badge stock-${p.stock}`}>{p.stock?.replace(/_/g, " ")}</span></td>
                              <td>{pOrders.length}</td>
                              <td style={{ fontWeight: 700, color: "var(--pink-deep)" }}>{formatPeso(pRevenue)}</td>
                              <td>
                                <Link to={`/reserve?bouquet=${encodeURIComponent(p.name)}`} className="btn btn-outline btn-sm">
                                  Reserve
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== CLIENTS ===== */}
            {panel === "clients" && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Clients</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>Registered Clients</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {clients.length} registered clients
                    </p>
                  </div>
                </div>

                <div className="stats-row" style={{ marginBottom: "var(--space-md)" }}>
                  <div className="stat-card">
                    <div className="number">{clients.length}</div>
                    <div className="label">Total Clients</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{clients.reduce((s, c) => s + c.orderCount, 0)}</div>
                    <div className="label">Total Client Orders</div>
                  </div>
                </div>

                <div className="dash-section-card">
                  <div style={{ overflowX: "auto" }}>
                    <table className="manage-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Orders</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="table-avatar">{(c.firstName || "?").charAt(0)}</div>
                                <strong>{c.firstName} {c.lastName}</strong>
                              </div>
                            </td>
                            <td>{c.email}</td>
                            <td>{c.phone || "—"}</td>
                            <td><span style={{ fontWeight: 800, color: "var(--pink-deep)" }}>{c.orderCount}</span></td>
                            <td>{formatDate(c.joined)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SCHEDULE ===== */}
            {panel === "schedule" && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Schedule</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>Pop-Up Schedule</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {schedule.length} upcoming pop-up events
                    </p>
                  </div>
                  <Link to="/schedule" className="btn btn-outline btn-sm">View Public Page</Link>
                </div>

                <div className="stats-row" style={{ marginBottom: "var(--space-md)" }}>
                  <div className="stat-card">
                    <div className="number">{schedule.length}</div>
                    <div className="label">Total Events</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{schedule.filter(e => e.status === "open").length}</div>
                    <div className="label">Open</div>
                  </div>
                  <div className="stat-card">
                    <div className="number">{schedule.filter(e => e.status === "limited").length}</div>
                    <div className="label">Limited Slots</div>
                  </div>
                </div>

                <div className="dash-section-card">
                  <div style={{ overflowX: "auto" }}>
                    <table className="manage-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Venue</th>
                          <th>Location</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((e) => (
                          <tr key={e.id}>
                            <td><strong>{e.month} {e.day}</strong></td>
                            <td>{e.dow}</td>
                            <td><strong>{e.title}</strong></td>
                            <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{e.venue}</td>
                            <td>{e.time}</td>
                            <td>
                              <span className={`order-status status-${e.status === "open" ? "ready" : "pending"}`}>
                                {e.status === "open" ? "Open" : "Limited"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {panel === "analytics" && (
              <div className="dash-panel active">
                <div className="dashboard-header">
                  <div>
                    <span className="section-eyebrow">Analytics</span>
                    <h2 style={{ color: "var(--pink-deep)" }}>Business Analytics</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      Revenue breakdown and order insights
                    </p>
                  </div>
                </div>

                {/* Revenue summary */}
                <div className="quick-actions">
                  <div className="quick-card">
                    <div className="quick-card-icon qc-green">💰</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Revenue</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--green-deep)" }}>{formatPeso(totalRevenue)}</div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-pink">📊</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Avg Order Value</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--pink-deep)" }}>{formatPeso(avgOrderValue)}</div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-blue">📦</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Items Sold</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-dark)" }}>
                        {orders.reduce((s, o) => s + o.quantity, 0)}
                      </div>
                    </div>
                  </div>
                  <div className="quick-card">
                    <div className="quick-card-icon qc-purple">👥</div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Unique Customers</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-dark)" }}>
                        {new Set(orders.map(o => o.email)).size}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue by Product */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-lg)" }}>
                  <div className="dash-section-card">
                    <div className="dash-section-header">
                      <h3>💐 Revenue by Product</h3>
                    </div>
                    <div style={{ padding: "var(--space-sm)" }}>
                      {Object.entries(revenueByProduct)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, rev], i, arr) => (
                          <div key={name} style={{ padding: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{name}</span>
                              <span style={{ fontWeight: 800, color: "var(--pink-deep)" }}>{formatPeso(rev)}</span>
                            </div>
                            <div style={{ background: "var(--pink-light)", borderRadius: 50, height: 8, overflow: "hidden" }}>
                              <div style={{ width: `${(rev / Math.max(...Object.values(revenueByProduct))) * 100}%`, background: "linear-gradient(90deg, var(--pink-main), var(--pink-deep))", height: "100%", borderRadius: 50, transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="dash-section-card">
                    <div className="dash-section-header">
                      <h3>📍 Orders by Location</h3>
                    </div>
                    <div style={{ padding: "var(--space-sm)" }}>
                      {Object.entries(ordersByLocation)
                        .sort((a, b) => b[1] - a[1])
                        .map(([loc, count]) => (
                          <div key={loc} style={{ padding: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{loc}</span>
                              <span style={{ fontWeight: 800 }}>{count} orders</span>
                            </div>
                            <div style={{ background: "var(--green-light)", borderRadius: 50, height: 8, overflow: "hidden" }}>
                              <div style={{ width: `${(count / Math.max(...Object.values(ordersByLocation))) * 100}%`, background: "linear-gradient(90deg, var(--green-main), var(--green-deep))", height: "100%", borderRadius: 50, transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="dash-section-card" style={{ marginTop: "var(--space-lg)" }}>
                  <div className="dash-section-header">
                    <h3>💳 Payment Method Breakdown</h3>
                  </div>
                  <div style={{ padding: "var(--space-md)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", textAlign: "center" }}>
                    {Object.entries(ordersByPayment).map(([method, count]) => (
                      <div key={method} style={{ padding: "1rem", background: "var(--cream-warm)", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--pink-deep)" }}>{count}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>{method}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {orders.length > 0 ? Math.round((count / orders.length) * 100) : 0}% of orders
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== INQUIRIES ===== */}
            {panel === "inquiries" && (
              <InquiriesPanel
                inquiries={inquiries}
                selectedInquiry={selectedInquiry}
                inquiryDetail={inquiryDetail}
                inquiryReply={inquiryReply}
                inquiryFilter={inquiryFilter}
                inquirySearch={inquirySearch}
                setInquiryFilter={setInquiryFilter}
                setInquirySearch={setInquirySearch}
                setInquiryReply={setInquiryReply}
                onSelect={async (inq) => {
                  setSelectedInquiry(inq.id);
                  try {
                    const detail = await api.getInquiry(inq.id);
                    setInquiryDetail(detail);
                    if (!inq.isRead) {
                      await api.markInquiryRead(inq.id);
                      loadInquiries();
                    }
                  } catch (e) { console.error(e); }
                }}
                onReply={async () => {
                  if (!inquiryReply.trim() || !selectedInquiry) return;
                  try {
                    await api.addReply(selectedInquiry, inquiryReply.trim());
                    setInquiryReply("");
                    const detail = await api.getInquiry(selectedInquiry);
                    setInquiryDetail(detail);
                    toast("Reply sent!");
                  } catch (e) { toast(e.message); }
                }}
                onMarkRead={async (id) => {
                  try {
                    await api.markInquiryRead(id);
                    loadInquiries();
                  } catch (e) { toast(e.message); }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inquiries Panel Component ──────────────────────────── */
function InquiriesPanel({ inquiries = [], selectedInquiry, inquiryDetail, inquiryReply, inquiryFilter, inquirySearch, setInquiryFilter, setInquirySearch, setInquiryReply, onSelect, onReply, onMarkRead }) {
  const unreadCount = inquiries.filter((i) => !i.isRead).length;

  const filtered = inquiries.filter((inq) => {
    if (inquiryFilter === "unread" && inq.isRead) return false;
    if (inquiryFilter === "read" && !inq.isRead) return false;
    if (inquirySearch.trim()) {
      const q = inquirySearch.toLowerCase();
      return inq.name.toLowerCase().includes(q) || inq.subject.toLowerCase().includes(q) || inq.email.toLowerCase().includes(q);
    }
    return true;
  });

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const fmtFull = (d) => new Date(d).toLocaleString("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <div className="dash-section-header" style={{ marginBottom: "var(--space-md)" }}>
        <h3>💬 Inbox Management {unreadCount > 0 && <span style={{ fontSize: "0.78rem", background: "var(--pink-main)", color: "#fff", borderRadius: 50, padding: "0.15rem 0.6rem", marginLeft: "0.5rem" }}>● {unreadCount} New</span>}</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "var(--space-md)", minHeight: 500 }}>
        {/* Left: Message list */}
        <div style={{ background: "var(--white)", borderRadius: "var(--radius-sm)", border: "1px solid var(--pink-light)", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--pink-light)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.82rem" }}>🔍</span>
              <input
                type="search"
                placeholder="Search inquiries..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                style={{ width: "100%", paddingLeft: "2rem", fontSize: "0.82rem", border: "1px solid var(--pink-light)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.5rem 0.5rem 2rem" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--pink-light)" }}>
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setInquiryFilter(f)}
                style={{
                  padding: "0.3rem 0.75rem", borderRadius: 50, border: "none", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                  background: inquiryFilter === f ? "var(--pink-main)" : "var(--cream-warm)",
                  color: inquiryFilter === f ? "#fff" : "var(--text-body)",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No inquiries found.</div>
            ) : filtered.map((inq) => (
              <div
                key={inq.id}
                onClick={() => onSelect(inq)}
                style={{
                  padding: "0.85rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--pink-light)",
                  background: selectedInquiry === inq.id ? "var(--pink-light)" : inq.isRead ? "transparent" : "var(--cream-warm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: inq.isRead ? 600 : 800, fontSize: "0.85rem" }}>
                    {!inq.isRead && <span style={{ color: "var(--pink-main)", marginRight: "0.35rem" }}>●</span>}
                    {inq.name}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(inq.createdAt)}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.15rem" }}>{inq.subject}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {inq.message.substring(0, 80)}{inq.message.length > 80 ? "…" : ""}
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
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "var(--pink-main)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem"
                    }}>
                      {inquiryDetail.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>
                        {inquiryDetail.name} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.78rem" }}>&lt;{inquiryDetail.email}&gt;</span>
                        {inquiryDetail.phone && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.78rem" }}> · {inquiryDetail.phone}</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>To: Something Floral PH</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>DATE</div>
                    {fmtFull(inquiryDetail.createdAt)}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto" }}>
                <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", background: "var(--cream-warm)", border: "1px solid var(--pink-light)", borderRadius: 4, padding: "0.15rem 0.5rem", marginBottom: "0.5rem" }}>
                  Inquiry Form
                </span>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>{inquiryDetail.subject}</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{inquiryDetail.message}</p>

                {inquiryDetail.replies && inquiryDetail.replies.length > 0 && (
                  <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--pink-light)", paddingTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.75rem" }}>Replies</h4>
                    {inquiryDetail.replies.map((r) => (
                      <div key={r.id} style={{
                        padding: "0.85rem", marginBottom: "0.5rem", borderRadius: "var(--radius-sm)",
                        background: r.senderRole === "admin" ? "var(--pink-light)" : "var(--green-light)",
                        borderLeft: `3px solid ${r.senderRole === "admin" ? "var(--pink-main)" : "var(--green-main)"}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>
                            {r.senderName} <span style={{ fontWeight: 400, fontSize: "0.72rem", color: "var(--text-muted)" }}>({r.senderRole})</span>
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtFull(r.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--pink-light)", paddingTop: "1rem" }}>
                  <label style={{ fontWeight: 700, fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>Reply</label>
                  <textarea
                    rows={3}
                    value={inquiryReply}
                    onChange={(e) => setInquiryReply(e.target.value)}
                    placeholder="Type your reply..."
                    style={{ width: "100%", fontSize: "0.88rem", border: "1px solid var(--pink-light)", borderRadius: "var(--radius-sm)", padding: "0.75rem", resize: "vertical" }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={onReply}
                    disabled={!inquiryReply.trim()}
                    style={{ marginTop: "0.5rem" }}
                  >
                    Send Reply
                  </button>
                </div>
              </div>

              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--pink-light)", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center" }}>
                This message was sent via the Contact page on Something Floral PH.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
