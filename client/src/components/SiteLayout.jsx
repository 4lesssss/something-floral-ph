import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import PageTransition from "./PageTransition";

export default function SiteLayout() {
  const location = useLocation();
  const isSchedule = location.pathname === "/schedule";

  return (
    <div className={isSchedule ? "page-schedule" : "scrapbook-site"}>
      <Header />
      <PageTransition>
        <Outlet />
      </PageTransition>
      <Footer />
    </div>
  );
}
