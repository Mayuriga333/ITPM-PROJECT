// Local storage keys
const STORAGE_KEYS = {
  CURRENT_STUDENT: 'currentStudent',
  CURRENT_VOLUNTEER: 'currentVolunteer',
};

export const storage = {
  // Student
  setCurrentStudent: (student) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));
  },
  getCurrentStudent: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    return data ? JSON.parse(data) : null;
  },
  removeCurrentStudent: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  },

  // Volunteer
  setCurrentVolunteer: (volunteer) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_VOLUNTEER, JSON.stringify(volunteer));
  },
  getCurrentVolunteer: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_VOLUNTEER);
    return data ? JSON.parse(data) : null;
  },
  removeCurrentVolunteer: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_VOLUNTEER);
  },

  // Clear all
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_VOLUNTEER);
  },
};