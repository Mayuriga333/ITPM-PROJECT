import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AvailabilityEditor from "../components/AvailabilityEditor";
import { toast } from "react-toastify";

const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") || "student";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
    subjects: "",
    experienceLevel: "intermediate",
    bio: "",
    availability: {},
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "volunteer") {
        payload.subjects = formData.subjects.split(",").map((s) => s.trim()).filter(Boolean);
        payload.experienceLevel = formData.experienceLevel;
        payload.bio = formData.bio;
        payload.availability = formData.availability;
      }

      const user = await register(payload);
      toast.success(`Welcome to EduConnect, ${user.name}!`);
      if (user.role === "student") navigate("/find-volunteer");
      else navigate("/dashboard/volunteer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card card-elevated">
        <h2>Create Account</h2>
        <p className="subtitle">Join EduConnect for free peer tutoring</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">I want to</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Register as a Student</option>
              <option value="volunteer">Become a Volunteer</option>
            </select>
          </div>

          {formData.role === "volunteer" && (
            <>
              <div className="form-group">
                <label className="form-label">Subjects (comma-separated)</label>
                <input
                  type="text"
                  name="subjects"
                  className="form-input"
                  placeholder="e.g. Python, Mathematics, Physics"
                  value={formData.subjects}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  name="experienceLevel"
                  className="form-select"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  className="form-textarea"
                  placeholder="Tell students about yourself and your teaching style..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weekly Availability</label>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 8 }}>
                  Set your available days and hours (you can update this later)
                </p>
                <AvailabilityEditor
                  availability={formData.availability}
                  onChange={(newAvail) =>
                    setFormData({ ...formData, availability: newAvail })
                  }
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
