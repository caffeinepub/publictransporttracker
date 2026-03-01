import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Route = {
    id : Text;
    name : Text;
    description : Text;
    color : Text;
  };

  type BusStatus = {
    #active;
    #delayed;
    #outOfService;
  };

  type Bus = {
    id : Text;
    name : Text;
    routeId : Text;
    driverName : Text;
    status : BusStatus;
  };

  type BusLocation = {
    busId : Text;
    latitude : Float;
    longitude : Float;
    speed : Float;
    heading : Float;
    timestamp : Int;
  };

  type BusWithLocation = {
    bus : Bus;
    location : BusLocation;
  };

  type Stop = {
    id : Text;
    name : Text;
    routeId : Text;
    latitude : Float;
    longitude : Float;
    sequence : Nat;
  };

  type AlertSeverity = {
    #info;
    #warning;
    #critical;
  };

  type Alert = {
    id : Text;
    title : Text;
    message : Text;
    severity : AlertSeverity;
    routeId : ?Text;
    timestamp : Int;
    active : Bool;
  };

  type ETAResult = { stopName : Text; routeId : Text; nextBusId : Text; nextBusName : Text; estimatedMinutes : Float };

  let routes = Map.empty<Text, Route>();
  let buses = Map.empty<Text, Bus>();
  let busLocations = Map.empty<Text, BusLocation>();
  let stops = Map.empty<Text, Stop>();
  let alerts = Map.empty<Text, Alert>();

  let avgBusSpeed = 30.0; // km/h

  public shared ({ caller }) func addRoute(route : Route) : async () {
    if (routes.containsKey(route.id)) {
      Runtime.trap("Route ID already exists");
    };
    routes.add(route.id, route);
  };

  public query ({ caller }) func getRoutes() : async [Route] {
    routes.values().toArray();
  };

  public shared ({ caller }) func addBus(bus : Bus) : async () {
    if (buses.containsKey(bus.id)) {
      Runtime.trap("Bus ID already exists");
    };
    if (not routes.containsKey(bus.routeId)) {
      Runtime.trap("Route does not exist");
    };
    buses.add(bus.id, bus);
  };

  public query ({ caller }) func getBuses() : async [Bus] {
    buses.values().toArray();
  };

  public shared ({ caller }) func updateBusLocation(busId : Text, lat : Float, lng : Float, speed : Float, heading : Float) : async () {
    switch (buses.get(busId)) {
      case (null) { Runtime.trap("Bus does not exist") };
      case (?_) {
        let location : BusLocation = {
          busId;
          latitude = lat;
          longitude = lng;
          speed;
          heading;
          timestamp = Time.now();
        };
        busLocations.add(busId, location);
      };
    };
  };

  public query ({ caller }) func getBusLocations() : async [BusWithLocation] {
    let results = List.empty<BusWithLocation>();

    buses.keys().forEach(
      func(busId) {
        switch (buses.get(busId), busLocations.get(busId)) {
          case (?bus, ?location) {
            results.add({
              bus;
              location;
            });
          };
          case (_) {}; // Ignore buses without locations
        };
      }
    );
    results.toArray();
  };

  public query ({ caller }) func getBusLocation(busId : Text) : async ?BusLocation {
    busLocations.get(busId);
  };

  public shared ({ caller }) func updateBusStatus(busId : Text, status : BusStatus) : async () {
    switch (buses.get(busId)) {
      case (null) { Runtime.trap("Bus does not exist") };
      case (?bus) {
        let updatedBus = {
          id = bus.id;
          name = bus.name;
          routeId = bus.routeId;
          driverName = bus.driverName;
          status;
        };
        buses.add(busId, updatedBus);
      };
    };
  };

  public shared ({ caller }) func removeBus(busId : Text) : async () {
    if (not buses.containsKey(busId)) {
      Runtime.trap("Bus does not exist");
    };
    buses.remove(busId);
    busLocations.remove(busId);
  };

  public shared ({ caller }) func removeRoute(routeId : Text) : async () {
    if (not routes.containsKey(routeId)) {
      Runtime.trap("Route does not exist");
    };
    routes.remove(routeId);

    let busesToRemove = List.empty<Text>();
    buses.keys().forEach(
      func(busId) {
        switch (buses.get(busId)) {
          case (?bus) {
            if (bus.routeId == routeId) {
              busesToRemove.add(busId);
            };
          };
          case (null) {};
        };
      }
    );

    let busIds = busesToRemove.values();
    for (busId in busIds) {
      buses.remove(busId);
      busLocations.remove(busId);
    };
  };

  public shared ({ caller }) func addStop(stop : Stop) : async () {
    if (stops.containsKey(stop.id)) {
      Runtime.trap("Stop ID already exists");
    };
    if (not routes.containsKey(stop.routeId)) {
      Runtime.trap("Route does not exist");
    };
    stops.add(stop.id, stop);
  };

  public query ({ caller }) func getStopsForRoute(routeId : Text) : async [Stop] {
    stops.values().toArray().filter(func(s) { s.routeId == routeId });
  };

  public shared ({ caller }) func removeStop(stopId : Text) : async () {
    if (not stops.containsKey(stopId)) {
      Runtime.trap("Stop does not exist");
    };
    stops.remove(stopId);
  };

  public shared ({ caller }) func addAlert(alert : Alert) : async () {
    alerts.add(alert.id, alert);
  };

  public query ({ caller }) func getAlerts() : async [Alert] {
    let activeAlerts = List.empty<Alert>();
    alerts.keys().forEach(
      func(alertId) {
        switch (alerts.get(alertId)) {
          case (?a) {
            if (a.active) {
              activeAlerts.add(a);
            };
          };
          case (null) {};
        };
      }
    );
    activeAlerts.toArray();
  };

  public shared ({ caller }) func removeAlert(alertId : Text) : async () {
    switch (alerts.get(alertId)) {
      case (null) { Runtime.trap("Alert does not exist") };
      case (?alert) {
        let updatedAlert = {
          id = alert.id;
          title = alert.title;
          message = alert.message;
          severity = alert.severity;
          routeId = alert.routeId;
          timestamp = alert.timestamp;
          active = false;
        };
        alerts.add(alertId, updatedAlert);
      };
    };
  };

  func haversine(lat1 : Float, lon1 : Float, lat2 : Float, lon2 : Float) : Float {
    let dLat = (lat2 - lat1) * 0.0174533; // Convert to radians
    let dLon = (lon2 - lon1) * 0.0174533;

    let a = (Float.pow(Float.sin(dLat / 2), 2)) + Float.cos(lat1 * 0.0174533) * Float.cos(lat2 * 0.0174533) * Float.pow(Float.sin(dLon / 2), 2);
    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1 - a));
    6371.0 * c; // Earth's radius in km
  };

  public query func getETA(stopId : Text) : async ETAResult {
    switch (stops.get(stopId)) {
      case (null) { Runtime.trap("Stop does not exist") };
      case (?stop) {
        let availableBuses = List.empty<Bus>();

        buses.values().toArray().forEach(
          func(bus) {
            if (bus.routeId == stop.routeId and bus.status == #active) {
              availableBuses.add(bus);
            };
          }
        );

        if (availableBuses.isEmpty()) {
          Runtime.trap("No active buses found for this route");
        };

        let activeBuses = availableBuses.values().toArray();

        var closestBus : ?Bus = null;
        var minEta = 1000000.0;

        for (bus in activeBuses.values()) {
          switch (busLocations.get(bus.id)) {
            case (null) {};
            case (?location) {
              let distance = haversine(location.latitude, location.longitude, stop.latitude, stop.longitude);
              let speed = if (location.speed > 0.0) { location.speed } else {
                avgBusSpeed;
              };
              let eta = (distance / speed) * 60.0; // minutes
              if (eta < minEta) {
                minEta := eta;
                closestBus := ?bus;
              };
            };
          };
        };

        switch (closestBus) {
          case (?bus) {
            return {
              stopName = stop.name;
              routeId = stop.routeId;
              nextBusId = bus.id;
              nextBusName = bus.name;
              estimatedMinutes = minEta;
            };
          };
          case (null) {
            Runtime.trap("No location data available for this stop/route combination");
          };
        };
      };
    };
  };

  public shared ({ caller }) func seedSampleData() : async () {
    routes.clear();
    buses.clear();
    busLocations.clear();
    stops.clear();
    alerts.clear();

    // Sample Routes
    routes.add(
      "r1",
      {
        id = "r1";
        name = "Route 1 - Town Bus Stand to Ukkadam";
        description = "Town Bus Stand to Ukkadam via Gandhipuram";
        color = "#E84118";
      },
    );
    routes.add(
      "r2",
      {
        id = "r2";
        name = "Route 2 - RS Puram to Peelamedu";
        description = "RS Puram to Peelamedu via Avinashi Road";
        color = "#0097E6";
      },
    );
    routes.add(
      "r3",
      {
        id = "r3";
        name = "Route 3 - Singanallur to Gandhipuram";
        description = "Singanallur to Gandhipuram via Mettupalayam Road";
        color = "#44BD32";
      },
    );
    routes.add(
      "r4",
      {
        id = "r4";
        name = "Route 4 - Saravanampatti to Gandhipuram";
        description = "Saravanampatti to Gandhipuram";
        color = "#FBC531";
      },
    );
    routes.add(
      "r5",
      {
        id = "r5";
        name = "Route 5 - Vadavalli to Town Bus Stand";
        description = "Vadavalli to Town Bus Stand";
        color = "#8C7AE6";
      },
    );
    routes.add(
      "r6",
      {
        id = "r6";
        name = "Route 6 - Kuniyamuthur to Peelamedu";
        description = "Kuniyamuthur to Peelamedu";
        color = "#487EB0";
      },
    );
    routes.add(
      "r7",
      {
        id = "r7";
        name = "Route 7 - Kovaipudur to RS Puram";
        description = "Kovaipudur to RS Puram";
        color = "#E17055";
      },
    );
    routes.add(
      "r8",
      {
        id = "r8";
        name = "Route 8 - Hopes College to Singanallur";
        description = "Hopes College to Singanallur";
        color = "#70A1FF";
      },
    );
    routes.add(
      "r9",
      {
        id = "r9";
        name = "Route 9 - Ganapathy to Ukkadam";
        description = "Ganapathy to Ukkadam";
        color = "#2ED573";
      },
    );
    routes.add(
      "r10",
      {
        id = "r10";
        name = "Route 10 - Podanur to Thudiyalur";
        description = "Podanur to Thudiyalur";
        color = "#FFFA65";
      },
    );

    // Sample Buses
    func addBusWithLocation(
      id : Text,
      name : Text,
      routeId : Text,
      driverName : Text,
      status : BusStatus,
      lat : Float,
      lng : Float,
      speed : Float,
      heading : Float,
    ) {
      buses.add(
        id,
        {
          id;
          name;
          routeId;
          driverName;
          status;
        },
      );

      busLocations.add(
        id,
        {
          busId = id;
          latitude = lat;
          longitude = lng;
          speed;
          heading;
          timestamp = Time.now();
        },
      );
    };

    addBusWithLocation("b1", "CBE-101", "r1", "Murugan K", #active, 11.0168, 76.9558, 35.0, 90.0);
    addBusWithLocation("b2", "CBE-202", "r1", "Rajan S", #active, 11.0204, 76.9633, 28.0, 270.0);
    addBusWithLocation("b3", "CBE-303", "r2", "Selvam P", #delayed, 11.0050, 76.9542, 15.0, 45.0);
    addBusWithLocation("b4", "CBE-404", "r2", "Arjun V", #active, 11.0270, 76.9850, 42.0, 60.0);
    addBusWithLocation("b5", "CBE-505", "r3", "Prakash R", #active, 10.9985, 77.0102, 38.0, 315.0);
    addBusWithLocation("b6", "CBE-606", "r3", "Senthil M", #outOfService, 11.0380, 76.9715, 0.0, 180.0);
    addBusWithLocation("b7", "CBE-707", "r4", "Lakshmi R", #active, 11.0480, 76.9950, 32.0, 200.0);
    addBusWithLocation("b8", "CBE-808", "r5", "Kumar A", #active, 10.9775, 76.9442, 38.0, 160.0);
    addBusWithLocation("b9", "CBE-909", "r6", "Mani V", #active, 10.9667, 76.9833, 36.0, 120.0);
    addBusWithLocation("b10", "CBE-010", "r7", "Ravi G", #active, 10.9950, 76.9450, 40.0, 140.0);

    // Sample Stops
    func addStops(routeId : Text, stopsArray : [(Text, Text, Float, Float)]) {
      var i = 0;
      for (stop in stopsArray.values()) {
        let (name, _, lat, lng) = stop;
        stops.add(
          name,
          {
            id = name;
            name = name;
            routeId;
            latitude = lat;
            longitude = lng;
            sequence = i;
          },
        );
        i += 1;
      };
    };

    addStops(
      "r1",
      [
        ("Ukkadam", "Morning", 11.0061, 76.9567),
        ("Town Bus Stand", "Morning", 11.0197, 76.9742),
        ("Gandhipuram", "Morning", 11.0183, 76.9800),
        ("Singanallur", "Morning", 11.0058, 76.9892),
      ],
    );

    addStops(
      "r2",
      [
        ("RS Puram", "Morning", 11.0143, 76.9632),
        ("Peelamedu", "Morning", 11.0291, 76.9825),
        ("Saravanampatti", "Morning", 11.0582, 77.0046),
        ("Hopes College", "Morning", 11.0195, 76.9904),
      ],
    );

    // Sample Alerts
    alerts.add(
      "a1",
      {
        id = "a1";
        title = "Traffic Jam";
        message = "Heavy traffic reported near Gandhipuram.";
        severity = #warning;
        routeId = ?("r1");
        timestamp = Time.now();
        active = true;
      },
    );
    alerts.add(
      "a2",
      {
        id = "a2";
        title = "Service Delay";
        message = "Delay on route 5 - Vadavalli to Town Bus Stand.";
        severity = #info;
        routeId = ?("r5");
        timestamp = Time.now();
        active = true;
      },
    );
    alerts.add(
      "a3",
      {
        id = "a3";
        title = "Road Closure";
        message = "Peelamedu road closed due to construction.";
        severity = #critical;
        routeId = ?("r2");
        timestamp = Time.now();
        active = true;
      },
    );
  };
};
