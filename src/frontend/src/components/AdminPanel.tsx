import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bell,
  Bus,
  Info,
  Loader2,
  Plus,
  Route as RouteIcon,
  Siren,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert, BusWithLocation, Route } from "../backend.d";
import { AlertSeverity } from "../backend.d";
import {
  BusStatus,
  useAddAlert,
  useAddBus,
  useAddRoute,
  useAlerts,
  useRemoveAlert,
  useRemoveBus,
  useRemoveRoute,
} from "../hooks/useQueries";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  routes: Route[];
  busLocations: BusWithLocation[];
  onSuccess: () => void;
}

function BusesTab({
  busLocations,
  routes,
  onSuccess,
}: {
  busLocations: BusWithLocation[];
  routes: Route[];
  onSuccess: () => void;
}) {
  const addBus = useAddBus();
  const removeBus = useRemoveBus();

  const [form, setForm] = useState({
    id: "",
    name: "",
    routeId: routes[0]?.id || "",
    driverName: "",
    status: BusStatus.active as BusStatus,
  });

  const handleAdd = async () => {
    if (!form.id || !form.name || !form.driverName) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await addBus.mutateAsync({
        id: form.id,
        name: form.name,
        routeId: form.routeId,
        driverName: form.driverName,
        status: form.status,
      });
      toast.success(`Bus "${form.name}" added`);
      setForm({
        id: "",
        name: "",
        routeId: routes[0]?.id || "",
        driverName: "",
        status: BusStatus.active,
      });
      onSuccess();
    } catch {
      toast.error("Failed to add bus");
    }
  };

  const handleRemove = async (busId: string, busName: string) => {
    try {
      await removeBus.mutateAsync(busId);
      toast.success(`Bus "${busName}" removed`);
      onSuccess();
    } catch {
      toast.error("Failed to remove bus");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Plus className="h-3 w-3" />
          Add New Bus
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Bus ID</Label>
            <Input
              placeholder="BUS-001"
              value={form.id}
              onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bus Name</Label>
            <Input
              placeholder="Line 15 Express"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Driver Name</Label>
            <Input
              placeholder="John Smith"
              value={form.driverName}
              onChange={(e) =>
                setForm((p) => ({ ...p, driverName: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Route</Label>
            <Select
              value={form.routeId}
              onValueChange={(v) => setForm((p) => ({ ...p, routeId: v }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
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
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Initial Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, status: v as BusStatus }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BusStatus.active}>Active</SelectItem>
                <SelectItem value={BusStatus.delayed}>Delayed</SelectItem>
                <SelectItem value={BusStatus.outOfService}>
                  Out of Service
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleAdd}
          disabled={addBus.isPending}
        >
          {addBus.isPending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-2 h-3 w-3" />
          )}
          Add Bus
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="h-[320px]">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs h-8">Bus</TableHead>
              <TableHead className="text-xs h-8">Route</TableHead>
              <TableHead className="text-xs h-8">Driver</TableHead>
              <TableHead className="text-xs h-8">Status</TableHead>
              <TableHead className="text-xs h-8 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {busLocations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground py-8"
                >
                  No buses registered
                </TableCell>
              </TableRow>
            ) : (
              busLocations.map((bwl) => (
                <TableRow key={bwl.bus.id} className="border-border">
                  <TableCell className="text-xs font-medium py-2">
                    {bwl.bus.name}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground">
                    {bwl.bus.routeId}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground">
                    {bwl.bus.driverName}
                  </TableCell>
                  <TableCell className="text-xs py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        bwl.bus.status === BusStatus.active
                          ? "bg-transit-green/15 text-transit-green"
                          : bwl.bus.status === BusStatus.delayed
                            ? "bg-transit-amber/15 text-transit-amber"
                            : "bg-transit-red/15 text-transit-red"
                      }`}
                    >
                      {bwl.bus.status === BusStatus.active
                        ? "Active"
                        : bwl.bus.status === BusStatus.delayed
                          ? "Delayed"
                          : "Out of Svc"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(bwl.bus.id, bwl.bus.name)}
                      disabled={removeBus.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function RoutesTab({
  routes,
  onSuccess,
}: {
  routes: Route[];
  onSuccess: () => void;
}) {
  const addRoute = useAddRoute();
  const removeRoute = useRemoveRoute();

  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    color: "#06b6d4",
  });

  const handleAdd = async () => {
    if (!form.id || !form.name) {
      toast.error("Please fill in ID and name");
      return;
    }
    try {
      await addRoute.mutateAsync({
        id: form.id,
        name: form.name,
        description: form.description,
        color: form.color,
      });
      toast.success(`Route "${form.name}" added`);
      setForm({ id: "", name: "", description: "", color: "#06b6d4" });
      onSuccess();
    } catch {
      toast.error("Failed to add route");
    }
  };

  const handleRemove = async (routeId: string, routeName: string) => {
    try {
      await removeRoute.mutateAsync(routeId);
      toast.success(`Route "${routeName}" removed`);
      onSuccess();
    } catch {
      toast.error("Failed to remove route");
    }
  };

  const PRESET_COLORS = [
    "#06b6d4",
    "#22c55e",
    "#eab308",
    "#ef4444",
    "#a855f7",
    "#3b82f6",
    "#f97316",
    "#ec4899",
  ];

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Plus className="h-3 w-3" />
          Add New Route
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Route ID</Label>
            <Input
              placeholder="route-5"
              value={form.id}
              onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Route Name</Label>
            <Input
              placeholder="City Express"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Description</Label>
            <Input
              placeholder="Route description..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`h-6 w-6 rounded-md ring-offset-background transition-all ${
                      form.color === c
                        ? "ring-2 ring-ring ring-offset-2"
                        : "hover:scale-110"
                    }`}
                    style={{ background: c }}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                  />
                ))}
              </div>
              <input
                type="color"
                value={form.color}
                onChange={(e) =>
                  setForm((p) => ({ ...p, color: e.target.value }))
                }
                className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleAdd}
          disabled={addRoute.isPending}
        >
          {addRoute.isPending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-2 h-3 w-3" />
          )}
          Add Route
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="h-[320px]">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs h-8 w-8">Color</TableHead>
              <TableHead className="text-xs h-8">Name</TableHead>
              <TableHead className="text-xs h-8">Description</TableHead>
              <TableHead className="text-xs h-8 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground py-8"
                >
                  No routes registered
                </TableCell>
              </TableRow>
            ) : (
              routes.map((r) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="py-2">
                    <div
                      className="h-4 w-4 rounded-sm"
                      style={{ background: r.color }}
                    />
                  </TableCell>
                  <TableCell className="text-xs font-medium py-2">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground truncate max-w-[140px]">
                    {r.description || "—"}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(r.id, r.name)}
                      disabled={removeRoute.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function severityIcon(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.critical:
      return <Siren className="h-3 w-3 text-transit-red" />;
    case AlertSeverity.warning:
      return <AlertTriangle className="h-3 w-3 text-transit-amber" />;
    default:
      return <Info className="h-3 w-3 text-transit-cyan" />;
  }
}

function severityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.critical:
      return "Critical";
    case AlertSeverity.warning:
      return "Warning";
    default:
      return "Info";
  }
}

function severityBadgeClass(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.critical:
      return "bg-transit-red/15 text-transit-red border-transit-red/30";
    case AlertSeverity.warning:
      return "bg-transit-amber/15 text-transit-amber border-transit-amber/30";
    default:
      return "bg-transit-cyan/15 text-transit-cyan border-transit-cyan/30";
  }
}

function AlertsTab({ routes }: { routes: Route[] }) {
  const { data: alerts = [], isLoading } = useAlerts();
  const addAlert = useAddAlert();
  const removeAlert = useRemoveAlert();

  const [form, setForm] = useState({
    title: "",
    message: "",
    severity: AlertSeverity.info as AlertSeverity,
    routeId: "",
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Please fill in title and message");
      return;
    }
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      title: form.title.trim(),
      message: form.message.trim(),
      severity: form.severity,
      routeId: form.routeId || undefined,
      timestamp: now,
      active: true,
    };
    try {
      await addAlert.mutateAsync(alert);
      toast.success("Alert posted");
      setForm({
        title: "",
        message: "",
        severity: AlertSeverity.info,
        routeId: "",
      });
    } catch {
      toast.error("Failed to post alert");
    }
  };

  const handleRemove = async (alertId: string) => {
    try {
      await removeAlert.mutateAsync(alertId);
      toast.success("Alert removed");
    } catch {
      toast.error("Failed to remove alert");
    }
  };

  const activeAlerts = alerts.filter((a) => a.active);

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Plus className="h-3 w-3" />
          Post New Alert
        </h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder="Service disruption on Route 4"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              placeholder="Describe the alert..."
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              className="text-xs resize-none h-16"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, severity: v as AlertSeverity }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AlertSeverity.info}>
                    <div className="flex items-center gap-2">
                      <Info className="h-3 w-3 text-transit-cyan" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value={AlertSeverity.warning}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-transit-amber" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value={AlertSeverity.critical}>
                    <div className="flex items-center gap-2">
                      <Siren className="h-3 w-3 text-transit-red" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Route (optional)</Label>
              <Select
                value={form.routeId || "none"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, routeId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Routes</SelectItem>
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
            </div>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleAdd}
          disabled={addAlert.isPending}
        >
          {addAlert.isPending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <Bell className="mr-2 h-3 w-3" />
          )}
          Post Alert
        </Button>
      </div>

      {/* Alerts list */}
      <ScrollArea className="h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {activeAlerts.map((alert) => {
              const route = alert.routeId
                ? routes.find((r) => r.id === alert.routeId)
                : undefined;
              return (
                <div
                  key={alert.id}
                  className="rounded-lg border border-border bg-card/50 px-3 py-2.5 flex items-start gap-2.5"
                >
                  {severityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">
                        {alert.title}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${severityBadgeClass(alert.severity)}`}
                      >
                        {severityLabel(alert.severity)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {alert.message}
                    </p>
                    {route && (
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: route.color }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {route.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(alert.id)}
                    disabled={removeAlert.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default function AdminPanel({
  open,
  onClose,
  routes,
  busLocations,
  onSuccess,
}: AdminPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[520px] sm:max-w-[520px] bg-background border-border p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle className="font-display font-black text-lg flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-transit-cyan/15 border border-transit-cyan/30 flex items-center justify-center">
              <Bus className="h-3.5 w-3.5 text-transit-cyan" />
            </div>
            Admin Panel
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Manage fleet buses and routes
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden px-5 py-4">
          <Tabs defaultValue="buses">
            <TabsList className="grid w-full grid-cols-3 h-9 mb-4">
              <TabsTrigger
                value="buses"
                className="text-xs flex items-center gap-1.5"
              >
                <Bus className="h-3 w-3" />
                Buses ({busLocations.length})
              </TabsTrigger>
              <TabsTrigger
                value="routes"
                className="text-xs flex items-center gap-1.5"
              >
                <RouteIcon className="h-3 w-3" />
                Routes ({routes.length})
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="text-xs flex items-center gap-1.5"
              >
                <Bell className="h-3 w-3" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buses">
              <BusesTab
                busLocations={busLocations}
                routes={routes}
                onSuccess={onSuccess}
              />
            </TabsContent>

            <TabsContent value="routes">
              <RoutesTab routes={routes} onSuccess={onSuccess} />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsTab routes={routes} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
