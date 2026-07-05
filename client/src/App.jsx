import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LegacyRedirect from "./components/LegacyRedirect";
import { LEGACY_HTML_ROUTES } from "./utils/legacyRoutes";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Schedule from "./pages/Schedule";
import Reservation from "./pages/Reservation";
import Confirmation from "./pages/Confirmation";
import Contact from "./pages/Contact";
import ClientLogin from "./pages/ClientLogin";
import ClientSignup from "./pages/ClientSignup";
import ClientDashboard from "./pages/ClientDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Toast from "./components/Toast";

function ProtectedRoute({ role, children }) {
  const { role: userRole, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: "4rem", textAlign: "center" }}>Loading…</div>;
  if (userRole !== role) return <Navigate to={role === "admin" ? "/admin/login" : "/account/login"} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {Object.keys(LEGACY_HTML_ROUTES).map((file) => (
          <Route key={file} path={file} element={<LegacyRedirect />} />
        ))}
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reserve" element={<Reservation />} />
          <Route path="confirmation/:orderId?" element={<Confirmation />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="account/login" element={<ClientLogin />} />
        <Route path="account/signup" element={<ClientSignup />} />
        <Route
          path="account/dashboard"
          element={
            <ProtectedRoute role="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
