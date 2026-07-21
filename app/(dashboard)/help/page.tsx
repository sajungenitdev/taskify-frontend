"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  Calendar,
  FileText,
  Settings,
  Shield,
  Zap,
  Star,
  Award,
  TrendingUp,
  Users,
  Bell,
  MessageSquare,
  Paperclip,
  Send,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BarChart3,
  LifeBuoy,
  ExternalLink,
  ArrowRight,
  Play,
  ThumbsUp,
  ThumbsDown,
  Rocket,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface GuideItem {
  title: string;
  description: string;
  icon: any;
  link: string;
  category: string;
}

export default function HelpPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  const categories = [
    { id: "all", name: "All", icon: HelpCircle },
    { id: "getting-started", name: "Getting Started", icon: Rocket },
    { id: "tasks", name: "Tasks", icon: CheckSquare },
    { id: "projects", name: "Projects", icon: Briefcase },
    { id: "team", name: "Team & Users", icon: Users },
    { id: "reports", name: "Reports", icon: BarChart3 },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "account", name: "Account & Settings", icon: Settings },
  ];

  const faqs: FAQItem[] = [
    {
      question: "How do I create a new task?",
      answer: "To create a new task, click on the 'Create Task' button in the top right corner of the Tasks page. Fill in the required details like title, description, assignee, deadline, priority, and estimated hours. You can also attach files and set approval requirements.",
      category: "tasks",
    },
    {
      question: "How can I assign a task to someone?",
      answer: "When creating or editing a task, use the 'Assign To' dropdown menu to select a team member. You can only assign tasks to users in your department or project team, depending on your role permissions.",
      category: "tasks",
    },
    {
      question: "What do the different task statuses mean?",
      answer: "• Pending: Task is created but not started\n• In Progress: Task is being worked on\n• Submitted: Task is ready for review\n• Completed: Task is finished and approved\n• Overdue: Deadline has passed\n• Rejected: Task needs rework",
      category: "tasks",
    },
    {
      question: "How do I start a new project?",
      answer: "Go to Projects page and click 'Create Project'. You'll need to provide project name, code, description, department, and team members. Project managers can then create tasks within the project.",
      category: "projects",
    },
    {
      question: "How do I get email notifications for tasks?",
      answer: "Email notifications are automatically enabled. You'll receive emails when tasks are assigned to you, when task status changes, when deadlines approach, and when someone comments on your tasks. Check your profile settings to update your email preferences.",
      category: "notifications",
    },
    {
      question: "Can I upload files to a task?",
      answer: "Yes! When viewing a task, go to the Attachments section. Click 'Upload Files' to add documents, images, or any other relevant files. Supported formats include images, PDFs, Word documents, and Excel files up to 10MB each.",
      category: "tasks",
    },
    {
      question: "How do I generate reports?",
      answer: "Navigate to the Reports page. You can filter by date range, project, department, or team member. Reports include task completion rates, time tracking, project progress, and team performance metrics. Export options include PDF, Excel, and CSV formats.",
      category: "reports",
    },
    {
      question: "How do I request a deadline extension?",
      answer: "Open the task and click 'Request Extension'. Provide the new requested date and reason. Your manager will review and approve or reject the request. You'll receive a notification once a decision is made.",
      category: "tasks",
    },
    {
      question: "What are the different user roles?",
      answer: "• Super Admin: Full system access\n• Admin: Manage users and settings\n• HR Manager: Handle employee records\n• Department Manager: Manage department tasks\n• Project Manager: Oversee projects\n• Line Manager: Supervise team members\n• Employee: Complete assigned tasks",
      category: "team",
    },
    {
      question: "How do I change my password?",
      answer: "Go to Profile Settings → Security. Enter your current password, then your new password twice. Click 'Update Password' to save changes. Make sure to use a strong password with at least 8 characters.",
      category: "account",
    },
  ];

  const guides: GuideItem[] = [
    {
      title: "Quick Start Guide",
      description: "Get up and running in 5 minutes",
      icon: Zap,
      link: "/help/quick-start",
      category: "getting-started",
    },
    {
      title: "Task Management",
      description: "Learn how to create, assign, and track tasks",
      icon: CheckSquare,
      link: "/help/tasks",
      category: "tasks",
    },
    {
      title: "Project Management",
      description: "Manage projects and team collaboration",
      icon: Briefcase,
      link: "/help/projects",
      category: "projects",
    },
    {
      title: "User Roles & Permissions",
      description: "Understand different user roles and access levels",
      icon: Shield,
      link: "/help/roles",
      category: "team",
    },
    {
      title: "Reporting & Analytics",
      description: "Generate and interpret reports",
      icon: BarChart3,
      link: "/help/reports",
      category: "reports",
    },
    {
      title: "Notifications Setup",
      description: "Configure email and in-app notifications",
      icon: Bell,
      link: "/help/notifications",
      category: "notifications",
    },
    {
      title: "Account Settings",
      description: "Manage your profile and security settings",
      icon: Settings,
      link: "/help/account",
      category: "account",
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      icon: Video,
      link: "/help/videos",
      category: "getting-started",
    },
  ];

  const toggleFAQ = (index: number) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFAQs(newExpanded);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredGuides = guides.filter((guide) => {
    return activeCategory === "all" || guide.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="relative container mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <LifeBuoy className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-400">Help Center</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-4">
              How can we help you?
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              Find answers, guides, and resources to help you get the most out of Taskify
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Guides Section */}
        {(activeCategory === "all" || filteredGuides.length > 0) && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Quick Guides</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredGuides.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <Link
                    key={index}
                    href={guide.link}
                    className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-800 p-4 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon size={18} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {guide.description}
                    </p>
                    <div className="flex items-center gap-1 text-indigo-400 text-xs font-medium">
                      Learn more
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQs Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
            <span className="px-2 py-0.5 text-xs bg-slate-800 rounded-full text-slate-400">
              {filteredFAQs.length} articles
            </span>
          </div>
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No matching FAQs found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or category</p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => {
                const isExpanded = expandedFAQs.has(index);
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-800 overflow-hidden transition-all duration-200 hover:border-indigo-500/30"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                            {categories.find(c => c.id === faq.category)?.name}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-white">{faq.question}</h3>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="pt-2 border-t border-slate-700/50">
                          <p className="text-sm text-slate-400 whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="mt-16 p-8 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Still need help?
            </h3>
            <p className="text-slate-400 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/support/tickets"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
              >
                <MessageCircle size={16} />
                Create Support Ticket
              </Link>
              <a
                href="mailto:support@taskify.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
              >
                <Mail size={16} />
                Email Support
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-indigo-500/20">
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>Avg response: &lt; 2hrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp size={14} />
                  <span>98% satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Tutorials Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Video Tutorials</h2>
            </div>
            <Link
              href="/help/videos"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Getting Started with Taskify", duration: "5:23", icon: Play },
              { title: "Task Management Deep Dive", duration: "12:45", icon: Play },
              { title: "Project Setup & Collaboration", duration: "8:15", icon: Play },
            ].map((video, index) => {
              const Icon = video.icon;
              return (
                <button
                  key={index}
                  className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-800 p-4 text-left hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={14} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{video.title}</h3>
                      <p className="text-xs text-slate-500">{video.duration}</p>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-slate-800 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
                    <Play className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}