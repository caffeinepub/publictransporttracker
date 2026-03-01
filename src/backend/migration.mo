import Map "mo:core/Map";

module {
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

  type OldActor = {
    routes : Map.Map<Text, Route>;
    buses : Map.Map<Text, Bus>;
    busLocations : Map.Map<Text, BusLocation>;
  };

  type NewActor = {
    routes : Map.Map<Text, Route>;
    buses : Map.Map<Text, Bus>;
    busLocations : Map.Map<Text, BusLocation>;
    stops : Map.Map<Text, Stop>;
    alerts : Map.Map<Text, Alert>;
  };

  public func run(old : OldActor) : NewActor {
    let newStops = Map.empty<Text, Stop>();
    let newAlerts = Map.empty<Text, Alert>();
    {
      old with stops = newStops;
      alerts = newAlerts;
    };
  };
};
