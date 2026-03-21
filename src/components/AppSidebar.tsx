import { useEffect, useState } from "react";
import {
  Bot,
  Clock,
  AlertTriangle,
  CheckSquare,
  RefreshCw,
  Brain,
  Activity,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLatestActivity } from "@/hooks/useAgentActivity";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Agents", url: "/", icon: Bot, eventSection: "agents" },
  { title: "Tarefas & Pendências", url: "/tarefas", icon: CheckSquare, eventSection: "tarefas" },
  { title: "Cron Health", url: "/cron", icon: Clock, eventSection: "cron" },
  { title: "Blockers", url: "/blockers", icon: AlertTriangle, eventSection: "blockers" },
  { title: "Update de Sistema", url: "/update-sistema", icon: RefreshCw, eventSection: "update" },
  { title: "Memória & Decisões", url: "/memoria", icon: Brain, eventSection: "memoria" },
  { title: "Memória & Saúde", url: "/memoria-health", icon: Activity, eventSection: "memoria-health" },
];

// Map event types to sidebar sections that should glow
const eventToSection: Record<string, string> = {
  error: "blockers",
  output: "agents",
  status_change: "agents",
  log: "cron",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: latestEvents } = useLatestActivity(1);
  const latestEvent = latestEvents?.[latestEvents.length - 1] ?? null;
  const [glowingSections, setGlowingSections] = useState<Set<string>>(new Set());

  // Trigger glow on events
  useEffect(() => {
    if (!latestEvent) return;

    const section = eventToSection[latestEvent.event_type];
    if (!section) return;

    setGlowingSections((prev) => new Set(prev).add(section));

    const timer = setTimeout(() => {
      setGlowingSections((prev) => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [latestEvent]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide">
            {!collapsed && <span className="text-gradient-shimmer">TotoClaw</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isGlowing = glowingSections.has(item.eventSection);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-foreground font-medium border-l-2 border-cyan-400/50"
                      >
                        <item.icon
                          className={cn(
                            "mr-2 h-4 w-4 transition-all duration-300",
                            isGlowing && "text-cyan-400 drop-shadow-[0_0_6px_hsl(190_90%_50%/0.6)]"
                          )}
                        />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        {!collapsed && (
          <p className="text-xs text-muted-foreground truncate px-2 mb-1">
            {user?.email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
