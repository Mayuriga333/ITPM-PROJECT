import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input, Label } from '../common/Input';
import { Textarea } from '../common/Textarea';
import Avatar from '../common/Avatar';
import { requestAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
];

const RequestForm = ({ volunteer }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentName, setStudentName] = useState(user?.name || '');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Use subjects offered by the selected volunteer; fallback to full list if unavailable
  const SUBJECTS = React.useMemo(() => {
    if (volunteer && Array.isArray(volunteer.subjects) && volunteer.subjects.length > 0) {
      return volunteer.subjects;
    }

    return [
      'Java',
      'Python',
      'C++',
      'C#',
      'DSA',
      'CS',
      'OOP',
      'MERN',
      'Springboot',
      '.NET',
      'Statistics',
      'Networking',
      'Project Management',
    ];
  }, [volunteer]);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-white/10 text-indigo-300'}`}>1</div>
      <div className={`h-[2px] w-12 ${step >= 2 ? 'bg-primary' : 'bg-white/20'}`}></div>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-white/10 text-indigo-300'}`}>2</div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await requestAPI.create({
        studentId: user?.id,
        studentName,
        volunteerId: volunteer._id,
        subject: selectedSubject,
        date,
        timeSlot: selectedTime,
        message,
      });

      setStep(3); // Success step
    } catch (error) {
      // Error toasts are already handled by the API interceptor
      console.error('Error creating support request', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md text-center p-12">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
            <p className="text-indigo-200 mb-8">Your request has been sent to {volunteer?.name || 'the volunteer'}. You'll be notified when they respond.</p>
            <Button onClick={() => window.history.back()} className="w-full">Back to Discovery</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl">
        <Card className="p-8 md:p-12">
          {renderStepIndicator()}

          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-white">Request a Session</h1>
            <p className="text-indigo-200 mt-2">
              {volunteer ? `with ${volunteer.name}` : 'Fill out the details below.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="space-y-6">
                    <div>
                      <Label>Your name</Label>
                      <Input
                        type="text"
                        required
                        className="w-full"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Subject</Label>
                      <select 
                        className="input-field cursor-pointer"
                        value={selectedSubject} 
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select a subject</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                     <div>
                        <Label>What do you need help with?</Label>
                        <Textarea
                          placeholder="Describe the topics or homework questions..."
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                     </div>
                     <Button type="button" onClick={() => setStep(2)} className="w-full mt-4 bg-gradient-to-r from-primary to-primary-hover border-none">
                       Continue to Scheduling
                     </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="space-y-6">
                    <div>
                      <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Pick a Date</Label>
                      <Input
                        type="date"
                        required
                        className="w-full"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Select a Time</Label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {TIME_SLOTS.map(time => (
                          <div
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`px-3 py-2 rounded-xl text-center text-[13px] font-medium transition-colors cursor-pointer border ${
                              selectedTime === time
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white/5 text-indigo-100 border-white/20 hover:border-white/50 hover:bg-white/10'
                            }`}
                          >
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white hover:bg-white/20">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={!selectedTime || submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default RequestForm;
