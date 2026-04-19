import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  BookOpen, 
  Clock, 
  Star,
  Calendar,
  Plus,
  X,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const VolunteerRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    subjects: [],
    experienceLevel: 'intermediate',
    bio: '',
    availability: {
      monday: { available: false, from: '', to: '' },
      tuesday: { available: false, from: '', to: '' },
      wednesday: { available: false, from: '', to: '' },
      thursday: { available: false, from: '', to: '' },
      friday: { available: false, from: '', to: '' },
      saturday: { available: false, from: '', to: '' },
      sunday: { available: false, from: '', to: '' }
    }
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'advanced', label: 'Advanced (3-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
  ];

  const commonSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'History', 'Geography', 'Economics', 'Psychology',
    'Literature', 'Philosophy', 'Statistics', 'Engineering', 'Medicine'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Please select at least one subject';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 20) {
      newErrors.bio = 'Bio must be at least 20 characters';
    }

    // Check if at least one day is available
    const hasAvailability = Object.values(formData.availability).some(day => day.available);
    if (!hasAvailability) {
      newErrors.availability = 'Please specify at least one day of availability';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      // Register user first
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'Volunteer'
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const userData = await userResponse.json();

      // Create volunteer profile
      const volunteerResponse = await fetch('/api/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          subjects: formData.subjects,
          experienceLevel: formData.experienceLevel,
          bio: formData.bio,
          availability: formData.availability
        })
      });

      if (!volunteerResponse.ok) {
        const errorData = await volunteerResponse.json();
        throw new Error(errorData.message || 'Failed to create volunteer profile');
      }

      toast.success('Volunteer registration successful! Your profile is pending approval.');
      navigate('/login');

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addSubject = () => {
    if (currentSubject.trim() && !formData.subjects.includes(currentSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, currentSubject.trim()]
      }));
      setCurrentSubject('');
      if (errors.subjects) {
        setErrors(prev => ({ ...prev, subjects: '' }));
      }
    }
  };

  const removeSubject = (subjectToRemove) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject !== subjectToRemove)
    }));
  };

  const toggleDayAvailability = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          available: !prev.availability[day].available
        }
      }
    }));
  };

  const updateTimeSlot = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Volunteer Registration</h1>
              <p className="text-gray-300 mt-1">Join our community of dedicated volunteers</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="card-container p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Create a password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Subjects & Experience */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-400" />
                  Subjects & Experience
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subjects You Can Teach *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center space-x-1"
                        >
                          <span>{subject}</span>
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentSubject}
                        onChange={(e) => setCurrentSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type a subject and press Enter"
                      />
                      <button
                        type="button"
                        onClick={addSubject}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {commonSubjects.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => {
                            if (!formData.subjects.includes(subject)) {
                              setFormData(prev => ({
                                ...prev,
                                subjects: [...prev.subjects, subject]
                              }));
                            }
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors"
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                    {errors.subjects && (
                      <p className="mt-1 text-sm text-red-400">{errors.subjects}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {experienceLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tell us about yourself *
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.bio ? 'border-red-500' : 'border-white/10'
                  }`}
                  placeholder="Share your background, teaching experience, and why you want to volunteer..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
                )}
              </div>

              {/* Availability */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                  Availability
                </h2>
                <div className="space-y-4">
                  {days.map((day) => (
                    <div key={day} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-[120px]">
                        <input
                          type="checkbox"
                          checked={formData.availability[day].available}
                          onChange={() => toggleDayAvailability(day)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <label className="text-white capitalize">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </label>
                      </div>
                      {formData.availability[day].available && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={formData.availability[day].from}
                            onChange={(e) => updateTimeSlot(day, 'from', e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="From"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={formData.availability[day].to}
                            onChange={(e) => updateTimeSlot(day, 'to', e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="To"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.availability && (
                  <p className="mt-1 text-sm text-red-400">{errors.availability}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Register as Volunteer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VolunteerRegistration;
