import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, BookOpen, GripVertical, ChevronRight, ChevronLeft } from 'lucide-react';

export default function PracticeTaskCard({
  task,
  onClick,
  onMoveStatus,
  isOverlay = false
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id.toString(),
    data: { task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const priorityClass = task.priority ? task.priority.toLowerCase() : 'medium';

  const formattedDueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  }) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isOverlay ? 'is-dragging' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <h4
          className="kanban-card-title"
          onClick={onClick}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          {task.title}
        </h4>

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: '#A0AEC0', padding: '2px' }}
          title="Drag card"
        >
          <GripVertical size={15} />
        </div>
      </div>

      {task.description && (
        <p className="kanban-card-desc" onClick={onClick} style={{ cursor: 'pointer' }}>
          {task.description}
        </p>
      )}

      {/* Linked learning task badge */}
      {(task.stage_title || task.learning_task_id) && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: '#F4F0FF',
          fontSize: '0.68rem',
          color: '#191B35',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          <BookOpen size={10} color="#7C3AED" />
          <span>Stage {task.stage_number || '1'}: {task.stage_title || 'Breath Foundation'}</span>
        </div>
      )}

      {/* Meta Row */}
      <div className="kanban-card-meta">
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span className={`priority-tag ${priorityClass}`}>
            {task.priority || 'MEDIUM'}
          </span>

          {formattedDueDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}>
              <Calendar size={11} />
              <span>{formattedDueDate}</span>
            </span>
          )}
        </div>

        {/* Status shift shortcuts for accessibility */}
        {onMoveStatus && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {task.status !== 'TODO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus(task.id, task.status === 'DONE' ? 'DOING' : 'TODO');
                }}
                title={task.status === 'DONE' ? 'Move to Doing' : 'Move to To Do'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#77728A',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <ChevronLeft size={13} />
              </button>
            )}

            {task.status !== 'DONE' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus(task.id, task.status === 'TODO' ? 'DOING' : 'DONE');
                }}
                title={task.status === 'TODO' ? 'Move to Doing' : 'Move to Done'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7C3AED',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
