export type LaunchpadTile = {
  slug: string;
  title: string;
  subtitle?: string;
  visible: boolean;
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
      { slug: "shifts-summary", title: "Shift's Summary", subtitle: "Resumen de Turnos", visible: false },
      { slug: "date-time-used-hours", title: "Date and Time Used Hours", subtitle: "Fecha y Hora de Horas", visible: false },
      { slug: "used-hours-report", title: "Used Hours Report", subtitle: "Informe de Horas", visible: false },
      { slug: "equipment-status-check", title: "Equipment System Status Check", subtitle: "Equipos: Estado", visible: false },
      { slug: "asignacion-zonas", title: "ASIGNACION ZONAS", subtitle: "a Tipo de Vehiculos", visible: false },
      { slug: "equipment-zone-permanence", title: "Equipment: Zone Permanence", subtitle: "Equipos: Permanencia", visible: false },
      { slug: "route-replay", title: "Route Replay", subtitle: "Reproductor de Rutas", visible: false },
      { slug: "event-logger", title: "Event Logger", subtitle: "Registro de Eventos", visible: false },
      { slug: "equipment-records", title: "Equipment Records", subtitle: "Equipos: Registros", visible: true },
      { slug: "driver-records", title: "Driver Records", subtitle: "Pilotos: Registros", visible: false },
      { slug: "map-gps", title: "Map GPS", subtitle: "Mapa GPS", visible: false },
      { slug: "enganches-trailers", title: "Enganches trailers", visible: false },
      { slug: "ubicacion-individual", title: "Ubicacion individual", visible: false },
      { slug: "tasks-and-stock-status", title: "Tasks and Stock Status", subtitle: "Estado de Tareas y Stock", visible: false },
      { slug: "task-browser", title: "Task Browser", subtitle: "Navegador de Tareas", visible: false },
      { slug: "trailer-status", title: "Trailer Status", visible: false },
      { slug: "light-map", title: "Light Map", visible: false },
      { slug: "trips-records", title: "Trips records", visible: false },
      { slug: "workshop-cockpit", title: "Workshop Cockpit", subtitle: "Panel TAUT", visible: false },
    ],
  },
  {
    id: "geofence",
    title: "Geofence",
    tiles: [
      { slug: "geofence-asignacion-zonas", title: "ASIGNACION ZONAS", subtitle: "a Tipo de Vehiculos", visible: false },
      { slug: "geozonas", title: "GEOZONAS", subtitle: "ABM", visible: false },
      { slug: "geofence-equipment-zone-permanence", title: "Equipment: Zone Permanence", subtitle: "Equipos: Permanencia", visible: false },
    ],
  },
];

export const visibleLaunchpadSections: LaunchpadSection[] = launchpadSections
  .map((section) => ({
    ...section,
    tiles: section.tiles.filter((tile) => tile.visible),
  }))
  .filter((section) => section.tiles.length > 0);

export const allLaunchpadTiles = visibleLaunchpadSections.flatMap((section) => section.tiles);

export function getTileBySlug(slug: string) {
  return allLaunchpadTiles.find((tile) => tile.slug === slug);
}
