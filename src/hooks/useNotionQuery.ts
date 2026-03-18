import { useQuery } from "@tanstack/react-query";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/api/${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useNotionQuery<T>(key: string, endpoint: string, refetchInterval = 60_000) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: () => fetchApi<T>(endpoint),
    refetchInterval,
    staleTime: 30_000,
  });
}
