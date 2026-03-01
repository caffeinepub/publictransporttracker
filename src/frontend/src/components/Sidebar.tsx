import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { BusWithLocation, Route } from "../backend.d";
import { BusStatus } from "../backend.d";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  busLocations: BusWithLocation[];
  allBusLocations: BusWithLocation[];
  routes: Route[];
  routeMap: Record<string, Route>;
  filterRoute: string;
  filterStatus: string;
  onFilterRoute: (v: string) => void;
  onFilterStatus: (v: string) => void;
  selectedBusId: string | null;
  onSelectBus: (id: string | null) => void;
  isLoading: boolean;
}

function StatusBadge({ status }: { status: BusStatus }) {
  switch (status) {
    case BusStatus.active:
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-transit-green/15 text-transit-green border border-transit-green/30">
          <span className="h-1.5 w-1.5 rounded-full bg-transit-green" />
          Active
        </span>
      );
    case BusStatus.delayed:
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-transit-amber/15 text-transit-amber border border-transit-amber/30">
          <span className="h-1.5 w-1.5 rounded-full bg-transit-amber" />
          Delayed
        </span>
      );
    case BusStatus.outOfService:
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-transit-red/15 text-transit-red border border-transit-red/30">
          <span className="h-1.5 w-1.5 rounded-full bg-transit-red" />
          Out of Svc
        </span>
      );
  }
}

function BusCard({
  bwl,
  route,
  isSelected,
  onClick,
}: {
  bwl: BusWithLocation;
  route: Route | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  const speed = Math.round(bwl.location.speed);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${
        isSelected
          ? "bg-sidebar-accent border-sidebar-primary/30 shadow-glow-sm"
          : "border-transparent hover:bg-sidebar-accent/60 hover:border-sidebar-border"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Route color dot */}
        <div
          className="mt-1 h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/20"
          style={{ background: route?.color || "#06b6d4" }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {bwl.bus.name}
            </span>
            <span className="font-mono text-xs text-transit-cyan shrink-0">
              {speed} km/h
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            {route && (
              <Badge
                className="h-4 px-1.5 text-[9px] font-bold rounded-sm border-0"
                style={{
                  background: `${route.color}25`,
                  color: route.color,
                }}
              >
                {route.name}
              </Badge>
            )}
            <StatusBadge status={bwl.bus.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Sidebar({
  open,
  onToggle,
  busLocations,
  allBusLocations,
  routes,
  routeMap,
  filterRoute,
  filterStatus,
  onFilterRoute,
  onFilterStatus,
  selectedBusId,
  onSelectBus,
  isLoading,
}: SidebarProps) {
  const activeCount = allBusLocations.filter(
    (b) => b.bus.status === BusStatus.active,
  ).length;
  const delayedCount = allBusLocations.filter(
    (b) => b.bus.status === BusStatus.delayed,
  ).length;

  return (
    <div className="relative flex shrink-0">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex h-full flex-col overflow-hidden bg-sidebar border-r border-sidebar-border"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
              <div className="flex items-center gap-2.5 mb-3">
                {/* Logo mark */}
                <div className="h-8 w-8 rounded-lg bg-transit-cyan/15 border border-transit-cyan/30 flex items-center justify-center shrink-0">
                  <Bus className="h-4 w-4 text-transit-cyan" />
                </div>
                <div>
                  <div className="font-display font-black text-base tracking-tight text-sidebar-foreground leading-none">
                    TransitTrack
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/40 font-mono mt-0.5 tracking-widest uppercase">
                    Real-time GPS
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-md bg-sidebar-accent/50 px-2 py-1.5 text-center">
                  <div className="font-mono text-sm font-bold text-sidebar-foreground">
                    {allBusLocations.length}
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/40">
                    Total
                  </div>
                </div>
                <div className="rounded-md bg-transit-green/10 border border-transit-green/20 px-2 py-1.5 text-center">
                  <div className="font-mono text-sm font-bold text-transit-green">
                    {activeCount}
                  </div>
                  <div className="text-[10px] text-transit-green/60">
                    Active
                  </div>
                </div>
                <div className="rounded-md bg-transit-amber/10 border border-transit-amber/20 px-2 py-1.5 text-center">
                  <div className="font-mono text-sm font-bold text-transit-amber">
                    {delayedCount}
                  </div>
                  <div className="text-[10px] text-transit-amber/60">
                    Delayed
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-3 py-2.5 border-b border-sidebar-border space-y-2">
              <Select value={filterRoute} onValueChange={onFilterRoute}>
                <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border">
                  <SelectValue placeholder="All routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: r.color }}
                        />
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={onFilterStatus}>
                <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={BusStatus.active}>Active</SelectItem>
                  <SelectItem value={BusStatus.delayed}>Delayed</SelectItem>
                  <SelectItem value={BusStatus.outOfService}>
                    Out of Service
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bus list */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Buses
              </span>
              <span className="font-mono text-[10px] text-sidebar-foreground/40">
                {busLocations.length}
              </span>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-2 pb-4 space-y-1">
                {isLoading && busLocations.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                    <div key={i} className="px-3 py-2.5">
                      <Skeleton className="h-10 w-full rounded-lg skeleton-shimmer bg-transparent" />
                    </div>
                  ))
                ) : busLocations.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <MapPin className="h-8 w-8 text-sidebar-foreground/20" />
                    <p className="text-xs text-sidebar-foreground/40">
                      No buses match filters
                    </p>
                  </div>
                ) : (
                  busLocations.map((bwl) => (
                    <BusCard
                      key={bwl.bus.id}
                      bwl={bwl}
                      route={routeMap[bwl.bus.routeId]}
                      isSelected={selectedBusId === bwl.bus.id}
                      onClick={() =>
                        onSelectBus(
                          selectedBusId === bwl.bus.id ? null : bwl.bus.id,
                        )
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-sidebar-border">
              <p className="text-[10px] text-sidebar-foreground/30 text-center">
                © {new Date().getFullYear()}.{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-transit-cyan transition-colors"
                >
                  Built with caffeine.ai
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shadow-lg"
      >
        {open ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
