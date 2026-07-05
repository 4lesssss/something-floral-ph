import { Navigate, useLocation } from "react-router-dom";
import { legacyTarget } from "../utils/legacyRoutes";

export default function LegacyRedirect() {
  const { pathname, search } = useLocation();
  const target = legacyTarget(pathname);
  if (!target) return <Navigate to="/" replace />;
  return <Navigate to={`${target}${search}`} replace />;
}
