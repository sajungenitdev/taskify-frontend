"use client";

import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Sparkles, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskAssistantProps {
  title: string;
  description: string;
  onSuggestion: (field: string, value: any) => void;
}

export default function TaskAssistant({ title, description, onSuggestion }: TaskAssistantProps) {
  const { loading, generateDescription, suggestPriority, estimateDuration, generateSubtasks } = useAI();
  const [isOpen, setIsOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<any>({});
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    if (!title) {
      toast.error('Please enter a title first');
      return;
    }
    setGenerating('description');
    const result = await generateDescription(title);
    if (result) {
      setSuggestions(prev => ({ ...prev, description: result }));
      onSuggestion('description', result);
    }
    setGenerating(null);
  };

  const handleSuggestPriority = async () => {
    if (!title || !description) {
      toast.error('Please enter title and description first');
      return;
    }
    setGenerating('priority');
    const result = await suggestPriority(title, description);
    if (result) {
      setSuggestions(prev => ({ ...prev, priority: result }));
      onSuggestion('priority', result.priority);
    }
    setGenerating(null);
  };

  const handleEstimateDuration = async () => {
    if (!title || !description) {
      toast.error('Please enter title and description first');
      return;
    }
    setGenerating('duration');
    const result = await estimateDuration(title, description);
    if (result) {
      setSuggestions(prev => ({ ...prev, duration: result }));
      onSuggestion('estimatedHours', result.hours);
    }
    setGenerating(null);
  };

  const handleGenerateSubtasks = async () => {
    if (!title || !description) {
      toast.error('Please enter title and description first');
      return;
    }
    setGenerating('subtasks');
    const result = await generateSubtasks(title, description);
    if (result && result.length > 0) {
      setSuggestions(prev => ({ ...prev, subtasks: result }));
    }
    setGenerating(null);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-500/5 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">AI Task Assistant</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">Beta</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGenerateDescription}
              disabled={loading || !title}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-1"
            >
              {generating === 'description' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Generate Description
            </button>
            <button
              onClick={handleSuggestPriority}
              disabled={loading || !title || !description}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-1"
            >
              {generating === 'priority' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Suggest Priority
            </button>
            <button
              onClick={handleEstimateDuration}
              disabled={loading || !title || !description}
              className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-1"
            >
              {generating === 'duration' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Estimate Duration
            </button>
            <button
              onClick={handleGenerateSubtasks}
              disabled={loading || !title || !description}
              className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-1"
            >
              {generating === 'subtasks' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Generate Subtasks
            </button>
          </div>

          {suggestions.priority && (
            <div className="bg-slate-800/50 rounded-lg p-2">
              <p className="text-xs text-slate-400">Suggested Priority:</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  suggestions.priority.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                  suggestions.priority.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                  suggestions.priority.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {suggestions.priority.priority.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">{suggestions.priority.reason}</span>
              </div>
            </div>
          )}

          {suggestions.duration && (
            <div className="bg-slate-800/50 rounded-lg p-2">
              <p className="text-xs text-slate-400">Estimated Duration:</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-white">{suggestions.duration.hours} hours</span>
                <span className="text-xs text-slate-500">{suggestions.duration.explanation}</span>
              </div>
            </div>
          )}

          {suggestions.subtasks && suggestions.subtasks.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-2">
              <p className="text-xs text-slate-400 mb-1">Suggested Subtasks:</p>
              <ul className="space-y-1">
                {suggestions.subtasks.map((subtask: any, index: number) => (
                  <li key={index} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{subtask.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}