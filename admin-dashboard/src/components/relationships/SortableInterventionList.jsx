import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, ChevronRight, Stethoscope } from 'lucide-react';

const EVIDENCE_STRENGTH = {
  high: { label: 'High', color: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  emerging: { label: 'Emerging', color: 'bg-blue-100 text-blue-700' },
  insufficient: { label: 'Insufficient', color: 'bg-gray-100 text-gray-700' },
};

const RECOMMENDATION_LEVEL = {
  core: { label: 'Core', color: 'bg-green-100 text-green-700' },
  adjunct: { label: 'Adjunct', color: 'bg-blue-100 text-blue-700' },
  optional: { label: 'Optional', color: 'bg-gray-100 text-gray-700' },
};

const SortableItem = ({ intervention, onEdit, onDetach, canEdit, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: intervention.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card group hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary-300 bg-primary-50 z-10' : ''}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle */}
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 p-2 -ml-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md touch-none select-none"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Link
              to={`/interventions/${intervention.id}`}
              className="font-semibold text-gray-900 text-sm sm:text-base hover:text-primary-600 transition-colors"
            >
              {intervention.name}
            </Link>
            {intervention.pivot?.strength_of_evidence && (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                  EVIDENCE_STRENGTH[intervention.pivot.strength_of_evidence]?.color
                }`}
              >
                {EVIDENCE_STRENGTH[intervention.pivot.strength_of_evidence]?.label}
              </span>
            )}
            {intervention.pivot?.recommendation_level && (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                  RECOMMENDATION_LEVEL[intervention.pivot.recommendation_level]?.color
                }`}
              >
                {RECOMMENDATION_LEVEL[intervention.pivot.recommendation_level]?.label}
              </span>
            )}
          </div>
          {intervention.care_domain && (
            <p className="text-xs sm:text-sm text-gray-500 mb-1">
              Domain: {intervention.care_domain.name}
            </p>
          )}
          {intervention.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {intervention.description}
            </p>
          )}
          {intervention.pivot?.clinical_notes && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2 italic line-clamp-2">
              Note: {intervention.pivot.clinical_notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 -mr-1">
          <Link
            to={`/interventions/${intervention.id}`}
            className="action-btn p-2 touch-manipulation"
            title="View Intervention"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(intervention)}
                className="action-btn p-2 touch-manipulation"
                title="Edit Relationship"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDetach(intervention)}
                className="action-btn p-2 hover:bg-red-50 active:bg-red-100 touch-manipulation"
                title="Remove from Condition"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SortableInterventionList = ({
  interventions,
  onReorder,
  onEdit,
  onDetach,
  canEdit,
}) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = interventions.findIndex((i) => i.id === active.id);
      const newIndex = interventions.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(interventions, oldIndex, newIndex);
      onReorder?.(newOrder);
    }
  };

  if (interventions.length === 0) {
    return (
      <div className="card text-center py-8">
        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No interventions linked yet</p>
      </div>
    );
  }

  // If user can't edit, don't enable drag-and-drop
  if (!canEdit) {
    return (
      <div className="space-y-3">
        {interventions.map((intervention) => (
          <SortableItem
            key={intervention.id}
            intervention={intervention}
            onEdit={onEdit}
            onDetach={onDetach}
            canEdit={false}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={interventions.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {interventions.map((intervention) => (
            <SortableItem
              key={intervention.id}
              intervention={intervention}
              onEdit={onEdit}
              onDetach={onDetach}
              canEdit={canEdit}
              isDragging={activeId === intervention.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableInterventionList;
