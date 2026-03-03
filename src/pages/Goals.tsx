import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useGoals, useMoveGoal, type Goal } from "@/hooks/useGoals";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { GoalFormModal } from "@/components/GoalFormModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertTriangle, GripVertical } from "lucide-react";

const columns = ["backlog", "in_progress", "done", "blocked"] as const;
const columnLabels: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};
const columnColors: Record<string, string> = {
  backlog: "bg-muted-foreground",
  in_progress: "bg-foreground",
  done: "bg-success",
  blocked: "bg-destructive",
};
const priorityLabels: Record<number, string> = {
  0: "Low",
  1: "Med",
  2: "High",
  3: "Critical",
};
const priorityColors: Record<number, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-muted text-foreground",
  2: "bg-warning/15 text-warning",
  3: "bg-destructive/15 text-destructive",
};

interface Agent {
  id: string;
  name: string;
  emoji: string;
  is_active: boolean;
}

function GoalCard({
  goal,
  onClick,
  isDragging,
}: {
  goal: Goal;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const hasAgents = goal.goal_agents.length > 0;
  return (
    <Card
      className={`border-border/50 cursor-pointer hover:border-border transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 cursor-grab" />
            <p className="text-sm font-medium">{goal.title}</p>
          </div>
          {goal.priority > 0 && (
            <Badge
              variant="secondary"
              className={`text-[10px] shrink-0 ${priorityColors[goal.priority] ?? ""}`}
            >
              {priorityLabels[goal.priority] ?? `P${goal.priority}`}
            </Badge>
          )}
        </div>
        {goal.description && (
          <p className="text-xs text-muted-foreground mt-1 ml-5.5 line-clamp-2">
            {goal.description}
          </p>
        )}
        <div className="mt-2 ml-5.5 flex flex-wrap gap-1">
          {hasAgents ? (
            goal.goal_agents.map((ga) => (
              <span
                key={ga.agent_id}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              >
                <span className="text-sm">{ga.agents.emoji}</span>
                {ga.agents.name}
              </span>
            ))
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] bg-warning/10 text-warning border-warning/20 gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              NEEDS OWNER
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SortableGoalCard({
  goal,
  onClick,
}: {
  goal: Goal;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    data: { goal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GoalCard goal={goal} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[60px] rounded-lg transition-colors ${
        isOver ? "bg-accent/50 ring-1 ring-accent" : ""
      }`}
    >
      {children}
    </div>
  );
}

const Goals = () => {
  const { data: goals, isLoading } = useGoals();
  const { data: allAgents } = useSupabaseQuery<Agent>("agents-list", "agents");
  const agents = allAgents?.filter((a) => a.is_active) ?? [];
  const moveGoal = useMoveGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const openCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const goal = (event.active.data.current as any)?.goal as Goal | undefined;
    if (goal) setActiveGoal(goal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGoal(null);
    const { active, over } = event;
    if (!over) return;

    const goalId = active.id as string;
    const goal = goals?.find((g) => g.id === goalId);
    if (!goal) return;

    // Determine target column: either dropped on a column or on another goal card
    let targetStatus: string | null = null;
    if (columns.includes(over.id as any)) {
      targetStatus = over.id as string;
    } else {
      // Dropped on another goal — use that goal's column
      const overGoal = goals?.find((g) => g.id === over.id);
      if (overGoal) targetStatus = overGoal.status;
    }

    if (targetStatus && targetStatus !== goal.status) {
      moveGoal.mutate({ id: goalId, status: targetStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Strategic objectives kanban — drag to change status
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => {
              const items = goals?.filter((g) => g.status === col) ?? [];
              return (
                <div key={col} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${columnColors[col]}`} />
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                      {columnLabels[col]}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {items.length}
                    </Badge>
                  </div>
                  <DroppableColumn id={col}>
                    {items.map((goal) => (
                      <SortableGoalCard
                        key={goal.id}
                        goal={goal}
                        onClick={() => openEdit(goal)}
                      />
                    ))}
                    {items.length === 0 && (
                      <div className="border border-dashed border-border/30 rounded-lg p-4 text-center text-xs text-muted-foreground">
                        Drop here
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeGoal && (
              <div className="w-[280px]">
                <GoalCard goal={activeGoal} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <GoalFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        goal={editingGoal}
        agents={agents}
      />
    </div>
  );
};

export default Goals;
