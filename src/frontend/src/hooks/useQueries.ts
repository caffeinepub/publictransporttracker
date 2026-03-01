import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Alert,
  Bus,
  BusWithLocation,
  ETAResult,
  Route,
  Stop,
} from "../backend.d";
import { AlertSeverity, BusStatus } from "../backend.d";
import { useActor } from "./useActor";

export function useSeedSampleData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.seedSampleData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busLocations"] });
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useBusLocations() {
  const { actor, isFetching } = useActor();
  return useQuery<BusWithLocation[]>({
    queryKey: ["busLocations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBusLocations();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useBuses() {
  const { actor, isFetching } = useActor();
  return useQuery<Bus[]>({
    queryKey: ["buses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBuses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRoutes() {
  const { actor, isFetching } = useActor();
  return useQuery<Route[]>({
    queryKey: ["routes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoutes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bus: Bus) => {
      if (!actor) throw new Error("No actor");
      await actor.addBus(bus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["busLocations"] });
    },
  });
}

export function useRemoveBus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (busId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.removeBus(busId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["busLocations"] });
    },
  });
}

export function useAddRoute() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (route: Route) => {
      if (!actor) throw new Error("No actor");
      await actor.addRoute(route);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useRemoveRoute() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routeId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.removeRoute(routeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useUpdateBusLocation() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      busId,
      lat,
      lng,
      speed,
      heading,
    }: {
      busId: string;
      lat: number;
      lng: number;
      speed: number;
      heading: number;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateBusLocation(busId, lat, lng, speed, heading);
    },
  });
}

export function useUpdateBusStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      busId,
      status,
    }: {
      busId: string;
      status: BusStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateBusStatus(busId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["busLocations"] });
    },
  });
}

export function useAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAddAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alert: Alert) => {
      if (!actor) throw new Error("No actor");
      await actor.addAlert(alert);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useRemoveAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.removeAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useStopsForRoute(routeId: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<Stop[]>({
    queryKey: ["stops", routeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStopsForRoute(routeId);
    },
    enabled: !!actor && !isFetching && !!routeId && enabled,
    staleTime: 60_000,
  });
}

export function useAllStops(routeIds: string[], enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<Stop[]>({
    queryKey: ["allStops", routeIds.join(",")],
    queryFn: async () => {
      if (!actor) return [];
      const results = await Promise.all(
        routeIds.map((id) => actor.getStopsForRoute(id)),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && routeIds.length > 0 && enabled,
    staleTime: 60_000,
  });
}

export function useETA(stopId: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<ETAResult>({
    queryKey: ["eta", stopId],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getETA(stopId);
    },
    enabled: !!actor && !isFetching && !!stopId && enabled,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export { AlertSeverity, BusStatus };
