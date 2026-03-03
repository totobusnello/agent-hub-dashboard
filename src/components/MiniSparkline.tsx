import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useActivitySparkline } from "@/hooks/useAgentActivity";

interface MiniSparklineProps {
  agentId?: string;
  color?: string;
}

const EMPTY_DATA = Array.from({ length: 12 }, () => ({ v: 0 }));

export function MiniSparkline({ agentId, color = "#06b6d4" }: MiniSparklineProps) {
  const { data: sparkData } = useActivitySparkline(agentId, 12);
  const data = sparkData && sparkData.length > 0 ? sparkData : EMPTY_DATA;

  return (
    <div className="w-20 h-6 opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
