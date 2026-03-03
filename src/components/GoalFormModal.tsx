import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Goal, GoalFormData } from "@/hooks/useGoals";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoals";

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

interface GoalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  agents: Agent[];
}

const statusOptions = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const priorityOptions = [
  { value: "0", label: "Low" },
  { value: "1", label: "Medium" },
  { value: "2", label: "High" },
  { value: "3", label: "Critical" },
];

export function GoalFormModal({ open, onOpenChange, goal, agents }: GoalFormModalProps) {
  const [form, setForm] = useState<GoalFormData>({
    title: "",
    description: "",
    status: "backlog",
    priority: 0,
    agent_ids: [],
  });
  const [titleError, setTitleError] = useState(false);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const isEdit = !!goal;
  const saving = createGoal.isPending || updateGoal.isPending;

  useEffect(() => {
    if (open) {
      setForm({
        title: goal?.title ?? "",
        description: goal?.description ?? "",
        status: goal?.status ?? "backlog",
        priority: goal?.priority ?? 0,
        agent_ids: goal?.goal_agents?.map((ga) => ga.agent_id) ?? [],
      });
      setTitleError(false);
    }
  }, [open, goal]);

  const selectedAgents = agents.filter((a) => form.agent_ids.includes(a.id));

  const toggleAgent = (agentId: string) => {
    setForm((prev) => ({
      ...prev,
      agent_ids: prev.agent_ids.includes(agentId)
        ? prev.agent_ids.filter((id) => id !== agentId)
        : [...prev.agent_ids, agentId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }

    if (isEdit) {
      await updateGoal.mutateAsync({ id: goal.id, ...form });
    } else {
      await createGoal.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!goal || !window.confirm("Delete this goal?")) return;
    await deleteGoal.mutateAsync(goal.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "New Goal"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update goal details and agent assignments." : "Create a new strategic goal."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Input
              placeholder="Goal title"
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                if (e.target.value.trim()) setTitleError(false);
              }}
              className={titleError ? "border-destructive" : ""}
            />
            {titleError && (
              <p className="text-xs text-destructive mt-1">Title is required</p>
            )}
          </div>

          <Textarea
            placeholder="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <Select
                value={String(form.priority)}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Assigned Agents</label>
            <Popover open={agentPickerOpen} onOpenChange={setAgentPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {selectedAgents.length === 0
                    ? "Select agents..."
                    : `${selectedAgents.length} agent${selectedAgents.length > 1 ? "s" : ""} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search agents..." />
                  <CommandList>
                    <CommandEmpty>No agents found.</CommandEmpty>
                    <CommandGroup>
                      {agents.map((agent) => (
                        <CommandItem
                          key={agent.id}
                          value={agent.name}
                          onSelect={() => toggleAgent(agent.id)}
                        >
                          <Checkbox
                            checked={form.agent_ids.includes(agent.id)}
                            className="mr-2"
                          />
                          <span>{agent.emoji}</span>
                          <span className="ml-1.5">{agent.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedAgents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedAgents.map((a) => (
                  <Badge key={a.id} variant="secondary" className="text-xs gap-1">
                    {a.emoji} {a.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleAgent(a.id)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteGoal.isPending}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saving}>
            {isEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
