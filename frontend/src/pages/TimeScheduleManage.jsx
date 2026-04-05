import { useState, useEffect, useRef } from 'react';
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
  Home,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock3,
  CalendarCheck,
  UserCheck,
  Activity,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  Settings
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
  const [selectedSchedules, setSelectedSchedules] = useState(new Set());
  const [showStats, setShowStats] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [achievements, setAchievements] = useState({
    totalSchedules: 0,
    completedSchedules: 0,
    streak: 0,
    points: 0
  });
  
  // Volunteer Integration States
  const [volunteers, setVolunteers] = useState([]);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [showVolunteerStats, setShowVolunteerStats] = useState(false);
  const [volunteerStats, setVolunteerStats] = useState({
    totalVolunteers: 0,
    activeVolunteers: 0,
    totalHours: 0,
    averageRating: 0,
    completedSessions: 0
  });

  // Jitsi Meeting States
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [jitsiApi, setJitsiApi] = useState(null);
  const [meetingRoom, setMeetingRoom] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingParticipants, setMeetingParticipants] = useState([]);
  const jitsiContainerRef = useRef(null);

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

  const scheduleTemplates = [
    {
      id: 'study-session',
      name: 'Study Session',
      category: 'study',
      duration: 120,
      priority: 'medium',
      reminder: true,
      reminderTime: '15'
    },
    {
      id: 'team-meeting',
      name: 'Team Meeting',
      category: 'meeting',
      duration: 60,
      priority: 'high',
      reminder: true,
      reminderTime: '30'
    },
    {
      id: 'assignment-work',
      name: 'Assignment Work',
      category: 'assignment',
      duration: 90,
      priority: 'high',
      reminder: true,
      reminderTime: '15'
    },
    {
      id: 'short-break',
      name: 'Short Break',
      category: 'break',
      duration: 15,
      priority: 'low',
      reminder: false
    }
  ];

  // Calculate statistics
  const calculateStats = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisWeek = getWeekDates(today);
    const thisMonth = getMonthDates(today);

    const todaySchedules = schedules.filter(s => s.date === todayStr);
    const weekSchedules = schedules.filter(s => thisWeek.includes(s.date));
    const monthSchedules = schedules.filter(s => thisMonth.includes(s.date));
    const completedSchedules = schedules.filter(s => s.status === 'completed');
    const upcomingSchedules = schedules.filter(s => s.status === 'upcoming');
    const ongoingSchedules = schedules.filter(s => s.status === 'ongoing');

    // Calculate completion rate
    const completionRate = schedules.length > 0 
      ? Math.round((completedSchedules.length / schedules.length) * 100)
      : 0;

    // Calculate category distribution
    const categoryStats = categories.map(cat => ({
      ...cat,
      count: schedules.filter(s => s.category === cat.value).length,
      percentage: schedules.length > 0 
        ? Math.round((schedules.filter(s => s.category === cat.value).length / schedules.length) * 100)
        : 0
    }));

    // Calculate streak
    const streak = calculateStreak();

    // Calculate points
    const points = calculatePoints(completedSchedules.length, streak);

    return {
      totalSchedules: schedules.length,
      todaySchedules: todaySchedules.length,
      weekSchedules: weekSchedules.length,
      monthSchedules: monthSchedules.length,
      completedSchedules: completedSchedules.length,
      upcomingSchedules: upcomingSchedules.length,
      ongoingSchedules: ongoingSchedules.length,
      completionRate,
      categoryStats,
      streak,
      points
    };
  };

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toISOString().split('T')[0]);
    }
    return week;
  };

  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const calculateStreak = () => {
    const sortedDates = [...new Set(schedules.map(s => s.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculatePoints = (completedCount, streak) => {
    return (completedCount * 10) + (streak * 5);
  };

  // Volunteer Integration Functions
  const loadVolunteers = () => {
    // Mock volunteer data - in real app, this would be an API call
    const mockVolunteers = [
      {
        id: 'v1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        skills: ['Mathematics', 'Physics'],
        availability: ['Morning', 'Afternoon'],
        rating: 4.8,
        experienceLevel: 3,
        totalHours: 120,
        completedSessions: 45,
        status: 'active',
        bio: 'Experienced tutor passionate about helping students succeed'
      },
      {
        id: 'v2',
        name: 'Michael Chen',
        email: 'michael@example.com',
        skills: ['Computer Science', 'Mathematics'],
        availability: ['Evening', 'Weekend'],
        rating: 4.6,
        experienceLevel: 2,
        totalHours: 85,
        completedSessions: 32,
        status: 'active',
        bio: 'Computer science student with strong math background'
      },
      {
        id: 'v3',
        name: 'Emily Davis',
        email: 'emily@example.com',
        skills: ['English', 'History'],
        availability: ['Weekday', 'Afternoon'],
        rating: 4.9,
        experienceLevel: 4,
        totalHours: 200,
        completedSessions: 78,
        status: 'active',
        bio: 'Professional educator with 10+ years of experience'
      }
    ];
    setVolunteers(mockVolunteers);
  };

  const calculateVolunteerStats = () => {
    const assignments = JSON.parse(localStorage.getItem('volunteerAssignments') || '[]');
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
    const completedSessions = assignments.filter(a => a.status === 'completed').length;
    const totalHours = assignments.reduce((sum, a) => sum + (a.duration || 1), 0);
    const avgRating = volunteers.length > 0 
      ? volunteers.reduce((sum, v) => sum + v.rating, 0) / volunteers.length 
      : 0;

    setVolunteerStats({
      totalVolunteers: volunteers.length,
      activeVolunteers,
      totalHours,
      averageRating: avgRating,
      completedSessions
    });
  };

  const findMatchingVolunteers = (schedule) => {
    return volunteers.filter(volunteer => {
      // Check availability match
      const scheduleTime = new Date(`${schedule.date}T${schedule.startTime}`);
      const hour = scheduleTime.getHours();
      
      let timeSlot = 'Morning';
      if (hour >= 12 && hour < 17) timeSlot = 'Afternoon';
      else if (hour >= 17) timeSlot = 'Evening';
      else if (hour >= 6 && hour < 12) timeSlot = 'Morning';
      
      const isAvailable = volunteer.availability.includes(timeSlot) || 
                          (hour >= 6 && hour < 18 && volunteer.availability.includes('Weekday')) ||
                          (hour >= 18 && volunteer.availability.includes('Evening'));
      
      // Check skill match (based on category)
      const categorySkills = {
        'study': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
        'meeting': ['Communication', 'Leadership', 'Teamwork'],
        'assignment': ['Writing', 'Research', 'Analysis'],
        'break': []
      };
      
      const hasSkill = schedule.category === 'break' || 
                     volunteer.skills.some(skill => 
                       categorySkills[schedule.category]?.includes(skill)
                     );
      
      return isAvailable && hasSkill && volunteer.status === 'active';
    });
  };

  const assignVolunteerToSchedule = (schedule, volunteer) => {
    const assignment = {
      id: Date.now().toString(),
      scheduleId: schedule.id,
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      volunteerEmail: volunteer.email,
      scheduleTitle: schedule.title,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: calculateDuration(schedule.startTime, schedule.endTime),
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      rating: null,
      feedback: null
    };
    
    const assignments = JSON.parse(localStorage.getItem('volunteerAssignments') || '[]');
    assignments.push(assignment);
    localStorage.setItem('volunteerAssignments', JSON.stringify(assignments));
    
    // Update schedule with volunteer info
    const updatedSchedules = schedules.map(s => 
      s.id === schedule.id 
        ? { ...s, assignedVolunteer: volunteer, volunteerAssignmentId: assignment.id }
        : s
    );
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    
    toast.success(`${volunteer.name} assigned to "${schedule.title}"`);
    setShowVolunteerModal(false);
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end - start) / (1000 * 60 * 60); // hours
  };

  const updateAssignmentStatus = (assignmentId, status, rating = null, feedback = null) => {
    const assignments = JSON.parse(localStorage.getItem('volunteerAssignments') || '[]');
    const updatedAssignments = assignments.map(a => 
      a.id === assignmentId 
        ? { ...a, status, rating, feedback, completedAt: status === 'completed' ? new Date().toISOString() : null }
        : a
    );
    localStorage.setItem('volunteerAssignments', JSON.stringify(updatedAssignments));
    setVolunteerAssignments(updatedAssignments);
  };

  const getVolunteerForSchedule = (scheduleId) => {
    const assignments = JSON.parse(localStorage.getItem('volunteerAssignments') || '[]');
    const assignment = assignments.find(a => a.scheduleId === scheduleId && a.status !== 'cancelled');
    return assignment;
  };

  // Jitsi Meeting Functions
  const generateMeetingRoom = (schedule, volunteer) => {
    const timestamp = Date.now();
    const roomName = `${schedule.title.replace(/\s+/g, '-')}-${volunteer.name.replace(/\s+/g, '-')}-${timestamp}`;
    return roomName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  const startJitsiMeeting = (schedule, volunteer) => {
    const roomName = generateMeetingRoom(schedule, volunteer);
    setMeetingRoom(roomName);
    setCurrentMeeting({ schedule, volunteer });
    setShowMeetingModal(true);
    
    // Load Jitsi Meet API script if not already loaded
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initializeJitsiMeeting(roomName, schedule, volunteer);
      document.head.appendChild(script);
    } else {
      initializeJitsiMeeting(roomName, schedule, volunteer);
    }
  };

  const initializeJitsiMeeting = (roomName, schedule, volunteer) => {
    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        subject: `${schedule.title} - ${volunteer.name}`,
        displayName: 'Student',
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'info', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'e2ee'
        ],
        settingsButtons: ['microphone', 'camera', 'captions', 'devices'],
        enableWelcomePage: false,
        enableClosePage: false,
        hideConferenceSubject: false,
        hideParticipantsStatusbar: false,
        startScreenSharing: false,
        enableEmailInStats: false,
        enableAnalytics: false,
        p2p: {
          enabled: true
        }
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'profile', 'moderator'],
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_JITI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Volunteer',
        DEFAULT_LOCAL_DISPLAY_NAME: 'You',
        TOOLBAR_ALWAYS_VISIBLE: true,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        RANDOM_AVATAR_URL_PREFIX: false,
        FILM_STRIP_ONLY: false,
        VERTICAL_FILMSTRIP: true,
        SHOW_BRAND_WATERMARK: false,
        SHOW_DEEP_LINKING_IMAGE: false
      },
      userInfo: {
        displayName: 'Student',
        email: 'student@example.com'
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    setJitsiApi(api);

    // Listen for meeting events
    api.addEventListener('videoConferenceJoined', (payload) => {
      console.log('Meeting joined:', payload);
      toast.success('Meeting started!');
    });

    api.addEventListener('participantJoined', (payload) => {
      console.log('Participant joined:', payload);
      setMeetingParticipants(prev => [...prev, payload.id]);
      toast.success(`${payload.displayName} joined the meeting`);
    });

    api.addEventListener('participantLeft', (payload) => {
      console.log('Participant left:', payload);
      setMeetingParticipants(prev => prev.filter(id => id !== payload.id));
      toast.info(`${payload.displayName} left the meeting`);
    });

    api.addEventListener('videoMuteStatusChanged', (payload) => {
      setIsVideoEnabled(!payload.muted);
    });

    api.addEventListener('audioMuteStatusChanged', (payload) => {
      setIsAudioEnabled(!payload.muted);
    });

    api.addEventListener('screenSharingStatusChanged', (payload) => {
      setIsScreenSharing(payload.on);
      toast.info(payload.on ? 'Screen sharing started' : 'Screen sharing stopped');
    });

    api.addEventListener('readyToClose', () => {
      endMeeting();
    });

    // Save meeting info to localStorage
    const meetingInfo = {
      roomName,
      scheduleId: schedule.id,
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      scheduleTitle: schedule.title,
      startTime: new Date().toISOString(),
      status: 'active'
    };
    
    const meetings = JSON.parse(localStorage.getItem('activeMeetings') || '[]');
    meetings.push(meetingInfo);
    localStorage.setItem('activeMeetings', JSON.stringify(meetings));
  };

  const toggleVideo = () => {
    if (jitsiApi) {
      if (isVideoEnabled) {
        jitsiApi.executeCommand('toggleVideo');
      } else {
        jitsiApi.executeCommand('toggleVideo');
      }
    }
  };

  const toggleAudio = () => {
    if (jitsiApi) {
      if (isAudioEnabled) {
        jitsiApi.executeCommand('toggleAudio');
      } else {
        jitsiApi.executeCommand('toggleAudio');
      }
    }
  };

  const toggleScreenShare = () => {
    if (jitsiApi) {
      if (isScreenSharing) {
        jitsiApi.executeCommand('toggleShareScreen');
      } else {
        jitsiApi.executeCommand('toggleShareScreen');
      }
    }
  };

  const endMeeting = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
      setJitsiApi(null);
    }
    
    // Update meeting status in localStorage
    const meetings = JSON.parse(localStorage.getItem('activeMeetings') || '[]');
    const updatedMeetings = meetings.map(m => 
      m.roomName === meetingRoom 
        ? { ...m, endTime: new Date().toISOString(), status: 'ended' }
        : m
    );
    localStorage.setItem('activeMeetings', JSON.stringify(updatedMeetings));
    
    setShowMeetingModal(false);
    setCurrentMeeting(null);
    setMeetingRoom('');
    setMeetingParticipants([]);
    toast.success('Meeting ended');
  };

  const inviteVolunteerToMeeting = (volunteer, schedule) => {
    const meetingLink = `https://meet.jit.si/${generateMeetingRoom(schedule, volunteer)}`;
    
    // In a real app, this would send an email or notification
    toast.success(`Meeting link generated: ${meetingLink}`);
    
    // Copy to clipboard
    navigator.clipboard.writeText(meetingLink).then(() => {
      toast.success('Meeting link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy meeting link');
    });
  };

  useEffect(() => {
    loadSchedules();
    loadVolunteers();
  }, []);

  useEffect(() => {
    filterSchedules();
    calculateVolunteerStats();
  }, [schedules, searchTerm, filterCategory, filterStatus, volunteers]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Bulk operations
  const toggleScheduleSelection = (scheduleId) => {
    setSelectedSchedules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  const selectAllSchedules = () => {
    if (selectedSchedules.size === filteredSchedules.length) {
      setSelectedSchedules(new Set());
    } else {
      setSelectedSchedules(new Set(filteredSchedules.map(s => s.id)));
    }
  };

  const bulkDelete = () => {
    if (selectedSchedules.size === 0) {
      toast.error('No schedules selected');
      return;
    }

    const updatedSchedules = schedules.filter(s => !selectedSchedules.has(s.id));
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    setSelectedSchedules(new Set());
    toast.success(`Deleted ${selectedSchedules.size} schedules`);
  };

  const bulkComplete = () => {
    if (selectedSchedules.size === 0) {
      toast.error('No schedules selected');
      return;
    }

    const updatedSchedules = schedules.map(s => 
      selectedSchedules.has(s.id) ? { ...s, status: 'completed' } : s
    );
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    setSelectedSchedules(new Set());
    toast.success(`Marked ${selectedSchedules.size} schedules as completed`);
  };

  // Export/Import functionality
  const exportSchedules = () => {
    const dataStr = JSON.stringify(schedules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `schedules_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Schedules exported successfully!');
  };

  const importSchedules = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSchedules = JSON.parse(e.target.result);
        const mergedSchedules = [...schedules, ...importedSchedules];
        localStorage.setItem('timeSchedules', JSON.stringify(mergedSchedules));
        setSchedules(mergedSchedules);
        toast.success(`Imported ${importedSchedules.length} schedules!`);
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  // Template functionality
  const applyTemplate = (template) => {
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const endTime = new Date(now.getTime() + template.duration * 60000);
    const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    const newSchedule = {
      id: Date.now().toString(),
      title: template.name,
      description: '',
      date: now.toISOString().split('T')[0],
      startTime,
      endTime: endTimeStr,
      category: template.category,
      priority: template.priority,
      location: '',
      participants: '',
      reminder: template.reminder,
      reminderTime: template.reminderTime,
      status: 'upcoming',
      createdAt: new Date().toISOString()
    };

    const updatedSchedules = [...schedules, newSchedule];
    localStorage.setItem('timeSchedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    toast.success(`Created schedule from template: ${template.name}`);
    setShowTemplates(false);
  };

  // Calendar navigation
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'n':
            e.preventDefault();
            navigate('/schedule/create');
            break;
          case 'a':
            e.preventDefault();
            selectAllSchedules();
            break;
          case 'e':
            e.preventDefault();
            exportSchedules();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [schedules, filteredSchedules, selectedSchedules]);

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
            
            {/* Real-time Clock */}
            <div className="hidden sm:block ml-8 pl-8 border-l border-white/20">
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2 text-white">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {/* Volunteer Stats Button */}
            <button
              onClick={() => setShowVolunteerStats(true)}
              className="p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 transition-all transform hover:scale-105 border border-green-500/30"
              title="Volunteer Statistics"
            >
              <UserCheck className="w-5 h-5 text-green-400" />
            </button>

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

        {/* Dashboard Statistics */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Dashboard Overview
              </h2>
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Schedules */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="card-container p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Schedules</p>
                    <p className="text-3xl font-bold text-white mt-1">{schedules.length}</p>
                    <p className="text-green-400 text-sm mt-2 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      All time
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </motion.div>

              {/* Today's Schedules */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card-container p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Today</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {schedules.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
                    </p>
                    <p className="text-blue-400 text-sm mt-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>

              {/* Completion Rate */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="card-container p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completion Rate</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {schedules.length > 0 
                        ? Math.round((schedules.filter(s => s.status === 'completed').length / schedules.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-green-400 text-sm mt-2 flex items-center">
                      <Award className="w-3 h-3 mr-1" />
                      {schedules.filter(s => s.status === 'completed').length} completed
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </motion.div>

              {/* Streak & Points */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="card-container p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Streak</p>
                    <p className="text-3xl font-bold text-white mt-1">{calculateStreak()} days</p>
                    <p className="text-yellow-400 text-sm mt-2 flex items-center">
                      <Award className="w-3 h-3 mr-1" />
                      {calculatePoints(schedules.filter(s => s.status === 'completed').length, calculateStreak())} points
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="card-container p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
                <div className="space-y-3">
                  {categories.map((category, index) => {
                    const count = schedules.filter(s => s.category === category.value).length;
                    const percentage = schedules.length > 0 ? Math.round((count / schedules.length) * 100) : 0;
                    const CategoryIcon = category.icon;
                    
                    return (
                      <div key={category.value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-${category.color}-500/20 rounded-lg flex items-center justify-center`}>
                            <CategoryIcon className={`w-4 h-4 text-${category.color}-400`} />
                          </div>
                          <span className="text-gray-300">{category.label}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div
                              className={`bg-${category.color}-500 h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Weekly Overview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="card-container p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + index);
                    const dateStr = date.toISOString().split('T')[0];
                    const daySchedules = schedules.filter(s => s.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div
                        key={day}
                        className={`text-center p-2 rounded-lg ${
                          isToday ? 'bg-purple-500/20 border border-purple-500' : 'bg-white/5'
                        }`}
                      >
                        <p className="text-xs text-gray-400 mb-1">{day}</p>
                        <p className="text-sm text-white mb-1">{date.getDate()}</p>
                        <div className="flex justify-center space-x-1">
                          {daySchedules.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 bg-purple-400 rounded-full"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{daySchedules.length}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

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

                {/* Volunteer Assignment Section */}
                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300 flex items-center">
                      <UserPlus className="w-4 h-4 mr-2 text-green-400" />
                      Volunteer Assignment
                    </span>
                  </div>
                  
                  {getVolunteerForSchedule(schedule.id) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">
                            {getVolunteerForSchedule(schedule.id).volunteerName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span>4.8</span>
                            <span>•</span>
                            <span>{getVolunteerForSchedule(schedule.id).duration}h</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => startJitsiMeeting(schedule, getVolunteerForSchedule(schedule.id))}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded transition-colors"
                          title="Start video meeting"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => inviteVolunteerToMeeting(getVolunteerForSchedule(schedule.id), schedule)}
                          className="p-1 text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded transition-colors"
                          title="Invite to meeting"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateAssignmentStatus(getVolunteerForSchedule(schedule.id).id, 'completed')}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-white/10 rounded transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateAssignmentStatus(getVolunteerForSchedule(schedule.id).id, 'cancelled')}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                          title="Cancel assignment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">No volunteer assigned</p>
                      <button
                        onClick={() => {
                          setSelectedVolunteer(schedule);
                          setShowVolunteerModal(true);
                        }}
                        className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>
                  )}
                </div>

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

        {/* Volunteer Assignment Modal */}
        {showVolunteerModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Assign Volunteer</h2>
                    <p className="text-gray-300">
                      Schedule: "{selectedVolunteer.title}" • {selectedVolunteer.date} • {selectedVolunteer.startTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {findMatchingVolunteers(selectedVolunteer).length > 0 ? (
                  findMatchingVolunteers(selectedVolunteer).map((volunteer, index) => (
                    <motion.div
                      key={volunteer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{volunteer.name}</h4>
                            <p className="text-gray-300 text-sm mt-1">{volunteer.bio}</p>
                            <div className="flex items-center space-x-4 mt-3 text-sm">
                              <div className="flex items-center text-gray-300">
                                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                {volunteer.rating}
                              </div>
                              <div className="flex items-center text-gray-300">
                                <Clock3 className="w-4 h-4 mr-1 text-blue-400" />
                                {volunteer.totalHours}h
                              </div>
                              <div className="flex items-center text-gray-300">
                                <CalendarCheck className="w-4 h-4 mr-1 text-green-400" />
                                {volunteer.completedSessions} sessions
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {volunteer.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {volunteer.availability.map((avail, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full"
                                >
                                  {avail}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => assignVolunteerToSchedule(selectedVolunteer, volunteer)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center space-x-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => {/* Message volunteer */}}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Available Volunteers</h3>
                    <p className="text-gray-400">
                      No volunteers are available for this time slot or subject area.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Volunteer Statistics Modal */}
        {showVolunteerStats && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-container p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Volunteer Statistics</h2>
                    <p className="text-gray-300">Overview of volunteer performance and engagement</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVolunteerStats(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="card-container p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Volunteers</p>
                      <p className="text-3xl font-bold text-white mt-1">{volunteerStats.totalVolunteers}</p>
                      <p className="text-green-400 text-sm mt-2 flex items-center">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Active system
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="card-container p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Volunteers</p>
                      <p className="text-3xl font-bold text-white mt-1">{volunteerStats.activeVolunteers}</p>
                      <p className="text-green-400 text-sm mt-2 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available now
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="card-container p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Hours</p>
                      <p className="text-3xl font-bold text-white mt-1">{volunteerStats.totalHours}</p>
                      <p className="text-blue-400 text-sm mt-2 flex items-center">
                        <Clock3 className="w-3 h-3 mr-1" />
                        This month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Clock3 className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="card-container p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg Rating</p>
                      <p className="text-3xl font-bold text-white mt-1">{volunteerStats.averageRating.toFixed(1)}</p>
                      <p className="text-yellow-400 text-sm mt-2 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Excellent
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Volunteer List */}
              <div className="card-container p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Volunteer Performance</h3>
                <div className="space-y-3">
                  {volunteers.map((volunteer, index) => (
                    <motion.div
                      key={volunteer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{volunteer.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <span>{volunteer.completedSessions} sessions</span>
                              <span>•</span>
                              <span>{volunteer.totalHours}h</span>
                              <span>•</span>
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                {volunteer.rating}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            volunteer.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {volunteer.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowVolunteerStats(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Jitsi Meeting Modal */}
        {showMeetingModal && currentMeeting && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full max-w-7xl max-h-[95vh] bg-slate-900 rounded-xl overflow-hidden"
            >
              {/* Meeting Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-white font-semibold">
                      {currentMeeting.schedule.title} - {currentMeeting.volunteer.name}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Meeting Room: {meetingRoom}
                    </p>
                  </div>
                </div>
                
                {/* Meeting Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleAudio}
                    className={`p-2 rounded-lg transition-colors ${
                      isAudioEnabled 
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={toggleVideo}
                    className={`p-2 rounded-lg transition-colors ${
                      isVideoEnabled 
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-lg transition-colors ${
                      isScreenSharing 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://meet.jit.si/${meetingRoom}`);
                      toast.success('Meeting link copied to clipboard!');
                    }}
                    className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                    title="Copy meeting link"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={endMeeting}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="End meeting"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Jitsi Container */}
              <div className="flex-1 relative bg-black">
                <div
                  ref={jitsiContainerRef}
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                />
                
                {/* Meeting Info Overlay */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg">
                  <div className="text-white text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <UserCheck className="w-4 h-4 text-green-400" />
                      <span>{currentMeeting.volunteer.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{currentMeeting.schedule.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>{currentMeeting.schedule.startTime} - {currentMeeting.schedule.endTime}</span>
                    </div>
                  </div>
                </div>

                {/* Participants Count */}
                {meetingParticipants.length > 0 && (
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg">
                    <div className="flex items-center space-x-2 text-white">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{meetingParticipants.length + 1} participants</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Footer */}
              <div className="bg-slate-800 p-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Microphone {isAudioEnabled ? 'On' : 'Off'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Camera {isVideoEnabled ? 'On' : 'Off'}</span>
                    </span>
                    {isScreenSharing && (
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Screen Sharing</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://meet.jit.si/${meetingRoom}`);
                      toast.success('Meeting link copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={endMeeting}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                  >
                    End Meeting
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeScheduleManage;
