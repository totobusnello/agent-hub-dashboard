export function LivePill() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-success/15 border border-success/30 px-3 py-1 shadow-[0_0_12px_hsl(142_60%_50%/0.25)]">
      <span className="h-2 w-2 rounded-full bg-success animate-live-pulse shadow-[0_0_8px_hsl(142_60%_50%/0.6)]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-success">
        Live
      </span>
    </div>
  );
}
