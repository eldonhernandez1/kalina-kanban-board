'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@/types';
import ThemeToggle from './ThemeToggle';

function getTextColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16) / 255;
  const g = parseInt(h.substr(2, 2), 16) / 255;
  const b = parseInt(h.substr(4, 2), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.45 ? '#0a0a0a' : '#f0f0f0';
}

const COLOR_LABELS: Record<string, string> = {
  '#0d1b35': 'Navy',
  '#1a3a5c': 'Steel',
  '#2d4a3a': 'Forest',
  '#4a2d1a': 'Bronze',
  '#3a1a4a': 'Violet',
  '#1a3a3a': 'Teal',
  '#4a3a1a': 'Amber',
  '#1a1a4a': 'Midnight',
};

export default function ProjectsView({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const openModal = () => { setNewName(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects(prev => [{ ...project, stage_count: 0, card_count: 0 }, ...prev]);
      closeModal();
    }
    setCreating(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its data?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--navy)' }} className="sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg"
              style={{ background: '#f5a623', color: '#0a0a0a' }}>K</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Kalina Team Kanban Board</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Your Projects</h2>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#f5a623', color: '#0a0a0a' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium mb-1">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map(project => {
              const textColor = getTextColor(project.color);
              const label = COLOR_LABELS[project.color] || 'Project';
              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="h-24 flex items-end px-5 pb-4 relative" style={{ background: project.color }}>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: textColor }}>
                      {label}
                    </span>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                      title="Delete project"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="font-bold text-base mb-2 truncate" style={{ color: 'var(--text)' }}>{project.name}</h3>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        {project.stage_count ?? 0} stages
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {project.card_count ?? 0} cards
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <div className="w-full py-2 rounded-lg text-center text-xs font-semibold transition-colors"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                      Open Board →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-white">Create New Project</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Project Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Marketing Campaign"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    borderColor: 'var(--input-border)',
                    '--tw-ring-color': '#f5a623',
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={!newName.trim() || creating}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#f5a623', color: '#0a0a0a' }}>
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
