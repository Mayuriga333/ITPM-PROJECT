import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import socketService from '../services/socket';
import { ArrowLeft, Send } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVolunteer = String(user?.role || '').toLowerCase() === 'volunteer';
  const [conversations, setConversations] = useState([]); // This will hold volunteers
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch left-panel list:
  // - Student view: volunteers
  // - Volunteer view: students (from this volunteer's requests)
  useEffect(() => {
    const fetchLeftPanelItems = async () => {
      try {
        if (isVolunteer) {
          const volunteerId = user?._id || user?.id;
          if (!volunteerId) {
            setConversations([]);
            return;
          }

          const res = await api.get(`/volunteers/${volunteerId}/requests`);
          const requests = res?.data?.data ?? res?.data;
          const requestsArr = Array.isArray(requests) ? requests : [];

          const seen = new Set();
          const students = [];
          for (const req of requestsArr) {
            const student = req?.student;
            const studentId = student?._id;
            if (!studentId) continue;
            if (seen.has(String(studentId))) continue;
            seen.add(String(studentId));
            students.push({
              _id: studentId,
              name: student?.name || req?.studentName || 'Student',
              email: student?.email,
            });
          }

          setConversations(students);
        } else {
          const res = await api.get('/volunteers');
          const volunteersList = res?.data?.data ?? res?.data;
          setConversations(Array.isArray(volunteersList) ? volunteersList : []);
        }
      } catch (err) {
        console.error('Failed to fetch chat list', err);
        setConversations([]);
      }
    };
    if (user) {
      socketService.connect(user._id || user.id);
      fetchLeftPanelItems();
    }
  }, [user, isVolunteer]);

  // Handle incoming messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const activeId = activeConversation?._id || activeConversation?.id;
      if (activeId && message?.conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      } else {
        // Option to update unread count or refresh conversation list
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);

    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [activeConversation]);

  // Fetch Message History By Creating/Finding the Conversation
  const selectConversation = async (volunteer) => {
    // Open the right panel immediately
    setActiveConversation({ otherUser: volunteer });
    setMessages([]);

    try {
      const currentUserId = user?.id || user?._id;
      const otherUserId = volunteer?._id || volunteer?.id;

      const studentId = isVolunteer ? otherUserId : currentUserId;
      const volunteerId = isVolunteer ? currentUserId : otherUserId;

      if (!studentId || !volunteerId) {
        toast.error('Missing user id(s) for chat');
        return;
      }

      const convRes = await api.post('/conversation', { studentId, volunteerId });
      const convPayload = convRes?.data?.data ?? convRes?.data;
      const convId = convPayload?._id || convPayload?.id;

      if (!convId) {
        toast.error(convRes?.data?.message || 'Failed to create or load conversation');
        return;
      }

      setActiveConversation({ ...convPayload, _id: convId, otherUser: volunteer });

      const res = await api.get(`/messages/${convId}`);
      const msgs = res?.data?.data ?? res?.data;
      setMessages(Array.isArray(msgs) ? msgs : []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load conversation', err);
      toast.error(err?.response?.data?.message || 'Failed to load conversation');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getOtherParticipant = (item) => {
    if (item.otherUser) return item.otherUser; // For activeConversation
    return item; // Since the list holds volunteers directly
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const conversationId = activeConversation._id || activeConversation.id;
    if (!conversationId) {
      toast.error('Conversation is still loading');
      return;
    }

    const otherUser = getOtherParticipant(activeConversation);
    const messageData = {
      conversationId,
      receiverId: otherUser?._id,
      text: newMessage.trim(),
    };

    // Optimistic update
    const tempMsg = {
      _id: Date.now().toString(),
      senderId: user._id || user.id,
      text: newMessage.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    scrollToBottom();

    try {
      const res = await api.post('/messages', {
        ...messageData,
        senderId: user._id || user.id
      });
      const newMsg = res.data.data || res.data;
      socketService.sendMessage({ ...newMsg, receiverId: otherUser?._id });
    } catch (err) {
      console.error('Error sending message', err);
      toast.error(err?.response?.data?.message || 'Error sending message');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherParticipant(conv);
    if (!otherUser) return false;
    
    // Safely extract name to avoid crashes if name is somehow missing
    const nameStr = otherUser.name || (otherUser.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : '') || '';
    if (!nameStr) return false;

    return nameStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white dark">
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat List (35%) */}
        <section className={`w-full md:w-[35%] bg-surface-container-low border-r border-outline-variant/10 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-white/5 rounded-xl"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h2 className="font-headline text-xl font-bold tracking-tight">Direct Messages</h2>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input 
                className="w-full bg-surface-container-highest text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/40 transition-all border-none text-white placeholder-gray-400" 
                placeholder="Search..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
            {filteredConversations.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-4">No {isVolunteer ? 'students' : 'volunteers'} found.</p>
            ) : (
              filteredConversations.map(conv => {
                const other = getOtherParticipant(conv) || {};
                const isActive = activeConversation && activeConversation.otherUser && (activeConversation.otherUser._id === conv._id);
                return (
                  <div 
                    key={conv._id || conv.id} 
                    onClick={() => selectConversation(conv)}
                    className={`${isActive ? 'bg-[#1b2534] border-primary/20 shadow-lg shadow-black/20' : 'hover:bg-surface-container-highest hover:-translate-y-0.5 group'} p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all border border-transparent`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-xl text-white font-bold">
                        {other.profilePicture ? (
                          <img alt={other.name || other.firstName} className="w-full h-full object-cover" src={other.profilePicture} />
                        ) : (
                          (other.name || other.firstName || 'U')[0].toUpperCase()
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1b2534]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className={`font-manrope font-bold text-sm truncate ${!isActive && 'group-hover:text-white transition-colors'}`}>
                          {other.name || `${other.firstName} ${other.lastName}`}
                        </h3>
                        {/* Optionally add timestamp if last message available */}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate opacity-70">
                        {(!isVolunteer && other.subjects) ? other.subjects.join(', ') : "Click to chat"}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Right Panel: Active Chat (65%) */}
        {activeConversation ? (
          <section className="flex-1 flex flex-col bg-surface relative w-full h-full">
            {/* Chat Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-surface-container-low/50 backdrop-blur-md z-10 shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 -ml-4 hover:bg-white/5 rounded-xl">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full border-2 border-primary/30 overflow-hidden bg-gray-700 flex items-center justify-center text-lg text-white font-bold">
                      {getOtherParticipant(activeConversation)?.profilePicture ? (
                        <img alt="User" className="w-full h-full object-cover" src={getOtherParticipant(activeConversation).profilePicture} />
                      ) : (
                        (getOtherParticipant(activeConversation)?.name || getOtherParticipant(activeConversation)?.firstName || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-container-low"></div>
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-lg leading-tight text-white">
                      {getOtherParticipant(activeConversation)?.name || `${getOtherParticipant(activeConversation)?.firstName} ${getOtherParticipant(activeConversation)?.lastName}`}
                    </h2>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
               </div>
            </header>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col">
              {messages.map((msg, idx) => {
                const myId = user?._id || user?.id;
                const isMe = (msg.senderId === myId) || (msg.sender === myId);
                
                return isMe ? (
                  <div key={msg._id || idx} className="flex flex-col items-end gap-1.5 max-w-[85%] md:max-w-[80%] self-end">
                    <div className="bg-[#4785FF] p-3 md:p-4 rounded-2xl rounded-br-none shadow-lg shadow-primary-container/10">
                      <p className="text-sm text-white leading-relaxed break-words">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="material-symbols-outlined text-xs text-primary">done_all</span>
                    </div>
                  </div>
                ) : (
                  <div key={msg._id || idx} className="flex gap-3 md:gap-4 max-w-[85%] md:max-w-[80%]">
                     <div className="w-8 h-8 rounded-full self-end mb-1 shrink-0 overflow-hidden bg-gray-700 flex items-center justify-center text-xs text-white">
                        {getOtherParticipant(activeConversation)?.profilePicture ? (
                          <img alt="User" className="w-full h-full object-cover" src={getOtherParticipant(activeConversation).profilePicture} />
                        ) : (
                          (getOtherParticipant(activeConversation)?.name || getOtherParticipant(activeConversation)?.firstName || 'U')[0].toUpperCase()
                        )}
                     </div>
                     <div className="flex flex-col gap-1.5">
                       <div className="bg-[#1b2534] p-3 md:p-4 rounded-2xl rounded-bl-none shadow-sm">
                         <p className="text-sm text-[#a2aac7] leading-relaxed break-words">{msg.text}</p>
                       </div>
                       <span className="text-[10px] text-on-surface-variant px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                     </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-surface-container-low/30 backdrop-blur-md shrink-0">
              <div className="max-w-4xl mx-auto flex items-end gap-3 bg-surface-container-highest/80 p-2 rounded-2xl border border-outline-variant/10">
                <textarea 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 resize-none max-h-32 text-white placeholder:text-on-surface-variant/50 font-inter outline-none" 
                  placeholder="Write a message..." 
                  rows="1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex pb-1 px-1">
                  <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 bg-[#4785FF] text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </section>
        ) : (
          /* Empty State */
          <section className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-surface w-full h-full">
            <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary/40">forum</span>
            </div>
            <h2 className="font-headline text-2xl font-bold mb-2 text-white">Your Conversations</h2>
            <p className="text-on-surface-variant text-sm max-w-xs mx-auto">Select someone from the list to start messaging.</p>
            <button onClick={() => navigate(-1)} className="mt-8 text-primary font-bold text-sm flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
