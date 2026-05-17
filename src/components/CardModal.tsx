'use client';

import { useState, useEffect, useRef } from 'react';
import type { Card, Comment } from '@/types';

interface CardModalProps {
  card: Card;
  onClose: () => void;
  onUpdate: (updated: Card) => void;
  onDelete: (id: number) => void;
}

export default function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/comments?card_id=${card.id}`)
      .then(r => r.json())
      .then(setComments);
  }, [card.id]);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  const saveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed) { setTitle(card.title); setEditingTitle(false); return; }
    setEditingTitle(false);
    if (trimmed === card.title) return;
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) onUpdate(await res.json());
  };

  const saveDescription = async () => {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (res.ok) onUpdate(await res.json());
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    const res = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, content: newComment.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
    setSubmittingComment(false);
  };

  const deleteComment = async (id: number) => {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    onDelete(card.id);
    onClose();
  };

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false); } }}
                className="w-full text-xl font-bold px-2 py-1 rounded-lg border outline-none"
                style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: '#f5a623' }}
              />
            ) : (
              <h2
                className="text-xl font-bold cursor-text hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text)' }}
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {title}
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>✏️</span>
              </h2>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Created {formatDate(card.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
              style={{ background: '#dc2626', color: '#fff' }}
            >
              Delete
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder="Add a more detailed description…"
              rows={6}
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none focus:ring-2 transition-colors"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: 'var(--input-border)',
              }}
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Comments ({comments.length})
            </label>

            <div className="space-y-3 mb-4">
              {comments.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first to add one!</p>
              )}
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: '#f5a623', color: '#0a0a0a' }}>
                    K
                  </div>
                  <div className="flex-1 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--surface-2)' }}>
                    <p style={{ color: 'var(--text)' }}>{comment.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(comment.created_at)}</span>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={addComment} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: '#f5a623', color: '#0a0a0a' }}>
                K
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(e as unknown as React.FormEvent); } }}
                  placeholder="Write a comment… (Enter to submit)"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none outline-none focus:ring-2 transition-colors"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: 'var(--input-border)' }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#f5a623', color: '#0a0a0a' }}
                  >
                    {submittingComment ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
