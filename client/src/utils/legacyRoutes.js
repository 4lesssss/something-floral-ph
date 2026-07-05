/** Maps old static .html URLs to React Router paths (query string preserved). */
export const LEGACY_HTML_ROUTES = {
  "index.html": "/",
  "gallery.html": "/gallery",
  "schedule.html": "/schedule",
  "reservation.html": "/reserve",
  "confirmation.html": "/confirmation",
  "client-login.html": "/account/login",
  "client-signup.html": "/account/signup",
  "client-dashboard.html": "/account/dashboard",
  "admin-login.html": "/admin/login",
  "admin-dashboard.html": "/admin/dashboard",
  "dashboard.html": "/account/dashboard",
};

export function legacyTarget(pathname) {
  const file = pathname.replace(/^\//, "").split("/").pop() || "";
  return LEGACY_HTML_ROUTES[file] ?? null;
}
