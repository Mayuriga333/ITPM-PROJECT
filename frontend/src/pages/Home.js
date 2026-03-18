import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiSearch, FiStar, FiUsers, FiAward } from "react-icons/fi";

const Home = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>
            Learn Together,
            <br />
            <span>Grow Together</span>
          </h1>
          <p>
            Connect with peer volunteers for academic support. Master your
            subjects with personalized, 1-on-1 tutoring sessions—completely
            free.
          </p>
          <div className="hero-buttons">
            {user ? (
              <>
                <Link
                  to={user.role === "student" ? "/find-volunteer" : "/dashboard/volunteer"}
                  className="btn btn-primary btn-lg"
                >
                  {user.role === "student" ? "Find a Volunteer →" : "Go to Dashboard →"}
                </Link>
                <Link to="/volunteers" className="btn btn-outline btn-lg">
                  Browse Volunteers
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Register as Student →
                </Link>
                <Link to="/register?role=volunteer" className="btn btn-outline btn-lg">
                  Become a Volunteer
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Our smart matching system helps you find the perfect volunteer tutor</p>
          </div>

          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">
                <FiSearch />
              </div>
              <h3>Smart Matching</h3>
              <p>
                Our algorithm considers subject expertise, availability, experience
                level, ratings, and reputation to find your ideal tutor.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">
                <FiStar />
              </div>
              <h3>Transparent Feedback</h3>
              <p>
                View detailed ratings, reviews, and reputation scores for every
                volunteer. Make informed decisions with verified feedback.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">
                <FiUsers />
              </div>
              <h3>1-on-1 Sessions</h3>
              <p>
                Book personalized tutoring sessions with peer volunteers.
                Confirm completion and share your experience.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">
                <FiAward />
              </div>
              <h3>Leaderboard & Badges</h3>
              <p>
                Top volunteers earn recognition badges. View the leaderboard
                to find the most reliable and highly rated tutors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ marginBottom: 16 }}>Ready to Start Learning?</h2>
          <p style={{ color: "var(--gray-500)", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
            Join thousands of students who are already benefiting from free peer tutoring.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started — It's Free
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
