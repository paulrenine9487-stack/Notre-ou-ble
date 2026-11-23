import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import PracticeTaskCard from './PracticeTaskCard';
import CreatePracticeTaskModal from './CreatePracticeTaskModal';
import PracticeTaskDetailsModal from './PracticeTaskDetailsModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PracticeDiaryBoard({
  tasks,
  onTasksChanged,
  onStatusUpdated
}) {
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const doingTasks = tasks.filter(t => t.status === 'DOING');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id.toString() === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = parseInt(active.id, 10);
    const activeTaskItem = tasks.find(t => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column
    let targetColumn = null;
    let targetIndex = 0;

    if (['TODO', 'DOING', 'DONE'].includes(over.id)) {
      targetColumn = over.id;
      const colTasks = tasks.filter(t => t.status === targetColumn);
      targetIndex = colTasks.length;
    } else {
      const overId = parseInt(over.id, 10);
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetColumn = overTask.status;
        const colTasks = tasks.filter(t => t.status === targetColumn);
        targetIndex = colTasks.findIndex(t => t.id === overId);
      }
    }

    if (!targetColumn) return;

    // If moved to a different column
    if (activeTaskItem.status !== targetColumn) {
      try {
        await onStatusUpdated(activeId, targetColumn, targetIndex);
        showNotification(`Moved "${activeTaskItem.title}" to ${targetColumn}`);
      } catch (err) {
        showNotification('Failed to update task status in MySQL.', 'error');
      }
    } else {
      // Reordering within same column
      const colTasks = tasks.filter(t => t.status === targetColumn);
      const oldIndex = colTasks.findIndex(t => t.id === activeId);
      if (oldIndex !== targetIndex && targetIndex !== -1) {
        const reordered = arrayMove(colTasks, oldIndex, targetIndex);
        const reorderPayload = reordered.map((t, idx) => ({
          id: t.id,
          status: targetColumn,
          position: idx
        }));
        try {
          await onTasksChanged(reorderPayload);
        } catch (err) {
          showNotification('Failed to save task reorder.', 'error');
        }
      }
    }
  };

  const handleDirectStatusMove = async (taskId, newStatus) => {
    try {
      const colTasks = tasks.filter(t => t.status === newStatus);
      await onStatusUpdated(taskId, newStatus, colTasks.length);
      const t = tasks.find(item => item.id === taskId);
      showNotification(`Moved "${t?.title || 'Task'}" to ${newStatus}`);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      showNotification('Failed to move task status.', 'error');
    }
  };

  return (
    <div className="diary-kanban-section">
      <div className="diary-section-header">
        <h2 className="diary-section-title">MY PRACTICE DIARY</h2>
        <p className="diary-section-desc">
          Plan your practice, stay consistent and track every step of your musical journey.
        </p>
      </div>

      {/* Floating Status Notification */}
      {notification && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '8px',
          backgroundColor: notification.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: notification.type === 'error' ? '#991B1B' : '#166534',
          border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          fontSize: '0.8rem',
          fontWeight: 650,
          marginBottom: '16px'
        }}>
          {notification.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Drag & Drop Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board-container">
          <KanbanColumn
            id="TODO"
            title="TO DO"
            tasks={todoTasks}
            onAddTask={() => setCreateModalOpen(true)}
            onCardClick={(t) => setSelectedTask(t)}
            onMoveStatus={handleDirectStatusMove}
          />

          <KanbanColumn
            id="DOING"
            title="DOING"
            tasks={doingTasks}
            onCardClick={(t) => setSelectedTask(t)}
            onMoveStatus={handleDirectStatusMove}
          />

          <KanbanColumn
            id="DONE"
            title="DONE"
            tasks={doneTasks}
            onCardClick={(t) => setSelectedTask(t)}
            onMoveStatus={handleDirectStatusMove}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <PracticeTaskCard
              task={activeTask}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <CreatePracticeTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={() => {
          showNotification('Task added to your TO DO list.');
          onTasksChanged();
        }}
      />

      {/* Task Details Modal */}
      <PracticeTaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onMoveStatus={handleDirectStatusMove}
        onUpdate={async (id, data) => {
          // Update task
          const res = await api.updateDiaryTask(id, data);
          showNotification('Task details updated.');
          onTasksChanged();
          if (res.success && res.task) {
            setSelectedTask(res.task);
          }
        }}
        onDelete={async (id) => {
          await api.deleteDiaryTask(id);
          showNotification('Task deleted from practice diary.');
          setSelectedTask(null);
          onTasksChanged();
        }}
      />
    </div>
  );
}
