import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Bus, Map as MapIcon, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BusStatus } from "./backend.d";
import type { BusWithLocation, Route } from "./backend.d";
import AdminPanel from "./components/AdminPanel";
import MapView from "./components/MapView";
import PassengerView from "./components/PassengerView";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { useActor } from "./hooks/useActor";
import {
  useAllStops,
  useBusLocations,
  useRoutes,
  useSeedSampleData,
  useUpdateBusLocation,
} from "./hooks/useQueries";

export default function App() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const seedMutation = useSeedSampleData();
  const { data: busLocations = [], isLoading: busLoading } = useBusLocations();
  const { data: routes = [], isLoading: routesLoading } = useRoutes();
  const updateLocationMutation = useUpdateBusLocation();

  const [seeded, setSeeded] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [filterRoute, setFilterRoute] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [currentLocations, setCurrentLocations] = useState<
    Record<string, { lat: number; lng: number; heading: number }>
  >({});

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seedMutateRef = useRef(seedMutation.mutate);
  seedMutateRef.current = seedMutation.mutate;

  // Load stops once seeded
  const routeIds = routes.map((r) => r.id);
  const { data: stops = [], isLoading: stopsLoading } = useAllStops(
    routeIds,
    seeded && routeIds.length > 0,
  );

  // Seed data on first load
  useEffect(() => {
    if (actor && !seeded) {
      seedMutateRef.current(undefined, {
        onSuccess: () => {
          setSeeded(true);
        },
        onError: () => {
          setSeeded(true); // proceed anyway
        },
      });
    }
  }, [actor, seeded]);

  // Update local location state when data arrives
  useEffect(() => {
    if (busLocations.length > 0) {
      setCurrentLocations((prev) => {
        const next = { ...prev };
        for (const bwl of busLocations) {
          if (!next[bwl.bus.id]) {
            next[bwl.bus.id] = {
              lat: bwl.location.latitude,
              lng: bwl.location.longitude,
              heading: bwl.location.heading,
            };
          }
        }
        return next;
      });
    }
  }, [busLocations]);

  const doRefresh = useCallback(async () => {
    if (!actor || isRefreshing) return;
    setIsRefreshing(true);

    try {
      // Simulate movement for active buses
      const activeBuses = busLocations.filter(
        (bwl) => bwl.bus.status === BusStatus.active,
      );

      const movePromises = activeBuses.map(async (bwl) => {
        const current = currentLocations[bwl.bus.id] || {
          lat: bwl.location.latitude,
          lng: bwl.location.longitude,
          heading: bwl.location.heading,
        };

        const deltaLat = (Math.random() - 0.5) * 0.002;
        const deltaLng = (Math.random() - 0.5) * 0.002;
        const newLat = current.lat + deltaLat;
        const newLng = current.lng + deltaLng;
        const newSpeed = 20 + Math.random() * 40;
        const headingDelta = (Math.random() - 0.5) * 30;
        const newHeading =
          (((current.heading + headingDelta) % 360) + 360) % 360;

        setCurrentLocations((prev) => ({
          ...prev,
          [bwl.bus.id]: { lat: newLat, lng: newLng, heading: newHeading },
        }));

        return updateLocationMutation.mutateAsync({
          busId: bwl.bus.id,
          lat: newLat,
          lng: newLng,
          speed: newSpeed,
          heading: newHeading,
        });
      });

      await Promise.allSettled(movePromises);

      // Refetch data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["busLocations"] }),
        queryClient.invalidateQueries({ queryKey: ["routes"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["busLocations"] }),
        queryClient.refetchQueries({ queryKey: ["routes"] }),
      ]);

      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [
    actor,
    busLocations,
    currentLocations,
    isRefreshing,
    queryClient,
    updateLocationMutation,
  ]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!actor || !seeded) return;

    autoRefreshRef.current = setInterval(() => {
      doRefresh();
    }, 5000);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [actor, seeded, doRefresh]);

  const handleManualRefresh = () => {
    doRefresh();
  };

  const routeMap = routes.reduce<Record<string, Route>>((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {});

  const filteredBuses = busLocations.filter((bwl) => {
    if (filterRoute !== "all" && bwl.bus.routeId !== filterRoute) return false;
    if (filterStatus !== "all" && bwl.bus.status !== filterStatus) return false;
    return true;
  });

  const isLoading = busLoading || routesLoading || seedMutation.isPending;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <Toaster theme="dark" position="bottom-right" />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        busLocations={filteredBuses}
        allBusLocations={busLocations}
        routes={routes}
        routeMap={routeMap}
        filterRoute={filterRoute}
        filterStatus={filterStatus}
        onFilterRoute={setFilterRoute}
        onFilterStatus={setFilterStatus}
        selectedBusId={selectedBusId}
        onSelectBus={setSelectedBusId}
        isLoading={isLoading}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onRefresh={handleManualRefresh}
          onAdminOpen={() => setAdminOpen(true)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          activeBusCount={
            busLocations.filter((b) => b.bus.status === BusStatus.active).length
          }
          totalBusCount={busLocations.length}
        />

        {/* Tab navigation */}
        <div className="shrink-0 border-b border-border bg-card/60 backdrop-blur px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9 bg-transparent gap-0 p-0 rounded-none">
              <TabsTrigger
                value="map"
                className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-transit-cyan data-[state=active]:bg-transparent data-[state=active]:text-transit-cyan text-xs font-medium flex items-center gap-1.5 px-4"
              >
                <MapIcon className="h-3.5 w-3.5" />
                Live Map
              </TabsTrigger>
              <TabsTrigger
                value="passenger"
                className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-transit-cyan data-[state=active]:bg-transparent data-[state=active]:text-transit-cyan text-xs font-medium flex items-center gap-1.5 px-4"
              >
                <Users className="h-3.5 w-3.5" />
                Passenger
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content area */}
        <div className="relative flex-1 overflow-hidden">
          {isLoading && busLocations.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-transit-cyan/20 border-t-transit-cyan animate-spin" />
                <p className="font-mono text-sm text-muted-foreground">
                  Initializing GPS network...
                </p>
              </div>
            </div>
          ) : null}

          {/* Map view (always rendered, hidden when passenger tab) */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              activeTab === "map"
                ? "opacity-100 pointer-events-auto z-10"
                : "opacity-0 pointer-events-none z-0"
            }`}
          >
            <MapView
              busLocations={filteredBuses}
              routeMap={routeMap}
              selectedBusId={selectedBusId}
              onSelectBus={setSelectedBusId}
              currentLocations={currentLocations}
              stops={stops}
            />
          </div>

          {/* Passenger view */}
          {activeTab === "passenger" && (
            <div className="absolute inset-0 z-10 overflow-hidden">
              <PassengerView
                stops={stops}
                routeMap={routeMap}
                stopsLoading={stopsLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Admin Panel */}
      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        routes={routes}
        busLocations={busLocations}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["buses"] });
          queryClient.invalidateQueries({ queryKey: ["routes"] });
          queryClient.invalidateQueries({ queryKey: ["busLocations"] });
        }}
      />
    </div>
  );
}
