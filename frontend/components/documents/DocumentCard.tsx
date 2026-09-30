// ============================================================
// Emora AI — DocumentCard Component
// Admin document list item with processing status
// ============================================================

import React from 'react';
import { BookOpen, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatDate } from '@/utils';
import type { KnowledgeDocument } from '@/types';

interface DocumentCardProps {
  document: KnowledgeDocument;
  onDelete: (id: number) => void;
}

export function DocumentCard({ document: doc, onDelete }: DocumentCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div
        className={`p-2 rounded-xl shrink-0 ${
          doc.status === 'processed'
            ? 'bg-emerald-50'
            : doc.status === 'pending'
            ? 'bg-amber-50'
            : 'bg-rose-50'
        }`}
      >
        {doc.status === 'processed' ? (
          <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden />
        ) : doc.status === 'pending' ? (
          <Clock className="w-4 h-4 text-amber-500" aria-hidden />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-800 truncate">{doc.title}</p>
        <p className="text-xs text-slate-400 truncate">
          {doc.file_name}
          {doc.source && <> · Source: {doc.source}</>}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-400 max-sm:hidden">
          {formatDate(doc.upload_date)}
        </span>
        <Badge
          variant={
            doc.status === 'processed'
              ? 'success'
              : doc.status === 'pending'
              ? 'warning'
              : 'danger'
          }
          size="sm"
        >
          {doc.status === 'processed'
            ? 'Indexed'
            : doc.status === 'pending'
            ? 'Processing'
            : 'Failed'}
        </Badge>
        <button
          onClick={() => onDelete(doc.id)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          aria-label={`Delete document: ${doc.title}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </Card>
  );
}
