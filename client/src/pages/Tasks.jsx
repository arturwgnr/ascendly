import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import api from '../api/client';
import '../styles/components/tasks.css';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtWeekRange(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
}

// ── Draggable chip ────────────────────────────────────────────────────────────
function DraggableChip({ id, task, onRemove, inPool }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: String(id), data: { task, inPool } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={inPool ? `pool-chip${isDragging ? ' dragging' : ''}` : `board-task-chip${isDragging ? ' dragging' : ''}`}
    >
      <div className={`priority-dot ${task.priority}`} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
      {!inPool && onRemove && (
        <button className="board-task-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
      )}
    </div>
  );
}

// ── Droppable day column ──────────────────────────────────────────────────────
function DroppableDay({ dayIndex, tasks, weekStart, onRemove, isToday }) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dayIndex}` });
  const monday = new Date(weekStart);
  const dayDate = new Date(monday);
  dayDate.setDate(monday.getDate() + dayIndex);

  return (
    <div className="board-day">
      <div className={`board-day-header${isToday ? ' today' : ''}`}>
        <div>{DAY_LABELS[dayIndex]}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 400 }}>
          {dayDate.getDate()}
        </div>
      </div>
      <div ref={setNodeRef} className={`board-day-drop${isOver ? ' over' : ''}`}>
        {tasks.map(t => (
          <DraggableChip
            key={t.allocationId}
            id={`board-${t.allocationId}`}
            task={t}
            onRemove={() => onRemove(t.allocationId)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Pool droppable ────────────────────────────────────────────────────────────
function PoolDroppable({ tasks }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'pool' });
  return (
    <div ref={setNodeRef} className={`unallocated-pool${isOver ? ' board-day-drop over' : ''}`}>
      {tasks.filter(t => t.status !== 'DONE').map(t => (
        <DraggableChip key={t.id} id={`pool-${t.id}`} task={t} inPool />
      ))}
      {tasks.filter(t => t.status !== 'DONE').length === 0 && (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>All tasks allocated</span>
      )}
    </div>
  );
}

export default function Tasks() {
  const [tab, setTab] = useState('backlog');
  const [tasks, setTasks] = useState([]);
  const [board, setBoard] = useState({});
  const [weekStart, setWeekStart] = useState(getMonday());
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadTasks = useCallback(() => api.get('/tasks').then(r => setTasks(r.data)), []);

  const loadBoard = useCallback(() => {
    return api.get('/tasks/board', { params: { weekStart: fmtDate(weekStart) } }).then(r => setBoard(r.data));
  }, [weekStart]);

  useEffect(() => {
    Promise.all([loadTasks(), loadBoard()]).finally(() => setLoading(false));
  }, [loadTasks, loadBoard]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (editTask) {
      await api.put(`/tasks/${editTask.id}`, form);
    } else {
      await api.post('/tasks', form);
    }
    setShowForm(false);
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'MEDIUM' });
    loadTasks();
  }

  async function toggleStatus(task) {
    const next = task.status === 'DONE' ? 'BACKLOG' : 'DONE';
    await api.put(`/tasks/${task.id}`, { status: next });
    loadTasks();
    loadBoard();
  }

  async function deleteTask(id) {
    if (!confirm('Delete task?')) return;
    await api.delete(`/tasks/${id}`);
    loadTasks();
    loadBoard();
  }

  async function removeAllocation(allocationId) {
    await api.delete(`/tasks/allocate/${allocationId}`);
    loadBoard();
  }

  async function handleDragEnd(event) {
    const { over, active } = event;
    setActiveId(null);
    if (!over) return;

    const overId = over.id;
    const activeData = active.data.current;

    if (overId === 'pool') {
      if (!activeData.inPool && activeData.task.allocationId) {
        await api.delete(`/tasks/allocate/${activeData.task.allocationId}`);
        loadBoard();
        loadTasks();
      }
      return;
    }

    if (overId.startsWith('day-')) {
      const dayIndex = parseInt(overId.replace('day-', ''));
      const taskId = activeData.task.id;
      await api.post('/tasks/allocate', {
        taskId,
        weekStart: fmtDate(weekStart),
        dayOfWeek: dayIndex,
      });
      loadBoard();
      loadTasks();
    }
  }

  const allocatedTaskIds = new Set(
    Object.values(board).flat().map(t => t.id)
  );

  const unallocatedTasks = tasks.filter(t => !allocatedTaskIds.has(t.id) && t.status !== 'DONE');

  const todayDayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();

  const isSameWeek = fmtDate(weekStart) === fmtDate(getMonday());

  const activeTask = activeId
    ? (() => {
        if (activeId.startsWith('pool-')) {
          const id = parseInt(activeId.replace('pool-', ''));
          return tasks.find(t => t.id === id);
        }
        if (activeId.startsWith('board-')) {
          const allocId = parseInt(activeId.replace('board-', ''));
          return Object.values(board).flat().find(t => t.allocationId === allocId);
        }
        return null;
      })()
    : null;

  if (loading) return <Layout title="Tasks"><div className="empty-state"><p>Loading…</p></div></Layout>;

  return (
    <Layout title="Tasks">
      <div className="page-header">
        <div className="tasks-tabs">
          <button className={`tasks-tab${tab === 'backlog' ? ' active' : ''}`} onClick={() => setTab('backlog')}>
            Backlog
          </button>
          <button className={`tasks-tab${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>
            Weekly Board
          </button>
        </div>
        {tab === 'backlog' && (
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', priority: 'MEDIUM' }); setEditTask(null); setShowForm(true); }}>
            + New Task
          </button>
        )}
      </div>

      {tab === 'backlog' && (
        <div className="card">
          {tasks.length === 0 ? (
            <div className="empty-state"><span>▦</span><p>No tasks yet. Create one.</p></div>
          ) : (
            <div className="backlog-list">
              {tasks.map(t => (
                <div key={t.id} className={`task-card${t.status === 'DONE' ? ' done' : ''}`}>
                  <button
                    className={`task-status-btn${t.status === 'DONE' ? ' done' : ''}`}
                    onClick={() => toggleStatus(t)}
                  >✓</button>
                  <div>
                    <div className="task-title" style={t.status === 'DONE' ? { textDecoration: 'line-through' } : {}}>
                      {t.title}
                    </div>
                    <div className="task-meta">
                      <span className={`tag tag-${t.priority === 'HIGH' ? 'danger' : t.priority === 'MEDIUM' ? 'warning' : 'muted'}`}>
                        {t.priority}
                      </span>
                      {t.description && <span>{t.description}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setForm({ title: t.title, description: t.description || '', priority: t.priority }); setEditTask(t); setShowForm(true); }}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTask(t.id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'board' && (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Week nav */}
            <div className="card" style={{ padding: '12px 16px' }}>
              <div className="board-nav">
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; })}>← Prev</button>
                <span className="board-nav-week">{fmtWeekRange(weekStart)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; })}>Next →</button>
                {!isSameWeek && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(getMonday())}>Today</button>
                )}
              </div>
            </div>

            {/* Unallocated pool */}
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Backlog (drag to allocate)</div>
              <PoolDroppable tasks={unallocatedTasks} />
            </div>

            {/* Board */}
            <div className="board-grid">
              {DAY_LABELS.map((_, i) => (
                <DroppableDay
                  key={i}
                  dayIndex={i}
                  tasks={board[i] || []}
                  weekStart={weekStart}
                  onRemove={removeAllocation}
                  isToday={isSameWeek && i === todayDayIndex}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="board-task-chip" style={{ boxShadow: 'var(--shadow-md)', cursor: 'grabbing' }}>
                <div className={`priority-dot ${activeTask.priority}`} />
                <span>{activeTask.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showForm && (
        <Modal
          title={editTask ? 'Edit Task' : 'New Task'}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditTask(null); }}>Cancel</button>
              <button className="btn btn-primary" form="task-form" type="submit">
                {editTask ? 'Save' : 'Create'}
              </button>
            </>
          }
        >
          <form id="task-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="label">Title</label>
              <input className="input" placeholder="Task title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="Brief description…" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Priority</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`btn ${form.priority === p ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                  >{p}</button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
