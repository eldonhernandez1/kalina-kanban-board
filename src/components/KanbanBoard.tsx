'use client';

import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import type { Project, Stage, Card } from '@/types';
import CardModal from './CardModal';
import ThemeToggle from './ThemeToggle';

interface KanbanBoardProps {
  project: Project;
  initialStages: Stage[];
  initialCards: Card[];
}

export default function KanbanBoard({ project, initialStages, initialCards }: KanbanBoardProps) {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [cardMap, setCardMap] = useState<Record<number, Card[]>>(() => {
    const map: Record<number, Card[]> = {};
    for (const s of initialStages) map[s.id] = [];
    for (const c of initialCards) {
      if (!map[c.stage_id]) map[c.stage_id] = [];
      map[c.stage_id].push(c);
    }
    for (const key of Object.keys(map)) map[parseInt(key)].sort((a, b) => a.position - b.position);
    return map;
  });

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [stageNameDraft, setStageNameDraft] = useState('');
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [cardTitleDraft, setCardTitleDraft] = useState('');
  const [addingCardStageId, setAddingCardStageId] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const stageInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const addStageRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editingStageId !== null && stageInputRef.current) stageInputRef.current.focus();
  }, [editingStageId]);

  useEffect(() => {
    if (addingCardStageId !== null && cardInputRef.current) cardInputRef.current.focus();
  }, [addingCardStageId]);

  useEffect(() => {
    if (showAddStage && addStageRef.current) addStageRef.current.focus();
  }, [showAddStage]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const srcId = parseInt(source.droppableId);
    const dstId = parseInt(destination.droppableId);
    const cardId = parseInt(draggableId);
    if (srcId === dstId && source.index === destination.index) return;

    setCardMap(prev => {
      const next = { ...prev };
      const srcCards = [...(next[srcId] || [])];
      const [moved] = srcCards.splice(source.index, 1);
      if (srcId === dstId) {
        srcCards.splice(destination.index, 0, moved);
        next[srcId] = srcCards;
      } else {
        const dstCards = [...(next[dstId] || [])];
        dstCards.splice(destination.index, 0, { ...moved, stage_id: dstId });
        next[srcId] = srcCards;
        next[dstId] = dstCards;
      }
      return next;
    });

    await fetch(`/api/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: dstId, position: destination.index }),
    });
  };

  const addStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const res = await fetch('/api/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, name: newStageName.trim() }),
    });
    if (res.ok) {
      const stage: Stage = await res.json();
      setStages(prev => [...prev, stage]);
      setCardMap(prev => ({ ...prev, [stage.id]: [] }));
      setNewStageName('');
      setShowAddStage(false);
    }
  };

  const deleteStage = async (stageId: number) => {
    if (!confirm('Delete this stage and all its cards?')) return;
    await fetch(`/api/stages/${stageId}`, { method: 'DELETE' });
    setStages(prev => prev.filter(s => s.id !== stageId));
    setCardMap(prev => { const next = { ...prev }; delete next[stageId]; return next; });
  };

  const startEditStage = (stage: Stage) => {
    setEditingStageId(stage.id);
    setStageNameDraft(stage.name);
  };

  const saveStage = async (stageId: number) => {
    const trimmed = stageNameDraft.trim();
    setEditingStageId(null);
    if (!trimmed) return;
    const stage = stages.find(s => s.id === stageId);
    if (stage && trimmed === stage.name) return;
    const res = await fetch(`/api/stages/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const updated: Stage = await res.json();
      setStages(prev => prev.map(s => s.id === stageId ? updated : s));
    }
  };

  const addCard = async (stageId: number) => {
    if (!newCardTitle.trim()) { setAddingCardStageId(null); return; }
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, project_id: project.id, title: newCardTitle.trim() }),
    });
    if (res.ok) {
      const card: Card = await res.json();
      setCardMap(prev => ({ ...prev, [stageId]: [...(prev[stageId] || []), card] }));
      setNewCardTitle('');
      setAddingCardStageId(null);
    }
  };

  const startEditCard = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCardId(card.id);
    setCardTitleDraft(card.title);
  };

  const saveCard = async (card: Card) => {
    const trimmed = cardTitleDraft.trim();
    setEditingCardId(null);
    if (!trimmed || trimmed === card.title) return;
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      const updated: Card = await res.json();
      setCardMap(prev => ({
        ...prev,
        [card.stage_id]: (prev[card.stage_id] || []).map(c => c.id === card.id ? updated : c),
      }));
    }
  };

  const handleCardUpdate = (updated: Card) => {
    setCardMap(prev => ({
      ...prev,
      [updated.stage_id]: (prev[updated.stage_id] || []).map(c => c.id === updated.id ? updated : c),
    }));
    setSelectedCard(updated);
  };

  const handleCardDelete = (id: number) => {
    setCardMap(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[parseInt(key)] = next[parseInt(key)].filter(c => c.id !== id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--navy)' }} className="sticky top-0 z-10 shadow-lg flex-shrink-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex-shrink-0" style={{ background: project.color }} />
            <span className="font-bold text-white">{project.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.2)', color: '#f5a623' }}>
              {stages.length} stages · {Object.values(cardMap).flat().length} cards
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 items-start min-w-max pb-4">
            {stages.map(stage => {
              const stageCards = cardMap[stage.id] || [];
              return (
                <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-md"
                  style={{ background: 'var(--column-bg)' }}>
                  {/* Stage Header */}
                  <div className="px-3 py-3 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    {editingStageId === stage.id ? (
                      <input
                        ref={stageInputRef}
                        value={stageNameDraft}
                        onChange={e => setStageNameDraft(e.target.value)}
                        onBlur={() => saveStage(stage.id)}
                        onKeyDown={e => { if (e.key === 'Enter') saveStage(stage.id); if (e.key === 'Escape') setEditingStageId(null); }}
                        className="flex-1 text-sm font-bold px-2 py-1 rounded-lg border outline-none"
                        style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: '#f5a623' }}
                      />
                    ) : (
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{stage.name}</span>
                        <span className="flex-shrink-0 text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                          {stageCards.length}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEditStage(stage)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--text-muted)' }} title="Rename stage">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteStage(stage.id)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        style={{ color: 'var(--text-muted)' }} title="Delete stage">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={String(stage.id)}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-2 space-y-2 min-h-[60px] transition-colors"
                        style={{ background: snapshot.isDraggingOver ? 'var(--surface-2)' : 'transparent' }}
                      >
                        {stageCards.map((card, index) => (
                          <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                            {(drag, dragSnapshot) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                className="rounded-xl p-3 shadow-sm group cursor-pointer transition-all"
                                style={{
                                  background: 'var(--card-bg)',
                                  boxShadow: dragSnapshot.isDragging ? '0 8px 24px var(--shadow)' : '0 1px 4px var(--shadow)',
                                  opacity: dragSnapshot.isDragging ? 0.95 : 1,
                                  border: '1px solid var(--border)',
                                }}
                                onClick={() => { if (editingCardId !== card.id) setSelectedCard(card); }}
                              >
                                <div className="flex items-center gap-2">
                                  <div {...drag.dragHandleProps} className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={e => e.stopPropagation()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 21a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                                    </svg>
                                  </div>

                                  {editingCardId === card.id ? (
                                    <input
                                      autoFocus
                                      value={cardTitleDraft}
                                      onChange={e => setCardTitleDraft(e.target.value)}
                                      onBlur={() => saveCard(card)}
                                      onKeyDown={e => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') saveCard(card);
                                        if (e.key === 'Escape') setEditingCardId(null);
                                      }}
                                      onClick={e => e.stopPropagation()}
                                      className="flex-1 text-sm px-2 py-0.5 rounded border outline-none"
                                      style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: '#f5a623' }}
                                    />
                                  ) : (
                                    <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                                      {card.title}
                                    </span>
                                  )}

                                  <button
                                    onClick={e => startEditCard(card, e)}
                                    className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                                    style={{ color: 'var(--text-muted)' }}
                                    title="Edit title"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>

                                {card.description && (
                                  <p className="mt-1.5 ml-5 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                    {card.description}
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Card */}
                  <div className="p-2 pt-0">
                    {addingCardStageId === stage.id ? (
                      <div className="space-y-2">
                        <input
                          ref={cardInputRef}
                          value={newCardTitle}
                          onChange={e => setNewCardTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addCard(stage.id);
                            if (e.key === 'Escape') { setAddingCardStageId(null); setNewCardTitle(''); }
                          }}
                          placeholder="Card title…"
                          className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                          style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: '#f5a623' }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => addCard(stage.id)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: '#f5a623', color: '#0a0a0a' }}>
                            Add Card
                          </button>
                          <button onClick={() => { setAddingCardStageId(null); setNewCardTitle(''); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingCardStageId(stage.id); setNewCardTitle(''); }}
                        className="w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Card
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Stage */}
            <div className="w-72 flex-shrink-0">
              {showAddStage ? (
                <div className="rounded-2xl p-3 shadow-md space-y-2" style={{ background: 'var(--column-bg)' }}>
                  <input
                    ref={addStageRef}
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addStage(e as unknown as React.FormEvent);
                      if (e.key === 'Escape') { setShowAddStage(false); setNewStageName(''); }
                    }}
                    placeholder="Stage name…"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--input-bg)', color: 'var(--text)', borderColor: '#f5a623' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={e => addStage(e as unknown as React.FormEvent)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#f5a623', color: '#0a0a0a' }}>
                      Add Stage
                    </button>
                    <button onClick={() => { setShowAddStage(false); setNewStageName(''); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAddStage(true); setNewStageName(''); }}
                  className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border-2 border-dashed transition-all hover:opacity-80"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stage
                </button>
              )}
            </div>
          </div>
        </DragDropContext>

        {stages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🗂️</div>
            <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>No stages yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add your first stage to start organizing work</p>
            <button onClick={() => setShowAddStage(true)}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: '#f5a623', color: '#0a0a0a' }}>
              Add First Stage
            </button>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
