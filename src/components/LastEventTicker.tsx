import { AnimatePresence, motion } from "framer-motion";
import { useLatestActivity } from "@/hooks/useAgentActivity";

export function LastEventTicker() {
  const { data: events } = useLatestActivity(1);
  const latestEvent = events?.[events.length - 1] ?? null;

  return (
    <div className="relative overflow-hidden max-w-[280px] h-5">
      <AnimatePresence mode="popLayout">
        {latestEvent && (
          <motion.div
            key={latestEvent.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center"
          >
            <span className="text-[10px] font-mono text-muted-foreground truncate">
              <span className="mr-1">{latestEvent.agent_emoji}</span>
              <span className="text-foreground/70">{latestEvent.agent_name}</span>
              <span className="mx-1 text-border">→</span>
              <span>{latestEvent.message}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
