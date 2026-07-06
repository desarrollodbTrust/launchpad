export type LaunchpadTile = {
  slug: string;
  title: string;
  subtitle?: string;
};

export type LaunchpadSection = {
  id: string;
  title: string;
  tiles: LaunchpadTile[];
};

export const launchpadSections: LaunchpadSection[] = [
  {
    id: "aplicaciones",
    title: "Aplicaciones",
    tiles: [
      { slug: "shifts-summary", title: "Shift's Summary", subtitle: "Resumen de Turnos" },
      { slug: "date-time-used-hours", title: "Date and Time Used Hours", subtitle: "Fecha y Hora de Horas" },
      { slug: "used-hours-report", title: "Used Hours Report", subtitle: "Informe de Horas" },
      { slug: "equipment-status-check", title: "Equipment System Status Check", subtitle: "Equipos: Estado" },
      { slug: "asignacion-zonas", title: "ASIGNACION ZONAS", subtitle: "a Tipo de Vehiculos" },
      { slug: "equipment-zone-permanence", title: "Equipment: Zone Permanence", subtitle: "Equipos: Permanencia" },
      { slug: "route-replay", title: "Route Replay", subtitle: "Reproductor de Rutas" },
      { slug: "event-logger", title: "Event Logger", subtitle: "Registro de Eventos" },
      { slug: "equipment-records", title: "Equipment Records", subtitle: "Equipos: Registros" },
      { slug: "driver-records", title: "Driver Records", subtitle: "Pilotos: Registros" },
      { slug: "map-gps", title: "Map GPS", subtitle: "Mapa GPS" },
      { slug: "enganches-trailers", title: "Enganches trailers" },
      { slug: "ubicacion-individual", title: "Ubicacion individual" },
      { slug: "tasks-and-stock-status", title: "Tasks and Stock Status", subtitle: "Estado de Tareas y Stock" },
      { slug: "task-browser", title: "Task Browser", subtitle: "Navegador de Tareas" },
      { slug: "trailer-status", title: "Trailer Status" },
      { slug: "light-map", title: "Light Map" },
      { slug: "trips-records", title: "Trips records" },
      { slug: "workshop-cockpit", title: "Workshop Cockpit", subtitle: "Panel TAUT" },
    ],
  },
  {
    id: "geofence",
    title: "Geofence",
    tiles: [
      { slug: "geofence-asignacion-zonas", title: "ASIGNACION ZONAS", subtitle: "a Tipo de Vehiculos" },
      { slug: "geozonas", title: "GEOZONAS", subtitle: "ABM" },
      { slug: "geofence-equipment-zone-permanence", title: "Equipment: Zone Permanence", subtitle: "Equipos: Permanencia" },
    ],
  },
];

export const allLaunchpadTiles = launchpadSections.flatMap((section) => section.tiles);

export function getTileBySlug(slug: string) {
  return allLaunchpadTiles.find((tile) => tile.slug === slug);
}
