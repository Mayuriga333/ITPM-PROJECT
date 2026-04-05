import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Plus,
  ArrowLeft,
  Save,
  X,
  Bell,
  BellRing,
  MapPin
} from 'lucide-react';

const TimeScheduleCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    category: 'study',
    priority: 'medium',
    location: '',
    participants: '',
    reminder: true,
    reminderTime: '15'
  });
  const [errors, setErrors] = useState({});
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifiedSchedules, setNotifiedSchedules] = useState(new Set());

  const categories = [
    { value: 'study', label: 'Study Session', icon: BookOpen, color: 'blue' },
    { value: 'meeting', label: 'Meeting', icon: User, color: 'green' },
    { value: 'assignment', label: 'Assignment', icon: Calendar, color: 'purple' },
    { value: 'break', label: 'Break', icon: Clock, color: 'yellow' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'red' }
  ];

  useEffect(() => {
    checkUpcomingSchedules();
    const interval = setInterval(checkUpcomingSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkUpcomingSchedules = () => {
    const schedules = JSON.parse(localStorage.getItem('timeSchedules') || '[]');
    const now = new Date();
    const currentTime = now.getTime();
    let upcoming = [];
    let updatedSchedules = [...schedules];
    let hasChanges = false;

    updatedSchedules = updatedSchedules.map(schedule => {
      const scheduleDateTime = new Date(`${schedule.date}T${schedule.startTime}`);
      const scheduleEndTime = new Date(`${schedule.date}T${schedule.endTime}`);
      
      let updatedSchedule = { ...schedule };
      
      // Update status based on current time
      if (schedule.status === 'upcoming') {
        if (currentTime >= scheduleDateTime.getTime() && currentTime < scheduleEndTime.getTime()) {
          // Schedule is now ongoing
          updatedSchedule.status = 'ongoing';
          hasChanges = true;
        } else if (currentTime >= scheduleEndTime.getTime()) {
          // Schedule has ended
          updatedSchedule.status = 'completed';
          hasChanges = true;
        }
      } else if (schedule.status === 'ongoing') {
        if (currentTime >= scheduleEndTime.getTime()) {
          // Schedule just ended
          updatedSchedule.status = 'completed';
          hasChanges = true;
        }
      }
      
      // Check for upcoming reminders (exactly 15 minutes before)
      if (schedule.status === 'upcoming' && schedule.reminder) {
        const timeUntilStart = scheduleDateTime.getTime() - currentTime;
        const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));
        
        // Show notification when exactly 15 minutes (or specified time) before start
        if (minutesUntilStart <= parseInt(schedule.reminderTime || 15) && minutesUntilStart > 0 && !notifiedSchedules.has(schedule.id)) {
          upcoming.push(updatedSchedule);
          setNotifiedSchedules(prev => new Set(prev).add(schedule.id));
        }
      }
      
      return updatedSchedule;
    });

    // Update schedules in localStorage if there are changes
    if (hasChanges) {
      localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    }

    setUpcomingSchedules(upcoming);
    setNotificationCount(upcoming.length);
    
    // Show toast notifications
    if (upcoming.length > 0) {
      upcoming.forEach(schedule => {
        toast(`"${schedule.title}" starts in ${schedule.reminderTime || 15} minutes!`, {
          icon: '⏰',
          duration: 5000
        });
      });
    }
  };

  const formatScheduleTime = (date, time) => {
    const scheduleDateTime = new Date(`${date}T${time}`);
    return scheduleDateTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTimeUntilStart = (date, startTime) => {
    const now = new Date();
    const scheduleDateTime = new Date(`${date}T${startTime}`);
    const diffMs = scheduleDateTime.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Starting now';
    if (diffMinutes <= 60) return `${diffMinutes} minutes`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const validateDateTime = () => {
    const newErrors = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Date validation
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      if (selectedDay < today) {
        newErrors.date = 'Cannot select past dates';
      } else if (selectedDay.getTime() === today.getTime() && formData.startTime) {
        // If today, validate time
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const selectedTime = hours * 60 + minutes;
        
        if (selectedTime <= currentTime) {
          newErrors.startTime = 'Cannot select past times for today';
        }
      }
    }
    
    // Time validation
    if (formData.startTime && formData.endTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;
      
      if (startTime >= endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Date/time validation
    if (!validateDateTime()) {
      toast.error('Please fix validation errors');
      return;
    }

    // Create schedule object
    const newSchedule = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      status: 'upcoming'
    };

    // Save to localStorage (in real app, this would be an API call)
    const existingSchedules = JSON.parse(localStorage.getItem('timeSchedules') || '[]');
    existingSchedules.push(newSchedule);
    localStorage.setItem('timeSchedules', JSON.stringify(existingSchedules));

    toast.success('Schedule created successfully!');
    navigate('/schedule/manage');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Re-validate date/time when relevant fields change
    if (name === 'date' || name === 'startTime' || name === 'endTime') {
      setTimeout(() => validateDateTime(), 100);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
              <h1 className="text-3xl font-bold text-white">Create Schedule</h1>
              <p className="text-gray-300 mt-1">Add a new time schedule to your calendar</p>
            </div>
          </div>
          
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationModal(true)}
              className={`relative p-3 rounded-lg transition-all transform hover:scale-105 ${
                notificationCount > 0 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {notificationCount > 0 ? (
                <BellRing className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 text-white" />
              )}
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xs text-white font-bold">{notificationCount}</span>
                </div>
              )}
            </button>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter schedule title"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Enter schedule description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.date ? 'border-red-500' : 'border-white/10'
                    }`}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-400">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.startTime ? 'border-red-500' : 'border-white/10'
                    }`}
                    required
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-400">{errors.startTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.endTime ? 'border-red-500' : 'border-white/10'
                    }`}
                    required
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-400">{errors.endTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Participants
                  </label>
                  <input
                    type="text"
                    name="participants"
                    value={formData.participants}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter participant names (comma separated)"
                  />
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Reminder Settings</span>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="reminder"
                      checked={formData.reminder}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`relative w-11 h-6 transition-colors rounded-full ${
                      formData.reminder ? 'bg-purple-600' : 'bg-gray-600'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.reminder ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </label>
                </div>

                {formData.reminder && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Remind me before
                    </label>
                    <select
                      name="reminderTime"
                      value={formData.reminderTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="1440">1 day</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <BellRing className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Upcoming Schedules</h2>
                    <p className="text-gray-300">Schedules starting soon</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {upcomingSchedules.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSchedules.map((schedule, index) => {
                    const categoryInfo = getCategoryInfo(schedule.category);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 bg-${categoryInfo.color}-500/20 rounded-lg`}>
                              <CategoryIcon className={`w-5 h-5 text-${categoryInfo.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-semibold">{schedule.title}</h4>
                              <p className="text-gray-300 text-sm mt-1">{schedule.description}</p>
                              <div className="flex items-center space-x-4 mt-3 text-sm">
                                <div className="flex items-center text-gray-300">
                                  <Calendar className="w-4 h-4 mr-1 text-orange-400" />
                                  {formatDate(schedule.date)}
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <Clock className="w-4 h-4 mr-1 text-orange-400" />
                                  {formatScheduleTime(schedule.date, schedule.startTime)}
                                </div>
                                {schedule.location && (
                                  <div className="flex items-center text-gray-300">
                                    <MapPin className="w-4 h-4 mr-1 text-orange-400" />
                                    {schedule.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-400 font-semibold">
                              {getTimeUntilStart(schedule.date, schedule.startTime)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Starts in {schedule.reminderTime || 15} min
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Schedules</h3>
                  <p className="text-gray-400">
                    You don't have any schedules starting within the next 15 minutes.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeScheduleCreate;
