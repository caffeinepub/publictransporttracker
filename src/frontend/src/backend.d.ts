import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ETAResult {
    nextBusId: string;
    routeId: string;
    stopName: string;
    nextBusName: string;
    estimatedMinutes: number;
}
export interface Stop {
    id: string;
    latitude: number;
    name: string;
    routeId: string;
    longitude: number;
    sequence: bigint;
}
export interface Bus {
    id: string;
    status: BusStatus;
    name: string;
    routeId: string;
    driverName: string;
}
export interface BusWithLocation {
    bus: Bus;
    location: BusLocation;
}
export interface BusLocation {
    latitude: number;
    heading: number;
    speed: number;
    longitude: number;
    timestamp: bigint;
    busId: string;
}
export interface Alert {
    id: string;
    title: string;
    active: boolean;
    routeId?: string;
    message: string;
    timestamp: bigint;
    severity: AlertSeverity;
}
export interface Route {
    id: string;
    name: string;
    color: string;
    description: string;
}
export enum AlertSeverity {
    warning = "warning",
    info = "info",
    critical = "critical"
}
export enum BusStatus {
    delayed = "delayed",
    active = "active",
    outOfService = "outOfService"
}
export interface backendInterface {
    addAlert(alert: Alert): Promise<void>;
    addBus(bus: Bus): Promise<void>;
    addRoute(route: Route): Promise<void>;
    addStop(stop: Stop): Promise<void>;
    getAlerts(): Promise<Array<Alert>>;
    getBusLocation(busId: string): Promise<BusLocation | null>;
    getBusLocations(): Promise<Array<BusWithLocation>>;
    getBuses(): Promise<Array<Bus>>;
    getETA(stopId: string): Promise<ETAResult>;
    getRoutes(): Promise<Array<Route>>;
    getStopsForRoute(routeId: string): Promise<Array<Stop>>;
    removeAlert(alertId: string): Promise<void>;
    removeBus(busId: string): Promise<void>;
    removeRoute(routeId: string): Promise<void>;
    removeStop(stopId: string): Promise<void>;
    seedSampleData(): Promise<void>;
    updateBusLocation(busId: string, lat: number, lng: number, speed: number, heading: number): Promise<void>;
    updateBusStatus(busId: string, status: BusStatus): Promise<void>;
}
