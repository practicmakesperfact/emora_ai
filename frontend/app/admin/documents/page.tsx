// ============================================================
// Emora AI — Admin Knowledge Documents Page
// Uploading PDFs/text files, generating embeddings, deleting docs
// ============================================================

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, UploadCloud, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents.api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { EmptyState, ErrorMessage, LoadingPage, InlineError } from '@/components/common/Feedback';
import { documentUploadSchema, type DocumentUploadFormData } from '@/schemas';
import { formatDateTime, getErrorMessage } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load indexed documents
  const { data: docs, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.listDocuments(0, 100),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: DocumentUploadFormData) => {
      if (!selectedFile) throw new Error('Please select a file to upload');
      return documentsApi.uploadDocument(
        selectedFile,
        data.title,
        data.author || undefined,
        data.source || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploader(false);
      setSelectedFile(null);
      reset();
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  if (isLoading) return <LoadingPage />;
  if (error) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload wellness guides, mental health references, or CBT manuals for RAG.
          </p>
        </div>
        <Button
          onClick={() => setShowUploader(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Document List */}
      <section aria-labelledby="documents-list-heading">
        <h2 id="documents-list-heading" className="sr-only">Uploaded Files</h2>

        {!docs || docs.length === 0 ? (
          <EmptyState
            title="No knowledge documents"
            description="Upload mental health resource documents to build the RAG knowledge base."
            icon={<FileText className="w-12 h-12" />}
            action={
              <Button onClick={() => setShowUploader(true)} leftIcon={<UploadCloud className="w-4 h-4" />}>
                Upload Document
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <Card key={doc.id} className="flex justify-between items-center group relative">
                <div className="min-w-0 pr-6">
                  <p className="font-semibold text-slate-800 text-sm truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    File: {doc.file_name}
                  </p>
                  {doc.source && (
                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                      Source: {doc.source}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-300 mt-1">
                    Indexed on {formatDateTime(doc.upload_date)}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(doc.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  aria-label={`Delete document: ${doc.title}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploader}
        onClose={() => { setShowUploader(false); setSelectedFile(null); reset(); setApiError(null); }}
        title="Upload Document"
        size="md"
      >
        <form onSubmit={handleSubmit((d) => uploadMutation.mutate(d))} noValidate>
          <div className="space-y-4">
            {/* File Drag Drop selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Select Document File</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden />
                <p className="text-xs text-slate-600 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select or drag PDF, DOCX, TXT, or MD file'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 50MB</p>
              </div>
            </div>

            <Input
              label="Document Title"
              placeholder="e.g. CBT Anxiety Coping Guide"
              required
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Author (optional)"
                placeholder="e.g. Dr. Jane Doe"
                error={errors.author?.message}
                {...register('author')}
              />
              <Input
                label="Source (optional)"
                placeholder="e.g. WHO Wellness Library"
                error={errors.source?.message}
                {...register('source')}
              />
            </div>

            {apiError && <InlineError message={apiError} />}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowUploader(false); setSelectedFile(null); reset(); }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={uploadMutation.isPending || isSubmitting}>
                Upload & Index
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Document?"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          This document and all its indexed vector chunks in ChromaDB will be permanently deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
