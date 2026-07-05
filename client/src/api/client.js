const API = "/api";

function headers(json = true) {
  const h = {};
  const token = localStorage.getItem("sfph_token");
  if (token) h.Authorization = `Bearer ${token}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function request(url, options = {}) {
  const res = await fetch(`${API}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getProducts: () => request("/products"),
  getSchedule: () => request("/schedule"),
  getOrder: (id) => request(`/orders/${id}`),

  createOrder: (body) =>
    request("/orders", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }),

  clientRegister: (body) =>
    request("/auth/client/register", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
  clientLogin: (body) =>
    request("/auth/client/login", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
  adminLogin: (body) =>
    request("/auth/admin/login", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", { method: "POST", headers: headers() }),
  me: () => request("/auth/me", { headers: headers() }),

  clientOrders: () => request("/client/orders", { headers: headers() }),
  updateProfile: (body) =>
    request("/client/profile", { method: "PATCH", headers: headers(), body: JSON.stringify(body) }),
  updatePassword: (body) =>
    request("/client/password", { method: "PATCH", headers: headers(), body: JSON.stringify(body) }),

  adminStats: () => request("/admin/stats", { headers: headers() }),
  adminOrders: () => request("/admin/orders", { headers: headers() }),
  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }),
  adminClients: () => request("/admin/clients", { headers: headers() }),
  updateProduct: (id, body) =>
    request(`/admin/products/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(body) }),

  // Inquiries
  createInquiry: (body) =>
    request("/inquiries", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
  adminInquiries: () => request("/admin/inquiries", { headers: headers() }),
  clientInquiries: () => request("/client/inquiries", { headers: headers() }),
  getInquiry: (id) => request(`/inquiries/${id}`, { headers: headers() }),
  markInquiryRead: (id) =>
    request(`/admin/inquiries/${id}/read`, { method: "PATCH", headers: headers() }),
  addReply: (id, message) =>
    request(`/inquiries/${id}/replies`, { method: "POST", headers: headers(), body: JSON.stringify({ message }) }),

  // Password reset
  forgotPassword: (body) =>
    request("/auth/forgot-password", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
  resetPassword: (body) =>
    request("/auth/reset-password", { method: "POST", headers: headers(), body: JSON.stringify(body) }),
};
