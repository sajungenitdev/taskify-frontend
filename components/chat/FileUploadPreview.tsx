// components/chat/FileUploadPreview.tsx
"use client";

import React from "react";
import { X, File, Image, FileText, FileSpreadsheet, FileCode, Music, Video, Archive, FileJson } from "lucide-react";

interface FileUploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

const getFileIcon = (file: File) => {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
  if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
  if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (type.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (type.includes("excel") || name.endsWith(".xls") || name.endsWith(".xlsx")) {
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  }
  if (type.includes("powerpoint") || name.endsWith(".ppt") || name.endsWith(".pptx")) {
    return <FileText className="w-4 h-4 text-orange-500" />;
  }
  if (name.endsWith(".json") || name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".html")) {
    return <FileCode className="w-4 h-4 text-purple-500" />;
  }
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) {
    return <Archive className="w-4 h-4 text-yellow-500" />;
  }
  if (name.endsWith(".csv")) {
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  }
  if (name.endsWith(".txt")) {
    return <FileText className="w-4 h-4 text-gray-500" />;
  }
  return <File className="w-4 h-4 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function FileUploadPreview({ files, onRemove }: FileUploadPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 group hover:bg-slate-50 transition"
        >
          <span className="text-slate-600">{getFileIcon(file)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
              {file.name}
            </p>
            <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
          </div>
          <button
            onClick={() => onRemove(idx)}
            className="p-0.5 hover:bg-slate-200 rounded transition text-slate-400 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}