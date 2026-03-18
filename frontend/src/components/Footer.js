import React from "react";
import { FiBook } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>
            <FiBook style={{ marginRight: 8, verticalAlign: "middle" }} />
            EduConnect
          </h3>
          <p>
            Connecting students with peer volunteers for personalized academic
            support. Free 1-on-1 tutoring sessions for everyone.
          </p>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <a href="/volunteers">Find Volunteers</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/register">Get Started</a>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <a href="/">Help Center</a>
          <a href="/">Contact Us</a>
          <a href="/">Privacy Policy</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 EduConnect. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
