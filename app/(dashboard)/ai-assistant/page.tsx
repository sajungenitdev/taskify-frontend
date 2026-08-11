"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Brain,
  Globe,
  Link2,
  ExternalLink,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Zap,
  Users,
  Briefcase,
  Calendar,
  CheckSquare,
  Menu,
  History,
  Settings,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const quickActions = [
  {
    id: "tenders",
    label: "Tenders",
    icon: Search,
    prompt: "List today's software tenders in Bangladesh",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "tasks",
    label: "Task Help",
    icon: CheckSquare,
    prompt: "Give me tips for better task management",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Zap,
    prompt: "How can I be more productive?",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "deadlines",
    label: "Deadlines",
    icon: Calendar,
    prompt: "How to manage multiple deadlines?",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "team",
    label: "Team Work",
    icon: Users,
    prompt: "Best practices for team collaboration",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "weather",
    label: "Weather",
    icon: Globe,
    prompt: "Today's weather in Dhaka",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
];

export default function AIAssistantPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCreatingChat = useRef(false);

  const fetchChats = useCallback(async () => {
    try {
      const response = await api.get("/ai/chats");
      if (response.data.success) {
        setChats(response.data.data);
        if (response.data.data.length > 0 && !activeChatId) {
          setActiveChatId(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchChats();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find((c) => c._id === activeChatId);
      if (chat) {
        setMessages(chat.messages || []);
      }
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    if (isCreatingChat.current) return;
    isCreatingChat.current = true;

    try {
      const response = await api.post("/ai/chats", {
        title: "New Conversation",
      });
      if (response.data.success) {
        const newChat = response.data.data;
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat._id);
        setMessages([]);
        toast.success("New conversation started");
      }
    } catch (error) {
      toast.error("Failed to create new chat");
    } finally {
      isCreatingChat.current = false;
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    if (!activeChatId) {
      await createNewChat();
      setTimeout(() => {
        if (activeChatId) {
          sendMessage(message);
        }
      }, 300);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/chats/${activeChatId}/message-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let sources: Source[] = [];

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  fullText += data.text;
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last.role === "assistant") {
                      return [
                        ...prev.slice(0, -1),
                        { ...last, content: fullText },
                      ];
                    }
                    return prev;
                  });
                }
                if (data.sources) sources = data.sources;
                if (data.done) break;
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: fullText || "No response received",
              sources,
            },
          ];
        }
        return prev;
      });

      await fetchChats();
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content:
                "⚠️ " +
                (error.message || "I encountered an error. Please try again."),
            },
          ];
        }
        return prev;
      });
      toast.error(error.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/ai/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c._id !== chatId);
        setActiveChatId(remaining.length > 0 ? remaining[0]._id : null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const pinChat = async (chatId: string) => {
    try {
      const response = await api.put(`/ai/chats/${chatId}/pin`);
      if (response.data.success) {
        await fetchChats();
        toast.success(response.data.isPinned ? "Pinned" : "Unpinned");
      }
    } catch (error) {
      toast.error("Failed to pin chat");
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      await api.put(`/ai/chats/${chatId}/rename`, { title: newTitle });
      await fetchChats();
      setEditingChatId(null);
      toast.success("Renamed");
    } catch (error) {
      toast.error("Failed to rename");
    }
  };

  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Copied!");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage(input);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const pinnedChats = chats.filter((c) => c.isPinned);
  const unpinnedChats = chats.filter((c) => !c.isPinned);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-linear-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Conversations
                    </h2>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {chats.length}
                  </span>
                </div>
                <button
                  onClick={createNewChat}
                  disabled={isCreatingChat.current}
                  className="w-full py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Plus size={16} />
                  New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                {chats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">
                      No conversations yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start a new chat above
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Pinned Chats */}
                    {pinnedChats.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 px-2 mb-2">
                          <Pin size={12} className="text-gray-400" />
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                            Pinned
                          </span>
                        </div>
                        {pinnedChats.map((chat) => (
                          <ChatItem
                            key={chat._id}
                            chat={chat}
                            activeChatId={activeChatId}
                            editingChatId={editingChatId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            setEditingChatId={setEditingChatId}
                            setActiveChatId={setActiveChatId}
                            renameChat={renameChat}
                            pinChat={pinChat}
                            deleteChat={deleteChat}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    )}

                    {/* Recent Chats */}
                    {unpinnedChats.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 px-2 mb-2">
                          <History size={12} className="text-gray-400" />
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                            Recent
                          </span>
                        </div>
                        {unpinnedChats.map((chat) => (
                          <ChatItem
                            key={chat._id}
                            chat={chat}
                            activeChatId={activeChatId}
                            editingChatId={editingChatId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            setEditingChatId={setEditingChatId}
                            setActiveChatId={setActiveChatId}
                            renameChat={renameChat}
                            pinChat={pinChat}
                            deleteChat={deleteChat}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">
                      {user?.fullName || "User"}
                    </span>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-linear-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-800">
                    {chats.find((c) => c._id === activeChatId)?.title ||
                      "AI Assistant"}
                  </h1>
                  <p className="text-[9px] text-gray-400">
                    Powered by Google Gemini • AI Assistant
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                {isFullscreen ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
              <button
                onClick={() => setShowSources(!showSources)}
                className={`p-2 rounded-lg transition ${
                  showSources
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Link2 size={16} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.prompt)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border shadow-sm hover:shadow-md hover:scale-105 ${action.color}`}
                    >
                      <Icon size={12} className="opacity-70" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-linear-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Sparkles className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  How can I help you?
                </h2>
                <p className="text-gray-500 max-w-md mb-8">
                  Ask me about tasks, projects, tenders, weather, or anything
                  else!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.prompt)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                      } rounded-2xl p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === "assistant" ? (
                          <div className="w-5 h-5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Bot size={10} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={10} className="text-gray-600" />
                          </div>
                        )}
                        <span className="text-xs font-medium">
                          {message.role === "assistant"
                            ? "AI Assistant"
                            : user?.fullName || "You"}
                        </span>
                        <span className="text-[8px] opacity-50">
                          {message.timestamp
                            ? formatDate(message.timestamp.toString())
                            : ""}
                        </span>
                        {message.role === "assistant" && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                            Gemini
                          </span>
                        )}
                      </div>

                      <div
                        className={`prose prose-sm max-w-none ${
                          message.role === "user"
                            ? "prose-invert"
                            : "prose-gray"
                        }`}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content || ""}
                        </ReactMarkdown>
                      </div>

                      {message.role === "assistant" && message.content && (
                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200">
                          <button
                            onClick={() =>
                              copyMessage(message.content, `msg-${index}`)
                            }
                            className={`p-1 rounded transition ${
                              copiedMessageId === `msg-${index}`
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {copiedMessageId === `msg-${index}` ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded transition">
                            <ThumbsUp size={12} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded transition">
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Link2 size={10} className="text-indigo-500" />
                            <span className="text-[9px] font-medium text-gray-500">
                              Sources
                            </span>
                            <button
                              onClick={() => setShowSources(!showSources)}
                              className="text-[8px] text-gray-400 hover:text-gray-600 transition"
                            >
                              {showSources ? "Hide" : "Show"}
                            </button>
                          </div>
                          {showSources && (
                            <div className="space-y-1">
                              {message.sources.slice(0, 3).map((source, i) => (
                                <a
                                  key={i}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition group border border-gray-100"
                                >
                                  <div className="flex items-start gap-2">
                                    <ExternalLink
                                      size={10}
                                      className="text-gray-400 mt-0.5 group-hover:text-indigo-500 transition"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-gray-700 truncate font-medium">
                                        {source.title}
                                      </p>
                                      <p className="text-[8px] text-gray-400 line-clamp-1">
                                        {source.snippet}
                                      </p>
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white shadow-sm">
            <div className="flex gap-2 w-[90%]">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm"
                disabled={loading}
              />
              <button
                onClick={() => {
                  if (input.trim()) sendMessage(input);
                }}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-500/20"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[8px] text-gray-400">
                Google Gemini • Real-time Search • {messages.length} messages
              </p>
              <p className="text-[8px] text-gray-400">Press Enter to send</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        .prose {
          max-width: none;
        }
        .prose p {
          margin: 0.5em 0;
        }
        .prose ul,
        .prose ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .prose code {
          background: rgba(99, 102, 241, 0.1);
          padding: 0.1em 0.3em;
          border-radius: 4px;
          font-size: 0.85em;
          color: #6366f1;
        }
        .prose.prose-invert code {
          background: rgba(255, 255, 255, 0.1);
          color: #a5b4fc;
        }
        .prose pre {
          background: rgba(30, 41, 59, 0.05);
          padding: 0.75em;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.8em;
        }
        .prose.prose-invert pre {
          background: rgba(30, 41, 59, 0.2);
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// Chat Item Component
interface ChatItemProps {
  chat: Chat;
  activeChatId: string | null;
  editingChatId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  setEditingChatId: (id: string | null) => void;
  setActiveChatId: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  pinChat: (id: string) => void;
  deleteChat: (id: string) => void;
  formatDate: (date: string) => string;
}

function ChatItem({
  chat,
  activeChatId,
  editingChatId,
  editTitle,
  setEditTitle,
  setEditingChatId,
  setActiveChatId,
  renameChat,
  pinChat,
  deleteChat,
  formatDate,
}: ChatItemProps) {
  return (
    <div
      className={`group p-3 rounded-lg cursor-pointer transition-all ${
        activeChatId === chat._id
          ? "bg-indigo-50 border border-indigo-200 shadow-sm"
          : "hover:bg-gray-50 border border-transparent"
      }`}
      onClick={() => setActiveChatId(chat._id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {editingChatId === chat._id ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => renameChat(chat._id, editTitle)}
              onKeyPress={(e) => {
                if (e.key === "Enter") renameChat(chat._id, editTitle);
                if (e.key === "Escape") setEditingChatId(null);
              }}
              className="w-full bg-white border border-indigo-400 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium text-gray-800 truncate">
              {chat.title}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">
            {chat.messages.length} messages • {formatDate(chat.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingChatId(chat._id);
              setEditTitle(chat.title);
            }}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded transition"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              pinChat(chat._id);
            }}
            className={`p-1 rounded transition ${
              chat.isPinned
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-400 hover:text-indigo-600"
            }`}
          >
            {chat.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteChat(chat._id);
            }}
            className="p-1 text-gray-400 hover:text-rose-600 rounded transition"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
