import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Bus,
  Clock,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Siren,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Alert, Route, Stop } from "../backend.d";
import { AlertSeverity } from "../backend.d";
import { useAlerts, useETA } from "../hooks/useQueries";

// ── Alert banner ────────────────────────────────────────────────────────────

function severityIcon(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.critical:
      return <Siren className="h-3.5 w-3.5 shrink-0" />;
    case AlertSeverity.warning:
      return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <Info className="h-3.5 w-3.5 shrink-0" />;
  }
}

function severityStyles(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.critical:
      return "bg-transit-red/10 border-transit-red/30 text-transit-red";
    case AlertSeverity.warning:
      return "bg-transit-amber/10 border-transit-amber/30 text-transit-amber";
    default:
      return "bg-transit-cyan/10 border-transit-cyan/30 text-transit-cyan";
  }
}

function AlertBanner({
  alert,
  routeMap,
}: { alert: Alert; routeMap: Record<string, Route> }) {
  const route = alert.routeId ? routeMap[alert.routeId] : undefined;
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${severityStyles(alert.severity)}`}
    >
      {severityIcon(alert.severity)}
      <div className="flex-1 min-w-0">
        <div className="font-semibold leading-tight">{alert.title}</div>
        <div className="mt-0.5 opacity-80 leading-snug">{alert.message}</div>
        {route && (
          <div className="mt-1 flex items-center gap-1 opacity-70">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: route.color }}
            />
            <span className="text-[10px] font-medium">{route.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ETA card ────────────────────────────────────────────────────────────────

function ETACard({
  stopId,
  stopName,
  routeColor,
  onClear,
}: {
  stopId: string;
  stopName: string;
  routeColor: string;
  onClear: () => void;
}) {
  const { data: eta, isLoading, isError, refetch, isFetching } = useETA(stopId);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: routeColor }}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {stopName}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Auto-refreshes every 30s
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-transit-cyan"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg skeleton-shimmer bg-transparent" />
            <Skeleton className="h-6 w-2/3 rounded skeleton-shimmer bg-transparent" />
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-3 text-xs text-destructive">
            Could not load ETA. Please try again.
          </div>
        ) : eta ? (
          <div className="space-y-3">
            {/* Big ETA display */}
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Next bus arriving</span>
                </div>
                <div className="font-mono text-2xl font-black text-transit-cyan leading-none">
                  {eta.estimatedMinutes}
                  <span className="text-sm font-medium text-muted-foreground ml-1">
                    min
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-foreground">
                  {eta.nextBusName}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Bus ID: {eta.nextBusId}
                </div>
              </div>
            </div>

            {/* Route info */}
            <div className="flex items-center gap-2 px-1">
              <Bus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Route:</span>
              <span className="text-xs font-medium text-foreground truncate">
                {eta.routeId}
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Stop search ─────────────────────────────────────────────────────────────

function StopSearchResult({
  stop,
  route,
  onClick,
}: {
  stop: Stop;
  route: Route | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: `${route?.color || "#06b6d4"}20`,
            border: `1px solid ${route?.color || "#06b6d4"}40`,
          }}
        >
          <MapPin
            className="h-3 w-3"
            style={{ color: route?.color || "#06b6d4" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {stop.name}
          </div>
          {route && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: route.color }}
              />
              <span className="text-[10px] text-muted-foreground truncate">
                {route.name}
              </span>
            </div>
          )}
        </div>
        <Badge
          className="h-4 px-1.5 text-[9px] font-bold rounded-sm border-0 shrink-0"
          style={{
            background: `${route?.color || "#06b6d4"}20`,
            color: route?.color || "#06b6d4",
          }}
        >
          Stop #{Number(stop.sequence) + 1}
        </Badge>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface PassengerViewProps {
  stops: Stop[];
  routeMap: Record<string, Route>;
  stopsLoading: boolean;
}

export default function PassengerView({
  stops,
  routeMap,
  stopsLoading,
}: PassengerViewProps) {
  const [query, setQuery] = useState("");
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const activeAlerts = alerts.filter((a) => a.active);

  const filteredStops = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return stops.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [stops, query]);

  const handleSelectStop = (stop: Stop) => {
    setSelectedStop(stop);
    setQuery(stop.name);
  };

  const handleClearStop = () => {
    setSelectedStop(null);
    setQuery("");
  };

  const selectedRoute = selectedStop
    ? routeMap[selectedStop.routeId]
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Active alerts banner */}
          {alertsLoading ? (
            <Skeleton className="h-12 w-full rounded-lg skeleton-shimmer bg-transparent" />
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Siren className="h-3 w-3" />
                Service Alerts ({activeAlerts.length})
              </div>
              {activeAlerts.map((alert) => (
                <AlertBanner key={alert.id} alert={alert} routeMap={routeMap} />
              ))}
            </div>
          ) : null}

          {/* Stop search */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Find a Bus Stop
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search stop name..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selectedStop && e.target.value !== selectedStop.name) {
                    setSelectedStop(null);
                  }
                }}
                className="pl-9 pr-8 h-9 text-sm bg-muted/30"
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setQuery("");
                    setSelectedStop(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search results */}
            {!selectedStop && filteredStops.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-1 space-y-0.5">
                {filteredStops.map((stop) => (
                  <StopSearchResult
                    key={stop.id}
                    stop={stop}
                    route={routeMap[stop.routeId]}
                    onClick={() => handleSelectStop(stop)}
                  />
                ))}
              </div>
            )}

            {!selectedStop &&
              query.trim().length > 1 &&
              filteredStops.length === 0 &&
              !stopsLoading && (
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-5 text-center">
                  <MapPin className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No stops found for "{query}"
                  </p>
                </div>
              )}
          </div>

          {/* ETA card */}
          {selectedStop && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Next Arrival
              </div>
              <ETACard
                stopId={selectedStop.id}
                stopName={selectedStop.name}
                routeColor={selectedRoute?.color || "#06b6d4"}
                onClear={handleClearStop}
              />
            </div>
          )}

          {/* Empty state when no query */}
          {!query && !selectedStop && activeAlerts.length === 0 && (
            <div className="rounded-xl border border-border bg-muted/10 px-6 py-10 text-center space-y-2.5">
              <div className="h-12 w-12 rounded-full bg-transit-cyan/10 border border-transit-cyan/20 flex items-center justify-center mx-auto">
                <Search className="h-5 w-5 text-transit-cyan" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Find your next bus
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Search for a stop name above to see real-time arrival estimates.
                Service alerts will appear here if any routes are affected.
              </p>
            </div>
          )}

          {/* Route legend */}
          {Object.keys(routeMap).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Active Routes
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.values(routeMap).map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ background: route.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate flex-1">
                      {route.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {stops.filter((s) => s.routeId === route.id).length} stops
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
