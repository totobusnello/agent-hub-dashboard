import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Generic hook for querying Supabase tables/views
export function useSupabaseQuery<T = any>(
  key: string,
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    filter?: { column: string; value: any };
  }
) {
  return useQuery({
    queryKey: [key, options?.filter],
    queryFn: async () => {
      let query = supabase.from(table).select(options?.select || "*");
      if (options?.filter) {
        query = query.eq(options.filter.column, options.filter.value);
      }
      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
  });
}
