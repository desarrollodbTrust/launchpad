import type { ComponentType } from "react";
import AsignacionZonasTile from "./asignacion-zonas";
import DateTimeUsedHoursTile from "./date-time-used-hours";
import DriverRecordsTile from "./driver-records";
import EnganchesTrailersTile from "./enganches-trailers";
import EquipmentRecordsTile from "./equipment-records";
import EquipmentStatusCheckTile from "./equipment-status-check";
import EquipmentZonePermanenceTile from "./equipment-zone-permanence";
import EventLoggerTile from "./event-logger";
import GeofenceAsignacionZonasTile from "./geofence-asignacion-zonas";
import GeofenceEquipmentZonePermanenceTile from "./geofence-equipment-zone-permanence";
import GeozonasTile from "./geozonas";
import LightMapTile from "./light-map";
import MapGpsTile from "./map-gps";
import RouteReplayTile from "./route-replay";
import ShiftsSummaryTile from "./shifts-summary";
import TaskBrowserTile from "./task-browser";
import TasksAndStockStatusTile from "./tasks-and-stock-status";
import TrailerStatusTile from "./trailer-status";
import TripsRecordsTile from "./trips-records";
import UbicacionIndividualTile from "./ubicacion-individual";
import UsedHoursReportTile from "./used-hours-report";
import WorkshopCockpitTile from "./workshop-cockpit";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

export const tileComponentBySlug: Record<string, ComponentType<TileModuleProps>> = {
  "asignacion-zonas": AsignacionZonasTile,
  "date-time-used-hours": DateTimeUsedHoursTile,
  "driver-records": DriverRecordsTile,
  "enganches-trailers": EnganchesTrailersTile,
  "equipment-records": EquipmentRecordsTile,
  "equipment-status-check": EquipmentStatusCheckTile,
  "equipment-zone-permanence": EquipmentZonePermanenceTile,
  "event-logger": EventLoggerTile,
  "geofence-asignacion-zonas": GeofenceAsignacionZonasTile,
  "geofence-equipment-zone-permanence": GeofenceEquipmentZonePermanenceTile,
  geozonas: GeozonasTile,
  "light-map": LightMapTile,
  "map-gps": MapGpsTile,
  "route-replay": RouteReplayTile,
  "shifts-summary": ShiftsSummaryTile,
  "task-browser": TaskBrowserTile,
  "tasks-and-stock-status": TasksAndStockStatusTile,
  "trailer-status": TrailerStatusTile,
  "trips-records": TripsRecordsTile,
  "ubicacion-individual": UbicacionIndividualTile,
  "used-hours-report": UsedHoursReportTile,
  "workshop-cockpit": WorkshopCockpitTile,
};