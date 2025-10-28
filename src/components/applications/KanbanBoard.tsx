/**
 * KanbanBoard Component (Story 3.3 - Desktop View)
 *
 * Kanban board layout with drag-and-drop functionality for application status updates.
 * Features:
 * - 4 columns: BACKLOG, TODO, IN_PROGRESS, SUBMITTED
 * - Drag-and-drop to change status (desktop only)
 * - Column headers with count badges
 * - Optimistic updates with rollback on error
 *
 * @component
 */

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ApplicationCard } from './ApplicationCard'
import { ColumnHeader } from './ColumnHeader'
import { cn } from '@/lib/utils'
import { groupByStatus, type ColumnStatus } from '@/lib/utils/application'
import type { Application, Scholarship, Timeline, ApplicationStatus } from '@prisma/client'

type ApplicationWithRelations = Application & {
  scholarship: Pick<Scholarship, 'name' | 'provider' | 'awardAmount' | 'deadline' | 'category' | 'tags'>
  timeline: Timeline | null
}

interface KanbanBoardProps {
  applications: ApplicationWithRelations[]
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>
  showCheckbox?: boolean // Story 3.9: Enable bulk selection mode
}

/**
 * Draggable Application Card Wrapper
 */
function DraggableApplicationCard({
  application,
  showCheckbox,
}: {
  application: ApplicationWithRelations
  showCheckbox?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard
        application={application}
        isDraggable={!showCheckbox}
        showCheckbox={showCheckbox}
        className="mb-3"
      />
    </div>
  )
}

/**
 * Droppable Column Component
 */
function DroppableColumn({
  status,
  applications,
  children,
}: {
  status: ColumnStatus
  applications: ApplicationWithRelations[]
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      <ColumnHeader status={status} count={applications.length} />
      <SortableContext
        items={applications.map((app) => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            'flex-1 min-h-[200px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200',
            'transition-colors'
          )}
        >
          {applications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No applications
            </div>
          ) : (
            children
          )}
        </div>
      </SortableContext>
    </div>
  )
}

/**
 * Get target status from column
 */
function getTargetStatus(columnStatus: ColumnStatus): ApplicationStatus {
  switch (columnStatus) {
    case 'BACKLOG':
      return 'NOT_STARTED'
    case 'TODO':
      return 'TODO'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'SUBMITTED':
      return 'SUBMITTED'
    default:
      return 'TODO'
  }
}

export function KanbanBoard({ applications, onStatusChange, showCheckbox = false }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configure drag sensors (pointer sensor for desktop)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  )

  // Group applications by column status
  const groupedApplications = groupByStatus(applications)

  // Find active application being dragged
  const activeApplication = activeId
    ? applications.find((app) => app.id === activeId)
    : null

  /**
   * Handle drag start
   */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  /**
   * Handle drag end - update application status
   */
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const applicationId = active.id as string
    const targetColumnStatus = over.id as ColumnStatus

    // Find the application
    const application = applications.find((app) => app.id === applicationId)
    if (!application) return

    // Get target status from column
    const targetStatus = getTargetStatus(targetColumnStatus)

    // If status hasn't changed, do nothing
    if (application.status === targetStatus) return

    // Call mutation to update status
    try {
      await onStatusChange(applicationId, targetStatus)
    } catch (error) {
      console.error('Failed to update application status:', error)
      // Optimistic update rollback is handled by React Query
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-6">
        {/* BACKLOG Column */}
        <SortableContext
          items={['BACKLOG']}
          strategy={verticalListSortingStrategy}
          id="BACKLOG"
        >
          <DroppableColumn status="BACKLOG" applications={groupedApplications.BACKLOG}>
            {groupedApplications.BACKLOG.map((app) => (
              <DraggableApplicationCard key={app.id} application={app} showCheckbox={showCheckbox} />
            ))}
          </DroppableColumn>
        </SortableContext>

        {/* TODO Column */}
        <SortableContext
          items={['TODO']}
          strategy={verticalListSortingStrategy}
          id="TODO"
        >
          <DroppableColumn status="TODO" applications={groupedApplications.TODO}>
            {groupedApplications.TODO.map((app) => (
              <DraggableApplicationCard key={app.id} application={app} showCheckbox={showCheckbox} />
            ))}
          </DroppableColumn>
        </SortableContext>

        {/* IN_PROGRESS Column */}
        <SortableContext
          items={['IN_PROGRESS']}
          strategy={verticalListSortingStrategy}
          id="IN_PROGRESS"
        >
          <DroppableColumn status="IN_PROGRESS" applications={groupedApplications.IN_PROGRESS}>
            {groupedApplications.IN_PROGRESS.map((app) => (
              <DraggableApplicationCard key={app.id} application={app} showCheckbox={showCheckbox} />
            ))}
          </DroppableColumn>
        </SortableContext>

        {/* SUBMITTED Column */}
        <SortableContext
          items={['SUBMITTED']}
          strategy={verticalListSortingStrategy}
          id="SUBMITTED"
        >
          <DroppableColumn status="SUBMITTED" applications={groupedApplications.SUBMITTED}>
            {groupedApplications.SUBMITTED.map((app) => (
              <DraggableApplicationCard key={app.id} application={app} showCheckbox={showCheckbox} />
            ))}
          </DroppableColumn>
        </SortableContext>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeApplication ? (
          <ApplicationCard application={activeApplication} isDraggable />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
