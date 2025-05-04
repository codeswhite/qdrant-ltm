'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
};

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

  const newSession = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/llm/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: 'You are a helpful assistant' }),
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      
      const { sessionId } = await response.json();
      setSessionId(sessionId);
      setMessages([]);
    } catch (err) {
      console.error('Session error:', err);
    }
  };

  // Initialize session
  useEffect(() => {
    newSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user' as const,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_API_URL}/llm/session/${sessionId}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to get completion');
      
      const { assistantMessage, newFetchedMemories } = await response.json() as { assistantMessage: string; newFetchedMemories: { memory_text: string }[] };
      
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          text: assistantMessage,
          sender: 'assistant' as const,
        }
      ]);
      if (newFetchedMemories.length > 0) {
        // react toast
        toast.success(`Fetched ${newFetchedMemories.length} new memories:\n${newFetchedMemories.map(m => '- ' + m.memory_text).join('\n')}`);
      }
    } catch (err) {
      console.error('Completion error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Header with dark mode toggle */}
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">AI Chat</h1>

        <div className="flex items-center gap-6">
          <button
            onClick={newSession}
            className="p-2 rounded-full bg-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Start New Session
          </button>
          <h3 className="text-sm text-gray-400">{`Session ID: ${sessionId || 'No session!'}`}</h3>
        </div>
        
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Chat messages - centered container */}
      <div className="flex-1 overflow-y-auto ml-64">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-lg px-4 py-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 ${darkMode 
              ? 'bg-gray-700 border-gray-600 focus:ring-blue-600 text-white' 
              : 'focus:ring-blue-500'}`}
            placeholder="Type your message..."
            disabled={!sessionId || loading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-full px-6 py-2 disabled:opacity-50"
            disabled={!input.trim() || !sessionId || loading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
