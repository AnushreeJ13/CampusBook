import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Hash, Users, Search, Smile, Paperclip, Image, ChevronDown } from 'lucide-react';
import './CampusChat.css';

const CHANNELS = [
  { id: 'general', name: 'General', icon: '💬', desc: 'Campus-wide announcements', unread: 3 },
  { id: 'events', name: 'Events & Fests', icon: '🎉', desc: 'Event discussions', unread: 7 },
  { id: 'academics', name: 'Academics', icon: '📚', desc: 'Study groups & help', unread: 1 },
  { id: 'societies', name: 'Societies', icon: '🎭', desc: 'Club activities', unread: 0 },
  { id: 'sports', name: 'Sports', icon: '⚽', desc: 'Sports & fitness', unread: 2 },
  { id: 'lost-found', name: 'Lost & Found', icon: '🔍', desc: 'Lost items', unread: 0 },
  { id: 'canteen', name: 'Canteen Talk', icon: '🍕', desc: 'Food reviews & orders', unread: 5 },
  { id: 'placements', name: 'Placements', icon: '💼', desc: 'Placement updates', unread: 0 },
];

const AVATARS = ['👩‍💻', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍🏫', '👩‍🏫', '🧑‍🎓', '👨‍💻'];
const NAMES = ['Priya S.', 'Rahul M.', 'Ananya K.', 'Vikram T.', 'Prof. Sharma', 'Neha G.', 'Arjun P.', 'Sanya R.'];

function generateMessages(channel) {
  const msgSets = {
    general: [
      { text: 'Library will be open till 11 PM during exam week 📖', sender: 4, time: '9:15 AM', reactions: ['👍 12', '🎉 4'] },
      { text: 'Wi-Fi password changed for CSE Block — check notice board', sender: 0, time: '9:32 AM', reactions: ['😤 8'] },
      { text: 'New water cooler installed near Mech Workshop 🚰', sender: 6, time: '10:01 AM', reactions: ['👍 3'] },
      { text: 'Has anyone seen the exam schedule for 6th sem?', sender: 1, time: '10:22 AM' },
      { text: 'It\'s on the university portal under "Exam Cell"', sender: 5, time: '10:25 AM', reactions: ['👍 2'] },
      { text: 'Thank you!! 🙏', sender: 1, time: '10:26 AM' },
      { text: 'Reminder: Cultural fest registrations close tomorrow!', sender: 2, time: '11:00 AM', reactions: ['🎉 15', '🔥 7'] },
    ],
    events: [
      { text: 'TechFest 2026 dates confirmed — April 20-22! 🚀', sender: 2, time: '8:00 AM', reactions: ['🔥 23', '🎉 18'] },
      { text: 'Who\'s participating in the hackathon?', sender: 3, time: '8:15 AM' },
      { text: 'Our team is in! CSE 4th year squad 💪', sender: 0, time: '8:20 AM', reactions: ['💪 5'] },
      { text: 'Auditorium booked for dance practice 6-9 PM today', sender: 7, time: '9:00 AM' },
      { text: 'Photography club exhibition is AMAZING, go check it out!', sender: 6, time: '10:30 AM', reactions: ['📸 12'] },
      { text: 'Anyone has contacts for sound system rental?', sender: 1, time: '11:15 AM' },
    ],
    academics: [
      { text: 'DAA assignment deadline extended to Friday 🎉', sender: 4, time: '9:00 AM', reactions: ['🎉 30', '😭 2'] },
      { text: 'Anyone has notes for Operating Systems Unit 3?', sender: 1, time: '9:30 AM' },
      { text: 'Check the shared drive, I uploaded them yesterday', sender: 5, time: '9:35 AM', reactions: ['❤️ 5'] },
      { text: 'Prof. Gupta\'s ML class shifted to Room 302', sender: 3, time: '10:00 AM' },
      { text: 'Study group for DBMS? Library 5PM today', sender: 7, time: '10:30 AM', reactions: ['👍 8'] },
    ],
    societies: [
      { text: 'Coding Club meetup this Saturday 2PM — CSE Lab 1 🖥️', sender: 0, time: '8:30 AM', reactions: ['👍 14'] },
      { text: 'Debate Society won inter-college! 🏆', sender: 2, time: '9:00 AM', reactions: ['🎉 25', '🏆 12'] },
      { text: 'New members welcome in Photography Club!', sender: 6, time: '9:45 AM' },
      { text: 'Robotics team needs 2 more members for Robocon', sender: 3, time: '10:15 AM', reactions: ['🤖 7'] },
    ],
    sports: [
      { text: 'Cricket match CSE vs ECE tomorrow at 4 PM! 🏏', sender: 1, time: '8:00 AM', reactions: ['🏏 18'] },
      { text: 'Gym timings changed: 6 AM - 9 PM effective today', sender: 4, time: '8:30 AM' },
      { text: 'Basketball court is free after 5 PM, anyone up for a game?', sender: 3, time: '11:00 AM', reactions: ['🏀 6'] },
      { text: 'Marathon registration link in bio!', sender: 7, time: '11:30 AM' },
    ],
    'lost-found': [
      { text: 'Lost my blue water bottle in CSE building yesterday 😢', sender: 1, time: '9:00 AM' },
      { text: 'Found a calculator near Seminar Hall, DM me', sender: 6, time: '9:30 AM', reactions: ['👍 2'] },
      { text: 'Missing: Black jacket from library 2nd floor', sender: 7, time: '10:00 AM' },
    ],
    canteen: [
      { text: 'New pasta counter in Central Cafeteria is 🔥🔥🔥', sender: 0, time: '12:00 PM', reactions: ['🍝 15', '😋 8'] },
      { text: 'Maggi counter closed today 😭', sender: 1, time: '12:15 PM', reactions: ['😭 20'] },
      { text: 'Try the new mango shake, it\'s amazing!', sender: 5, time: '12:30 PM', reactions: ['🥭 9'] },
      { text: 'Canteen B has better samosas, change my mind', sender: 3, time: '1:00 PM', reactions: ['😤 4', '👍 7'] },
      { text: 'Tea at Chai Point > Canteen chai. Facts. 🍵', sender: 7, time: '1:30 PM', reactions: ['🍵 12', '💯 6'] },
    ],
    placements: [
      { text: 'Microsoft visiting next week for SDE roles! 💻', sender: 4, time: '8:00 AM', reactions: ['🔥 32', '🙏 18'] },
      { text: 'Resume review session tomorrow 3 PM at Placement Cell', sender: 5, time: '8:30 AM', reactions: ['👍 14'] },
      { text: 'Amazon SDE-1 results out — check portal', sender: 2, time: '9:00 AM', reactions: ['🤞 22'] },
    ],
  };
  return (msgSets[channel] || msgSets.general).map((m, i) => ({
    ...m,
    id: `${channel}-${i}`,
    senderName: NAMES[m.sender],
    senderAvatar: AVATARS[m.sender],
  }));
}

export default function CampusChat() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({});
  const [searchText, setSearchText] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!messages[activeChannel]) {
      setMessages(prev => ({ ...prev, [activeChannel]: generateMessages(activeChannel) }));
    }
  }, [activeChannel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const channelMsgs = messages[activeChannel] || [];
  const activeChannelData = CHANNELS.find(c => c.id === activeChannel);

  const filteredChannels = CHANNELS.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `${activeChannel}-${Date.now()}`,
      text: inputText,
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar || '🧑',
      sender: -1,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));
    setInputText('');
  };

  return (
    <div className="cc-container">
      {/* Channel Sidebar */}
      <div className={`cc-channels ${showChannels ? '' : 'cc-channels-hidden'}`}>
        <div className="cc-channels-header">
          <div className="cc-channels-title">
            <MessageCircle size={18} />
            <span>Campus Chat</span>
          </div>
          <span className="cc-online-badge">
            <span className="live-dot" />
            {Math.floor(Math.random() * 200 + 800)} online
          </span>
        </div>

        <div className="cc-search">
          <Search size={14} />
          <input
            placeholder="Search channels..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <div className="cc-channel-list">
          {filteredChannels.map(ch => (
            <button
              key={ch.id}
              className={`cc-channel-btn ${activeChannel === ch.id ? 'active' : ''}`}
              onClick={() => { setActiveChannel(ch.id); setShowChannels(false); }}
            >
              <span className="cc-channel-icon">{ch.icon}</span>
              <div className="cc-channel-info">
                <span className="cc-channel-name">{ch.name}</span>
                <span className="cc-channel-desc">{ch.desc}</span>
              </div>
              {ch.unread > 0 && <span className="cc-channel-unread">{ch.unread}</span>}
            </button>
          ))}
        </div>

        <div className="cc-channels-footer">
          <div className="cc-user-status">
            <span className="cc-user-avatar">{user?.avatar || '🧑'}</span>
            <div>
              <span className="cc-user-name">{user?.name || 'User'}</span>
              <span className="cc-user-role">{user?.role || 'student'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="cc-chat">
        <div className="cc-chat-header">
          <button className="cc-toggle-channels" onClick={() => setShowChannels(!showChannels)}>☰</button>
          <span className="cc-chat-channel-icon">{activeChannelData?.icon}</span>
          <div>
            <h2>{activeChannelData?.name}</h2>
            <span className="cc-chat-desc">{activeChannelData?.desc}</span>
          </div>
          <div className="cc-chat-members">
            <Users size={14} />
            <span>{Math.floor(Math.random() * 100 + 50)} members</span>
          </div>
        </div>

        <div className="cc-messages">
          <div className="cc-messages-start">
            <span className="cc-start-icon">{activeChannelData?.icon}</span>
            <h3>Welcome to #{activeChannelData?.name}</h3>
            <p>{activeChannelData?.desc}</p>
          </div>

          {channelMsgs.map((msg, i) => {
            const isMe = msg.sender === -1;
            const showAvatar = i === 0 || channelMsgs[i - 1]?.senderName !== msg.senderName;
            return (
              <div key={msg.id} className={`cc-message ${isMe ? 'cc-message-me' : ''} ${showAvatar ? '' : 'cc-message-grouped'}`}>
                {showAvatar && !isMe && (
                  <div className="cc-msg-avatar">{msg.senderAvatar}</div>
                )}
                <div className="cc-msg-content">
                  {showAvatar && (
                    <div className="cc-msg-header">
                      <span className="cc-msg-name">{isMe ? 'You' : msg.senderName}</span>
                      <span className="cc-msg-time">{msg.time}</span>
                    </div>
                  )}
                  <div className={`cc-msg-bubble ${isMe ? 'cc-bubble-me' : ''}`}>
                    {msg.text}
                  </div>
                  {msg.reactions && (
                    <div className="cc-msg-reactions">
                      {msg.reactions.map((r, j) => (
                        <span key={j} className="cc-reaction">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="cc-input-area">
          <div className="cc-input-bar">
            <button className="cc-input-btn" title="Attach"><Paperclip size={18} /></button>
            <button className="cc-input-btn" title="Image"><Image size={18} /></button>
            <input
              className="cc-input"
              placeholder={`Message #${activeChannelData?.name || 'general'}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="cc-input-btn" title="Emoji"><Smile size={18} /></button>
            <button className="cc-send-btn" onClick={handleSend} disabled={!inputText.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
