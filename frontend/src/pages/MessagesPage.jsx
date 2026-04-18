/**
 * pages/MessagesPage.jsx — Messaging interface for students and volunteers
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import Navbar from '../components/Navbar';

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const ConversationItem = ({ conversation, isSelected, onClick, userRole }) => {
  const otherPerson = userRole === 'Student' ? conversation.volunteerId : conversation.studentId;
  const unreadCount = userRole === 'Student' ? conversation.unreadCounts.student : conversation.unreadCounts.volunteer;
  
  return (
    <div
      className={`p-4 border-b border-slate-700 cursor-pointer transition-colors ${
        isSelected ? 'bg-slate-700' : 'hover:bg-slate-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
          {otherPerson?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate">
              {otherPerson?.name || 'Unknown'}
            </h3>
            {conversation.lastMessage?.timestamp && (
              <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                {formatTime(conversation.lastMessage.timestamp)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400 truncate">
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          {conversation.matchContext?.subject && (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                {conversation.matchContext.subject}
              </span>
              {conversation.matchContext.topic && (
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                  {conversation.matchContext.topic}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-indigo-600 text-white' 
          : 'bg-slate-700 text-white'
      }`}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (selectedConversation) {
        fetchMessages(selectedConversation._id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data } = await messageAPI.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data } = await messageAPI.getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await messageAPI.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const { data } = await messageAPI.sendMessage({
        conversationId: selectedConversation._id,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, data.data]);
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, lastMessage: data.data }
          : conv
      ));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send message';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) return;

    try {
      await messageAPI.archiveConversation(selectedConversation._id);
      setConversations(prev => prev.map(conv => 
        conv._id === selectedConversation._id 
          ? { ...conv, status: 'archived' }
          : conv
      ));
      setSelectedConversation(null);
      setMessages([]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to archive conversation';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const otherPerson = selectedConversation 
    ? (userRole === 'Student' ? selectedConversation.volunteerId : selectedConversation.studentId)
    : null;

  return (
    <div className="page">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl h-[calc(100vh-80px)]">
        <div className="bg-slate-800 rounded-xl border border-slate-700 h-full overflow-hidden">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-slate-700 flex flex-col">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Messages</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm"
                  onClick={() => userRole === 'Student' ? navigate('/student/matches') : navigate('/volunteer/profile')}
                >
                  {userRole === 'Student' ? 'Find Volunteers' : 'My Profile'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-3xl mb-3 block">💬</span>
                    <p className="text-slate-400 text-sm">
                      {userRole === 'Student' 
                        ? 'No conversations yet. Start by finding and messaging volunteers!'
                        : 'No conversations yet. Students will message you when they need help.'
                      }
                    </p>
                  </div>
                ) : (
                  conversations
                    .filter(conv => conv.status === 'active')
                    .map(conversation => (
                      <ConversationItem
                        key={conversation._id}
                        conversation={conversation}
                        isSelected={selectedConversation?._id === conversation._id}
                        onClick={() => handleSelectConversation(conversation)}
                        userRole={userRole}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-700 bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {otherPerson?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{otherPerson?.name || 'Unknown'}</h3>
                          <p className="text-xs text-slate-400">{otherPerson?.email}</p>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                        onClick={handleArchiveConversation}
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-2xl mb-3 block">👋</span>
                        <p className="text-slate-400">Start the conversation with a friendly message!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = message.senderId._id === user._id;
                        return (
                          <div key={message._id || index}>
                            {index === 0 || formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt) ? (
                              <div className="text-center my-4">
                                <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                            ) : null}
                            <MessageBubble message={message} isOwn={isOwn} />
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
                    {error && (
                      <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">💬</span>
                    <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
                    <p className="text-slate-400">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
