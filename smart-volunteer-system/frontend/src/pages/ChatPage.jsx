/**
 * pages/ChatPage.jsx — Interactive chatbot UI for requirement collection
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import Navbar from '../components/Navbar';

/* Render markdown-style bold (**text**) inline */
const renderText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
};

const Message = ({ msg }) => (
  <div className={`flex gap-3 mb-4 ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
    {msg.sender === 'bot' && <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>}
    <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'bot' ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white'}`}>
      {msg.text.split('\n').map((line, i) => (
        <p key={i} className="mb-1 last:mb-0">{renderText(line)}</p>
      ))}
      <span className="text-xs opacity-70 mt-2 block">
        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    {msg.sender === 'user' && <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm">👤</div>}
  </div>
);

const StepIndicator = ({ step }) => {
  const steps = ['Start', 'Subject', 'Topic', 'Time', 'Done'];
  return (
    <div className="relative mb-8">
      <div className="flex justify-between items-center mb-4">
        {steps.map((label, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < step ? 'bg-green-500 text-white' : 
              i === step ? 'bg-indigo-600 text-white ring-2 ring-indigo-600/50' : 
              'bg-slate-700 text-slate-400'
            }`}>
              <div>{i < step ? '✓' : i + 1}</div>
            </div>
            <span className="text-xs text-slate-400 mt-2 text-center">{label}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700">
        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }} />
      </div>
    </div>
  );
};

const ChatPage = () => {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [step, setStep]             = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);
  const navigate  = useNavigate();

  // Load existing session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await chatAPI.getHistory();
        if (data.messages?.length) {
          setMessages(data.messages);
          setStep(data.step);
          setIsComplete(data.isComplete);
        } else {
          // Show initial bot greeting
          setMessages([{
            sender: 'bot',
            text: "👋 Hello! I'm your learning assistant. I'm here to help you find the perfect volunteer tutor. Type **\"help\"** or **\"start\"** to begin!",
            timestamp: new Date(),
          }]);
        }
      } catch {
        setMessages([{
          sender: 'bot',
          text: "👋 Hello! Type **\"start\"** or **\"help\"** to begin finding your tutor.",
          timestamp: new Date(),
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    init();
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    // Optimistic UI: add user message immediately
    setMessages((prev) => [...prev, { sender: 'user', text: msg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage(msg);
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, timestamp: new Date() }]);
      setStep(data.step);
      setIsComplete(data.isComplete);
    } catch (err) {
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await chatAPI.resetSession();
      setMessages([{
        sender: 'bot',
        text: "🔄 Session reset. Type **\"start\"** or **\"help\"** to begin again.",
        timestamp: new Date(),
      }]);
      setStep(0);
      setIsComplete(false);
    } catch {
      /* silent */
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick-reply chips for common inputs
  const quickReplies = {
    0: ['Start', 'I need help', 'Find a tutor'],
    1: ['Mathematics', 'Physics', 'Computer Science', 'Chemistry', 'English'],
    2: ['Calculus', 'Algebra', 'Quantum Mechanics', 'Data Structures', 'Organic Chemistry'],
    3: ['Morning', 'Afternoon', 'Evening', 'Weekend'],
  };

  return (
    <div className="page">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
            <StepIndicator step={step} />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="flex flex-col gap-3">
              {isComplete && (
                <button className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium" onClick={() => navigate('/student/matches')}>
                  🧠 Find Volunteers
                </button>
              )}
              <button className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium" onClick={handleReset}>
                🔄 Reset Session
              </button>
              <button className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium" onClick={() => navigate('/student')}>
                ← Dashboard
              </button>
            </div>
          </div>

          {isComplete && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong className="text-green-400 block mb-1">Requirements collected!</strong>
                  <p className="text-slate-300 text-sm">Click "Find Volunteers" to see your matches.</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Chat window */}
        <main className="flex-1 flex flex-col bg-slate-900">
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">AI</div>
              <div>
                <h2 className="text-lg font-semibold text-white">Learning Assistant</h2>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" /> Loading conversation…
              </div>
            ) : (
              <>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && (
                  <div className="flex gap-3 mb-4 justify-start">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>
                    <div className="bg-slate-700 text-white rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {quickReplies[step] && !isComplete && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-2">
                {quickReplies[step].map((reply) => (
                  <button key={reply} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm" onClick={() => sendMessage(reply)}>
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isComplete ? 'Session complete — type "reset" to start over' : 'Type a message…'}
                disabled={loading}
              />
              <button
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '→'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;