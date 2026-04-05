import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  Save,
  Eye,
  MapPin,
  Users,
  Bell,
  BellRing,
  Home
} from 'lucide-react';

const TimeScheduleManage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editErrors, setEditErrors] = useState({});
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
    loadSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, filterCategory, filterStatus]);

  // Check for upcoming schedules every minute
  useEffect(() => {
    checkUpcomingSchedules();
    const interval = setInterval(checkUpcomingSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedules]);

  const checkUpcomingSchedules = () => {
    const now = new Date();
    const currentTime = now.getTime();
    let upcoming = [];
    let updatedSchedules = [...schedules];
    let hasChanges = false;

    updatedSchedules = updatedSchedules.map(schedule => {
      const scheduleDateTime = new Date(`${schedule.date}T${schedule.startTime}`);
      const scheduleEndTime = new Date(`${schedule.date}T${schedule.endTime}`);
      const reminderTime = scheduleDateTime.getTime() - (parseInt(schedule.reminderTime || 15) * 60 * 1000);
      
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
      setSchedules(updatedSchedules);
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

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditInputChange = (field, value) => {
    setEditingSchedule(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Re-validate date/time when relevant fields change
    if (field === 'date' || field === 'startTime' || field === 'endTime') {
      setTimeout(() => validateEditDateTime(), 100);
    }
  };

  const loadSchedules = () => {
    const storedSchedules = JSON.parse(localStorage.getItem('timeSchedules') || '[]');
    setSchedules(storedSchedules);
  };

  const formatScheduleTime = (date, time) => {
    const scheduleDateTime = new Date(`${date}T${time}`);
    return scheduleDateTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
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

  const filterSchedules = () => {
    let filtered = schedules;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(schedule => schedule.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === filterStatus);
    }

    setFilteredSchedules(filtered);
  };

  const validateEditDateTime = () => {
    const newErrors = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Date validation
    if (editingSchedule?.date) {
      const selectedDate = new Date(editingSchedule.date);
      const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      if (selectedDay < today) {
        newErrors.date = 'Cannot select past dates';
      } else if (selectedDay.getTime() === today.getTime() && editingSchedule?.startTime) {
        // If today, validate time
        const [hours, minutes] = editingSchedule.startTime.split(':').map(Number);
        const selectedTime = hours * 60 + minutes;
        
        if (selectedTime <= currentTime) {
          newErrors.startTime = 'Cannot select past times for today';
        }
      }
    }
    
    // Time validation
    if (editingSchedule?.startTime && editingSchedule?.endTime) {
      const [startHours, startMinutes] = editingSchedule.startTime.split(':').map(Number);
      const [endHours, endMinutes] = editingSchedule.endTime.split(':').map(Number);
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;
      
      if (startTime >= endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (schedule) => {
    setEditingSchedule({ ...schedule });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingSchedule.title || !editingSchedule.date || !editingSchedule.startTime || !editingSchedule.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateEditDateTime()) {
      toast.error('Please fix validation errors');
      return;
    }

    const updatedSchedules = schedules.map(s =>
      s.id === editingSchedule.id ? editingSchedule : s
    );
    
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    setShowEditModal(false);
    setEditingSchedule(null);
    toast.success('Schedule updated successfully!');
  };

  const checkScheduleEnd = () => {
    const now = new Date();
    const currentTime = now.getTime();
    let updatedSchedules = [...schedules];
    let hasChanges = false;

    updatedSchedules = updatedSchedules.map(schedule => {
      const scheduleEndTime = new Date(`${schedule.date}T${schedule.endTime}`);
      
      if (schedule.status === 'ongoing' && currentTime >= scheduleEndTime.getTime()) {
        // Schedule just ended
        const updatedSchedule = { ...schedule, status: 'completed' };
        hasChanges = true;
        
        // Show completion notification
        toast(`"${schedule.title}" has ended!`, {
          icon: '✅',
          duration: 5000
        });
        
        return updatedSchedule;
      }
      
      return schedule;
    });

    if (hasChanges) {
      localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
    }
  };

  const handleDelete = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const updatedSchedules = schedules.filter(s => s.id !== scheduleToDelete.id);
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    setShowDeleteModal(false);
    setScheduleToDelete(null);
    toast.success('Schedule deleted successfully!');
  };

  const handleView = (schedule) => {
    setViewingSchedule(schedule);
    setShowViewModal(true);
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-500',
      ongoing: 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <button
              onClick={() => navigate('/')}
              className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <Home className="w-5 h-5 text-white" />
              <span className="text-white hidden sm:inline">Home</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Manage Schedules</h1>
              <p className="text-gray-300 mt-1">View, edit, and manage your time schedules</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
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
            <button
              onClick={() => navigate('/schedule/create')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Schedule</span>
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-container p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="text-white flex items-center justify-center">
              <span className="text-sm text-gray-300">
                {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Schedules Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSchedules.map((schedule, index) => {
            const categoryInfo = getCategoryInfo(schedule.category);
            const priorityInfo = getPriorityInfo(schedule.priority);
            const CategoryIcon = categoryInfo.icon;

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card-container p-6 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${categoryInfo.color}-500/20 rounded-lg`}>
                      <CategoryIcon className={`w-5 h-5 text-${categoryInfo.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{schedule.title}</h3>
                      <span className="text-xs text-gray-400">{categoryInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(schedule.priority)}`} />
                    <span className="text-xs text-gray-400">{priorityInfo.label}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                    {formatDate(schedule.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Clock className="w-4 h-4 mr-2 text-purple-400" />
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  {schedule.location && (
                    <div className="flex items-center text-sm text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      {schedule.location}
                    </div>
                  )}
                  {schedule.participants && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      {schedule.participants}
                    </div>
                  )}
                </div>

                {schedule.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {schedule.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(schedule.status)} bg-opacity-20 text-white`}>
                    {schedule.status || 'upcoming'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(schedule)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredSchedules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No schedules found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Create your first schedule to get started'}
            </p>
            {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/schedule/create')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Schedule</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSchedule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Schedule</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingSchedule.title}
                    onChange={(e) => handleEditInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editingSchedule.description || ''}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingSchedule.date}
                      onChange={(e) => handleEditInputChange('date', e.target.value)}
                      min={getMinDate()}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        editErrors.date ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    {editErrors.date && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={editingSchedule.category}
                      onChange={(e) => handleEditInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editingSchedule.startTime}
                      onChange={(e) => handleEditInputChange('startTime', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        editErrors.startTime ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    {editErrors.startTime && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.startTime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                    <input
                      type="time"
                      value={editingSchedule.endTime}
                      onChange={(e) => handleEditInputChange('endTime', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        editErrors.endTime ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    {editErrors.endTime && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.endTime}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                    <select
                      value={editingSchedule.priority}
                      onChange={(e) => handleEditInputChange('priority', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={editingSchedule.status || 'upcoming'}
                      onChange={(e) => handleEditInputChange('status', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={editingSchedule.location || ''}
                    onChange={(e) => handleEditInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Participants</label>
                  <input
                    type="text"
                    value={editingSchedule.participants || ''}
                    onChange={(e) => handleEditInputChange('participants', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter participant names (comma separated)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingSchedule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Schedule Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-${getCategoryInfo(viewingSchedule.category).color}-500/20 rounded-lg`}>
                    {(() => {
                      const CategoryIcon = getCategoryInfo(viewingSchedule.category).icon;
                      return <CategoryIcon className={`w-6 h-6 text-${getCategoryInfo(viewingSchedule.category).color}-400`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{viewingSchedule.title}</h3>
                    <p className="text-gray-400">{getCategoryInfo(viewingSchedule.category).label}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Date</p>
                      <div className="flex items-center text-white">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                        {formatDate(viewingSchedule.date)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Time</p>
                      <div className="flex items-center text-white">
                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                        {viewingSchedule.startTime} - {viewingSchedule.endTime}
                      </div>
                    </div>
                    {viewingSchedule.location && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Location</p>
                        <div className="flex items-center text-white">
                          <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                          {viewingSchedule.location}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Priority</p>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(viewingSchedule.priority)} mr-2`} />
                        <span className="text-white capitalize">{getPriorityInfo(viewingSchedule.priority).label}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(viewingSchedule.status || 'upcoming')} bg-opacity-20 text-white capitalize`}>
                        {viewingSchedule.status || 'upcoming'}
                      </span>
                    </div>
                    {viewingSchedule.reminder && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Reminder</p>
                        <div className="flex items-center text-white">
                          <Clock className="w-4 h-4 mr-2 text-purple-400" />
                          {viewingSchedule.reminderTime || 15} minutes before
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {viewingSchedule.description && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white">{viewingSchedule.description}</p>
                  </div>
                )}

                {viewingSchedule.participants && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Participants</p>
                    <div className="flex items-center text-white">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      {viewingSchedule.participants}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    Created on {new Date(viewingSchedule.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingSchedule);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Schedule</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && scheduleToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Schedule</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete "{scheduleToDelete.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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

export default TimeScheduleManage;
