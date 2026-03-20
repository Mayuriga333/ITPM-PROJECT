import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { volunteerAPI, studentAPI } from '../services/api';
import { storage } from '../services/storage';
import toast from 'react-hot-toast';

const subjects = [
  'Python', 'Calculus', 'Physics', 'Chemistry', 
  'Statistics', 'Economics', 'Biology', 'English'
];

const availabilityOptions = ['Available Now', 'This Week', 'Any Time'];

const RegisterPage = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const volunteerId = location.state?.volunteerId;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: [],
    bio: '',
    availability: 'Any Time'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'volunteer') {
        if (formData.subjects.length === 0) {
          toast.error('Please select at least one subject');
          return;
        }
        
        const response = await volunteerAPI.register(formData);
        storage.setCurrentVolunteer(response.data);
        toast.success('Registration successful!');
        navigate('/volunteer/dashboard');
      } else {
        const response = await studentAPI.register(formData);
        storage.setCurrentStudent(response.data);
        toast.success('Registration successful!');
        
        if (volunteerId) {
          navigate(`/request/${volunteerId}`);
        } else {
          navigate('/discovery');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-surface p-8">
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          {type === 'volunteer' ? 'Become a Volunteer' : 'Student Registration'}
        </h2>
        <p className="text-slate-400 mb-6">
          {type === 'volunteer' 
            ? 'Share your knowledge and help fellow students succeed.' 
            : 'Register to start requesting support from volunteers.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          {/* Subjects (for volunteers only) */}
          {type === 'volunteer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Subjects you can teach
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectToggle(subject)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.subjects.includes(subject)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="input-field"
                >
                  {availabilityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Tell students about yourself and your teaching style..."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;