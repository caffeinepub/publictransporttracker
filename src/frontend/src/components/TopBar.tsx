import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bus, Menu, Radio, RefreshCw, Settings } from "lucide-react";

interface TopBarProps {
  lastRefresh: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAdminOpen: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeBusCount: number;
  totalBusCount: number;
}

export default function TopBar({
  lastRefresh,
  isRefreshing,
  onRefresh,
  onAdminOpen,
  sidebarOpen,
  onToggleSidebar,
  activeBusCount,
  totalBusCount,
}: TopBarProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-3 shrink-0 z-10">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onToggleSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarOpen ? "Close sidebar" : "Open sidebar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="hidden sm:flex items-center gap-3 ml-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bus className="h-3.5 w-3.5 text-transit-cyan" />
            <span className="font-mono">
              <span className="text-transit-green font-semibold">
                {activeBusCount}
              </span>
              <span className="text-muted-foreground">/{totalBusCount}</span>
            </span>
            <span>active</span>
          </div>
        </div>
      </div>

      {/* Center - GPS signal */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {/* Animated GPS dot */}
          <div className="relative flex items-center justify-center">
            <div
              className={`h-2 w-2 rounded-full ${
                isRefreshing ? "bg-transit-cyan" : "bg-transit-green"
              }`}
            />
            {isRefreshing && (
              <div className="absolute h-4 w-4 rounded-full border border-transit-cyan/30 bus-pulse" />
            )}
          </div>
          <span className="font-mono text-xs text-muted-foreground hidden md:block">
            {isRefreshing ? (
              <span className="text-transit-cyan">Syncing GPS...</span>
            ) : (
              <span className="text-transit-green">Live</span>
            )}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <Radio className="h-3 w-3 text-muted-foreground/50" />
          <span>GSM</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Updated</span>
          <span className="font-mono text-foreground/70">
            {formatTime(lastRefresh)}
          </span>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-transit-cyan"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh now</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onAdminOpen}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Admin panel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
