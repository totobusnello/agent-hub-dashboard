import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";

function CoreNodeComponent(_props: NodeProps) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />

      <div className="relative" style={{ width: 100, height: 100 }}>
        {/* Outer pulse rings */}
        <motion.div
          className="absolute inset-[-12px] rounded-full border border-cyan-400/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-[-6px] rounded-full border border-cyan-400/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Rotating conic ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, hsl(190 90% 50% / 0.6) 60deg, transparent 120deg, hsl(270 70% 60% / 0.4) 200deg, transparent 280deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        />

        {/* Inner orb */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 6,
            background: "radial-gradient(circle at 40% 35%, hsl(190 80% 60% / 0.4), hsl(190 70% 25% / 0.6) 50%, hsl(250 50% 15% / 0.8))",
            boxShadow: "inset 0 0 20px hsl(190 90% 50% / 0.2), 0 0 30px hsl(190 90% 50% / 0.15)",
          }}
        />

        {/* Core icon/text */}
        <span className="absolute inset-0 flex items-center justify-center text-2xl select-none">
          🧠
        </span>

        {/* Glow field */}
        <div
          className="absolute inset-[-20px] rounded-full blur-2xl"
          style={{
            background: "radial-gradient(circle, hsl(190 90% 50% / 0.12), transparent 70%)",
          }}
        />
      </div>

      {/* Label */}
      <div className="mt-2 text-[11px] font-semibold tracking-widest uppercase text-cyan-400/90 font-mono">
        TotoClaw Core
      </div>
      <div className="text-[8px] text-muted-foreground tracking-wider font-mono">
        NEURAL COMMAND
      </div>
    </div>
  );
}

export const CoreNode = memo(CoreNodeComponent);
