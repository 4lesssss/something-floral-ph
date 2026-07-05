import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo variant="footer" />
            <p style={{ marginTop: "0.75rem" }}>
              A passion-driven flower business crafting fresh bouquets for every occasion.
            </p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/gallery">Flower Gallery</Link>
              </li>
              <li>
                <Link to="/schedule">Pop-Up Schedule</Link>
              </li>
              <li>
                <Link to="/reserve">Reservation</Link>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Contact</h4>
            <ul>
              <li>+63 908 411 4225</li>
              <li>somethingfloralph@gmail.com</li>
              <li>Metro Manila, Philippines</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Something Floral PH — Fresh Flowers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
