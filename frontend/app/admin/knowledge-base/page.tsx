// ============================================================
// Emora AI — Admin Knowledge Base Page
// /admin/knowledge-base
// Semantic RAG search testing + document index overview
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Database,
  FileText,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ragApi } from '@/lib/api/rag.api';
import { documentsApi } from '@/lib/api/documents.api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingPage, Skeleton, EmptyState, ErrorMessage } from '@/components/common/Feedback';
import { ROUTES } from '@/constants';
import { formatDate } from '@/utils';
import type { RAGResult } from '@/types';

export default function AdminKnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // Load document index overview
  const {
    data: documents,
    isLoading: docsLoading,
    error: docsError,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.listDocuments(0, 200),
  });

  // RAG semantic search — only fires on explicit submit
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
    refetch: runSearch,
  } = useQuery({
    queryKey: ['rag-search', activeQuery],
    queryFn: () => ragApi.search(activeQuery, 8),
    enabled: !!activeQuery,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setActiveQuery(q);
  }

  if (docsLoading) return <LoadingPage />;
  if (docsError) {
    return (
      <ErrorMessage
        message="Couldn't load knowledge base data."
        onRetry={() => refetchDocs()}
      />
    );
  }

  const processedDocs = documents?.filter((d) => d.status === 'processed') || [];
  const pendingDocs = documents?.filter((d) => d.status === 'pending') || [];
  const failedDocs = documents?.filter((d) => d.status === 'failed') || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            RAG document index and semantic search testing for ChromaDB
          </p>
        </div>
        <Link href={ROUTES.ADMIN_DOCUMENTS}>
          <Button
            variant="outline"
            leftIcon={<FileText className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Manage Documents
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50">
            <CheckCircle className="w-5 h-5 text-emerald-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{processedDocs.length}</p>
            <p className="text-xs text-slate-400">Indexed in ChromaDB</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50">
            <Clock className="w-5 h-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pendingDocs.length}</p>
            <p className="text-xs text-slate-400">Processing</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-50">
            <AlertCircle className="w-5 h-5 text-rose-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{failedDocs.length}</p>
            <p className="text-xs text-slate-400">Failed to index</p>
          </div>
        </Card>
      </div>

      {/* RAG Search Tester */}
      <Card>
        <CardHeader
          title="Semantic Search Test"
          subtitle="Test what the AI retrieves from ChromaDB for a given query"
          icon={<Search className="w-4 h-4" />}
        />

        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <Input
            placeholder="e.g. anxiety coping techniques, CBT exercises, crisis support…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            aria-label="Knowledge base search query"
            className="flex-1"
          />
          <Button
            type="submit"
            isLoading={searchLoading}
            disabled={!searchQuery.trim()}
          >
            Search
          </Button>
        </form>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-4">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-blue-700">
            This search queries ChromaDB directly using the same semantic retrieval used in live
            AI chat responses. Results depend on uploaded and processed documents.
          </p>
        </div>

        {/* Results */}
        {activeQuery && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">
              Results for: <span className="text-indigo-700">&ldquo;{activeQuery}&rdquo;</span>
            </p>

            {searchLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : searchError ? (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700"
              >
                Search failed. Make sure Ollama is running and the embedding model is pulled.
              </div>
            ) : !searchResults?.results || searchResults.results.length === 0 ? (
              <EmptyState
                title="No matching documents found"
                description="Try a different query or upload more mental health resources."
                icon={<Database className="w-10 h-10" />}
              />
            ) : (
              <ul className="space-y-3" aria-label="Search results">
                {searchResults.results.map((result: RAGResult, index: number) => (
                  <RAGResultCard key={index} result={result} index={index} />
                ))}
              </ul>
            )}
          </div>
        )}

        {!activeQuery && (
          <div className="py-8 text-center text-sm text-slate-400">
            Enter a query above to test semantic retrieval.
          </div>
        )}
      </Card>

      {/* Indexed Documents List */}
      <section aria-labelledby="indexed-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="indexed-heading" className="font-semibold text-slate-800">
            Indexed Documents ({processedDocs.length})
          </h2>
        </div>

        {processedDocs.length === 0 ? (
          <Card className="text-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Database className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 text-sm">No documents indexed in ChromaDB yet.</p>
              <Link href={ROUTES.ADMIN_DOCUMENTS}>
                <Button size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                  Upload Documents
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {processedDocs.map((doc) => (
              <Card key={doc.id} className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-emerald-50 shrink-0">
                  <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {doc.file_name}
                    {doc.source && <> · Source: {doc.source}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{formatDate(doc.upload_date)}</span>
                  <Badge variant="success" size="sm">Indexed</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pending / Failed */}
        {(pendingDocs.length > 0 || failedDocs.length > 0) && (
          <div className="mt-4 space-y-2">
            {pendingDocs.map((doc) => (
              <Card key={doc.id} className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-amber-50 shrink-0">
                  <Clock className="w-4 h-4 text-amber-500" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-700 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400">{doc.file_name}</p>
                </div>
                <Badge variant="warning" size="sm">Processing</Badge>
              </Card>
            ))}
            {failedDocs.map((doc) => (
              <Card key={doc.id} className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-rose-50 shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-700 truncate">{doc.title}</p>
                  <p className="text-xs text-rose-400">Failed to embed — check Ollama status</p>
                </div>
                <Badge variant="danger" size="sm">Failed</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── RAG Result Card ──────────────────────────────────────────────────────────

function RAGResultCard({ result, index }: { result: RAGResult; index: number }) {
  return (
    <li className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          Result #{index + 1}
          {result.source && <span className="ml-2 font-normal text-indigo-500 normal-case">· {result.source}</span>}
        </p>
        {typeof result.score === 'number' && (
          <span className="text-xs text-slate-400 shrink-0">
            Score: {result.score.toFixed(3)}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{result.content}</p>
    </li>
  );
}
