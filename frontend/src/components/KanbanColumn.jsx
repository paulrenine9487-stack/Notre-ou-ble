import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PracticeTaskCard from './PracticeTaskCard';
import { Plus } from 'lucide-react';

export default function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
  onCardClick,
  onMoveStatus
}) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  const columnClass = id.toLowerCase();

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${columnClass} ${isOver ? 'is-over' : ''}`}
    >
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          <span>&lt;{title}&gt;</span>
          <span className="kanban-count-pill">{tasks.length}</span>
        </h3>

        {id === 'TODO' && onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            title="Add Task to To Do"
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>ADD TASK</span>
          </button>
        )}
      </div>

      <SortableContext
        id={id}
        items={tasks.map(t => t.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-task-list">
          {tasks.length === 0 ? (
            <div style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: '#77728A',
              fontSize: '0.78rem',
              border: '1.5px dashed rgba(25, 27, 53, 0.12)',
              borderRadius: '10px'
            }}>
              {id === 'TODO' && 'No tasks planned yet. Click ADD TASK above!'}
              {id === 'DOING' && 'Drag tasks here when you start practising.'}
              {id === 'DONE' && 'Drag completed tasks here.'}
            </div>
          ) : (
            tasks.map(task => (
              <PracticeTaskCard
                key={task.id}
                task={task}
                onClick={() => onCardClick(task)}
                onMoveStatus={onMoveStatus}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
