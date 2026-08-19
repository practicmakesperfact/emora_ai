// ============================================================
// Emora AI — Admin Dashboard Page
// Overview of escalated active incidents, document listings
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Shield, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { crisisApi } from '@/lib/api/crisis.api';
import { documentsApi } from '@/lib/api/documents.api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingPage, ErrorMessage } from '@/components/common/Feedback';
import { ROUTES } from '@/constants';

export default function AdminDashboardPage() {
  const { data: incidents, isLoading: incLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => crisisApi.listIncidents(0, 100),
  });

  const { data: docs, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.listDocuments(0, 100),
  });

  if (incLoading || docsLoading) return <LoadingPage />;

  const activeIncidents = incidents?.filter((i) => !i.resolved) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Greetings */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Overview of knowledge documents, safety warnings, and system details.
        </p>
      </div>

      {/* Grid summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={ROUTES.ADMIN_DOCUMENTS} className="group">
          <Card hover className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{docs?.length || 0}</p>
              <p className="text-xs text-slate-400">Knowledge Documents</p>
            </div>
          </Card>
        </Link>

        <Link href={ROUTES.COUNSELOR_INCIDENTS} className="group">
          <Card hover className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{activeIncidents.length}</p>
              <p className="text-xs text-slate-400">Unresolved Safety Warnings</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* RAG Knowledge base short summary */}
      <section aria-labelledby="documents-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="documents-heading" className="font-semibold text-slate-800">
            Recently Uploaded Documents
          </h2>
          <Link href={ROUTES.ADMIN_DOCUMENTS}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Manage Base
            </Button>
          </Link>
        </div>

        {!docs || docs.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-slate-500 text-sm">No knowledge documents indexed in ChromaDB yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {docs.slice(0, 5).map((doc) => (
              <Card key={doc.id} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{doc.title}</p>
                  <p className="text-slate-400 mt-0.5">
                    File: {doc.file_name} · Source: {doc.source || 'General RAG'}
                  </p>
                </div>
                <span className="text-slate-400">{new Date(doc.upload_date).toLocaleDateString()}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
