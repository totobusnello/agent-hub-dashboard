import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoalAgent {
  agent_id: string;
  agents: { id: string; name: string; emoji: string };
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "in_progress" | "done" | "blocked";
  priority: number;
  created_at: string;
  updated_at: string;
  goal_agents: GoalAgent[];
}

export interface GoalFormData {
  title: string;
  description: string;
  status: string;
  priority: number;
  agent_ids: string[];
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*, goal_agents(agent_id, agents(id, name, emoji))")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: GoalFormData) => {
      const { data: goal, error } = await supabase
        .from("goals")
        .insert({
          title: form.title,
          description: form.description || null,
          status: form.status,
          priority: form.priority,
        })
        .select()
        .single();
      if (error) throw error;

      if (form.agent_ids.length > 0) {
        const { error: linkError } = await supabase
          .from("goal_agents")
          .insert(form.agent_ids.map((aid) => ({ goal_id: goal.id, agent_id: aid })));
        if (linkError) throw linkError;
      }
      return goal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: GoalFormData & { id: string }) => {
      const { error } = await supabase
        .from("goals")
        .update({
          title: form.title,
          description: form.description || null,
          status: form.status,
          priority: form.priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      const { error: delError } = await supabase
        .from("goal_agents")
        .delete()
        .eq("goal_id", id);
      if (delError) throw delError;

      if (form.agent_ids.length > 0) {
        const { error: linkError } = await supabase
          .from("goal_agents")
          .insert(form.agent_ids.map((aid) => ({ goal_id: id, agent_id: aid })));
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useMoveGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("goals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}
