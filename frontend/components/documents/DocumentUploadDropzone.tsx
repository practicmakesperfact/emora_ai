// ============================================================
// Emora AI — DocumentUploadDropzone Component
// Drag-and-drop file upload with format validation
// ============================================================

import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { cn } from '@/utils';
import { ACCEPTED_DOC_TYPES, MAX_FILE_SIZE_MB } from '@/constants';

interface DocumentUploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
  error?: string | null;
}

export function DocumentUploadDropzone({
  onFileSelect,
  error,
}: DocumentUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }

  function processFile(file: File) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  }

  function removeFile() {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={cn(
            'relative w-full rounded-2xl border-2 border-dashed p-8 transition-colors text-center cursor-pointer',
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100',
            error && 'border-rose-400 bg-rose-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={Object.keys(ACCEPTED_DOC_TYPES).join(',')}
            onChange={handleChange}
            className="hidden"
            aria-label="Upload document file"
          />
          <UploadCloud
            className={cn(
              'w-8 h-8 mx-auto mb-3',
              dragActive ? 'text-indigo-600' : 'text-slate-400'
            )}
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500">
            PDF, DOCX, TXT, or MD (max. {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <File className="w-5 h-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-indigo-600">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-rose-600 hover:bg-rose-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="Remove selected file"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-rose-600 mt-2 ml-1">{error}</p>}
    </div>
  );
}
