// ============================================================
// Emora AI — Chat History Component
// ChatGPT-style conversation history with grouping and actions
// ============================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreVertical, Pencil, Trash2, MessageCircle, AlertCircle } from 'lucide-react';
import { chatApi } from '@/lib/api/chat.api';
import { useLanguage } from '@/providers/LanguageProvider';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn, formatRelativeTime } from '@/utils';
import type { Conversation } from '@/types';

interface ChatHistoryProps {
  collapsed: boolean;
  onClose?: () => void;
}

export function ChatHistory({ collapsed, onClose }: ChatHistoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteConversation(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      chatApi.renameConversation(id, title),
    onSuccess: () => {
      setRenameId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (renameId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renameId]);

  function handleNewChat() {
    router.push('/chat/new');
    onClose?.();
  }

  function handleSelectConversation(id: number) {
    router.push(`/chat/${id}`);
    onClose?.();
  }

  function handleRenameSubmit() {
    if (renameId && renameValue.trim()) {
      renameMutation.mutate({ id: renameId, title: renameValue.trim() });
    } else {
      setRenameId(null);
    }
  }

  // Filter conversations
  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.summary?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Group by date
  const grouped = groupConversationsByDate(filtered);

  // Get active conversation ID from pathname
  const activeId = pathname.match(/^\/chat\/(\d+)/)?.[1];

  if (collapsed) {
    // Collapsed: Show only New Chat icon
    return (
      <div className="px-1 py-2">
        <button
          onClick={handleNewChat}
          className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label={t('New chat', 'አዲስ ውይይት')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* New Chat Button */}
      <div className="px-3 py-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('New chat', 'አዲስ ውይይት')}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search chats...', 'ውይይቶች ፈልግ...')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
      </div>

      {/* History List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-2 sidebar-scroll min-h-0">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              {search
                ? t('No conversations found', 'ምንም ውይይት አልተገኘም')
                : t('No conversations yet', 'ገና ምንም ውይይት የለም')}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([groupLabel, convs]) => (
              <div key={groupLabel} className="mb-4">
                <h3 className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {t(
                    groupLabel,
                    groupLabel === 'Today' ? 'ዛሬ' :
                    groupLabel === 'Yesterday' ? 'ትናንት' :
                    groupLabel === 'Previous 7 days' ? 'ባለፉት 7 ቀናት' :
                    'ቀደም ብሎ'
                  )}
                </h3>
                <div className="space-y-0.5">
                  {convs.map((conv) => (
                    <HistoryItem
                      key={conv.id}
                      conversation={conv}
                      isActive={activeId === String(conv.id)}
                      isRenaming={renameId === conv.id}
                      renameValue={renameValue}
                      onSelect={() => handleSelectConversation(conv.id)}
                      onStartRename={() => {
                        setRenameId(conv.id);
                        setRenameValue(getDisplayTitle(conv));
                      }}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={handleRenameSubmit}
                      onRenameCancel={() => setRenameId(null)}
                      onDelete={() => setDeleteId(conv.id)}
                      renameInputRef={renameInputRef}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('Delete conversation?', 'ውይይት ይሰረዝ?')}
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          {t(
            'This will permanently delete the conversation and all its messages. This action cannot be undone.',
            'ይህ ውይይቱን እና ሁሉንም መልዕክቶቹን በቋሚነት ይሰርዛል። ይህ ተግባር መመለስ አይችልም።'
          )}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setDeleteId(null)}
            disabled={deleteMutation.isPending}
          >
            {t('Cancel', 'ሰርዝ')}
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            {t('Delete', 'ሰርዝ')}
          </Button>
        </div>
        {deleteMutation.error && (
          <p className="mt-3 text-xs text-rose-600">
            {getApiErrorMessage(deleteMutation.error)}
          </p>
        )}
      </Modal>
    </div>
  );
}

// ─── History Item ────────────────────────────────────────────────────────────
interface HistoryItemProps {
  conversation: Conversation;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onStartRename: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
  renameInputRef: React.RefObject<HTMLInputElement>;
}

function HistoryItem({
  conversation,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onStartRename,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
  renameInputRef,
}: HistoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const displayTitle = getDisplayTitle(conversation);
  const isCrisis = conversation.summary?.toLowerCase().includes('crisis') || false;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (isRenaming) {
    return (
      <div className="px-2 py-2">
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameSubmit}
          className="w-full px-2 py-1 text-sm border-b border-indigo-400 bg-transparent focus:outline-none"
          maxLength={100}
        />
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors relative',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          isActive
            ? 'bg-indigo-50 text-indigo-900'
            : 'text-slate-700 hover:bg-slate-50'
        )}
      >
        <MessageCircle
          className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')}
        />
        <span className="flex-1 min-w-0 text-sm truncate">{displayTitle}</span>
        {isCrisis && (
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Crisis conversation" />
        )}
      </button>

      {/* Context Menu Button & Dropdown */}
      <div className={cn(
        'absolute right-2 top-1/2 -translate-y-1/2 z-10',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        'md:opacity-100'
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-white"
          aria-label="More options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown Menu - Higher z-index */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-2 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[100]"
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              onStartRename();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('Rename', 'እንደገና ሰይም')}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('Delete', 'ሰርዝ')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getDisplayTitle(conversation: Conversation): string {
  // Crisis conversations get neutral title
  const isCrisis = conversation.summary?.toLowerCase().includes('crisis') || false;
  if (isCrisis) return 'Support conversation';

  // Default title handling
  if (conversation.title === 'New Conversation' || !conversation.title) {
    return 'Untitled conversation';
  }
  return conversation.title;
}

function groupConversationsByDate(conversations: Conversation[]): Record<string, Conversation[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 days': [],
    'Older': [],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at);
    if (convDate >= today) {
      groups['Today'].push(conv);
    } else if (convDate >= yesterday) {
      groups['Yesterday'].push(conv);
    } else if (convDate >= sevenDaysAgo) {
      groups['Previous 7 days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, convs]) => convs.length > 0)
  );
}
