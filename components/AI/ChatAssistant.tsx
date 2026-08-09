"use client";

import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Sparkles, Send, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  taskContext?: string;
}

export default function ChatAssistant({ taskContext }: ChatAssistantProps) {
  const { chatAssistant, loading } = useAI();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI task assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    'How do I prioritize my tasks?',
    'What\'s the best way to manage deadlines?',
    'Give me productivity tips',
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const response = await chatAssistant(input, taskContext);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response || 'I\'m having trouble processing your request. Please try again.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300 ${
      isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-linear-to-r from-slate-800 to-slate-900 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 h-[380px] overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2.5 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-xs">{message.content}</p>
                  <p className="text-[8px] opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-2.5 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-slate-700">
              <p className="text-[10px] text-slate-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}