import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { useHeaderScroll } from "../hooks/useInteractive";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();
  const headerRef = useHeaderScroll();

  const close = () => setOpen(false);

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="nav-inner" aria-label="Main navigation">
        <NavLink to="/" className="logo" onClick={close} aria-label="Something Floral PH — Home">
          <Logo variant="header" />
        </NavLink>
        <button
          type="button"
          className={`nav-toggle${open ? " open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={`nav-links${open ? " open" : ""}`}>
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/gallery" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
              Flowers
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
              Pop-Up Schedule
            </NavLink>
          </li>
          <li>
            <NavLink to="/reserve" className={({ isActive }) => (isActive ? "active nav-cta" : "nav-cta")} onClick={close}>
              Reserve
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
              Contact
            </NavLink>
          </li>
          <li>
            <NavLink
              to={role === "admin" ? "/admin/dashboard" : role === "client" ? "/account/dashboard" : "/account/login"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              onClick={close}
            >
              My Account
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
