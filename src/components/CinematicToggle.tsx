import { Switch } from "@/components/ui/switch";
import { useCinematicMode } from "@/contexts/CinematicModeContext";

export function CinematicToggle() {
  const { isCinematic, toggleCinematic } = useCinematicMode();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
        Cinema
      </span>
      <Switch
        checked={isCinematic}
        onCheckedChange={toggleCinematic}
        className="scale-75 origin-right"
      />
    </div>
  );
}
