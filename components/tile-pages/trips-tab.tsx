"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  PolylineF,
  useJsApiLoader,
} from "@react-google-maps/api";

type TripApi = {
  vin: string;
  startTime?: string | null;
  endTime?: string | null;
  mileage?: number | string | null;
  iddleMinute?: number | string | null;
  maxRpm?: number | string | null;
  maxSpeed?: number | string | null;
  avgSpeed?: number | string | null;
  maxWaterTemp?: number | string | null;
  consumptionLts?: number | string | null;
  duration?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  driverId?: number | string | null;
  carrierLicPlate?: string | null;
};

type ObdPointApi = {
  vin?: string | null;
  date?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lastLatitude?: number | string | null;
  lastLongitude?: number | string | null;
  speedFrom?: string | null;
  speedObdRaw?: number | string | null;
  speedGps?: number | string | null;
  speedObd?: number | string | null;
  rpm?: number | string | null;
  waterTemp?: number | string | null;
  battery?: number | string | null;
  oilPress?: number | string | null;
  pressAdmission?: number | string | null;
  angle?: number | string | null;
  hdop?: number | string | null;
  inTravel?: boolean | string | null;
  status?: number | string | null;
};

type TripRow = {
  vin: string;
  driver: string;
  startTime: string;
  endTime: string;
  length: string;
  stopped: string;
  distance: string;
  avgSpeed: string;
  maxSpeed: string;
  maxRpm: string;
  consumption: string;
  maxTemp: string;
  hooked: string;
};

type ObdPoint = {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  speedSource: string;
  speedObdRaw: number;
  speedGps: number;
  hasSpeedCan: boolean;
  hasSpeedGps: boolean;
  rpm: number;
  waterTemp: number;
  battery: number;
  oilPressure: number;
  inletPressure: number;
  angle: number;
  hdop: number;
  inTravel: boolean;
  status: number;
};

type TripViewMode = "list" | "map" | "combined" | "charts";
type ChartMetric = "speed" | "rpm" | "waterTemp" | "battery" | "oilPressure" | "inletPressure";

type TripsTabProps = {
  vin: string;
  active: boolean;
};

const MAX_VISUAL_POINTS = 1200;
const FALLBACK_TIME_ZONE = "America/Argentina/Buenos_Aires";
const TRIP_ZOOM_RULES = [
  { lat: 0.008, lng: 0.017, zoom: 15 },
  { lat: 0.014, lng: 0.04, zoom: 14 },
  { lat: 0.03, lng: 0.07, zoom: 13 },
  { lat: 0.07, lng: 0.15, zoom: 12 },
  { lat: 0.13, lng: 0.32, zoom: 11 },
  { lat: 0.32, lng: 0.64, zoom: 10 },
  { lat: 0.64, lng: 1.28, zoom: 9 },
  { lat: 1.28, lng: 2.56, zoom: 8 },
  { lat: 2.56, lng: 4.12, zoom: 7 },
  { lat: 5.12, lng: 10.24, zoom: 6 },
  { lat: 10.24, lng: 20.48, zoom: 5 },
  { lat: 20.48, lng: 40.96, zoom: 4 },
  { lat: 40.96, lng: 81.92, zoom: 3 },
  { lat: 999, lng: 999, zoom: 2 },
] as const;

function toText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

async function fetchTripPage(vin: string, page: number, size: number) {
  const response = await fetch(`/api/trip-view?vin=${encodeURIComponent(vin)}&page=${page}&size=${size}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en /api/trip-view`);
  }

  const payload = (await response.json()) as {
    data?: unknown[];
    totalPages?: number;
    totalElements?: number;
  };

  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    totalPages: Number.isFinite(payload.totalPages) ? Number(payload.totalPages) : 1,
    totalElements: Number.isFinite(payload.totalElements) ? Number(payload.totalElements) : 0,
  };
}

async function fetchObdPoints(vin: string, startTime: string, endTime: string) {
  const params = new URLSearchParams({
    vin,
    startTime,
    endTime,
    page: "0",
    size: "20000",
  });

  const response = await fetch(`/api/obd-gps-view?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en /api/obd-gps-view`);
  }

  const payload = (await response.json()) as { data?: unknown[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

function normalizeTrip(record: TripApi): TripRow | null {
  const vin = toText(record.vin, "");
  if (!vin) {
    return null;
  }

  const firstName = toText(record.firstname, "");
  const lastName = toText(record.lastname, "");
  const driver = `${firstName} ${lastName}`.trim() || toText(record.driverId);

  return {
    vin,
    driver,
    startTime: toText(record.startTime),
    endTime: toText(record.endTime),
    length: toText(record.duration),
    stopped: toText(record.iddleMinute),
    distance: toText(record.mileage),
    avgSpeed: toText(record.avgSpeed),
    maxSpeed: toText(record.maxSpeed),
    maxRpm: toText(record.maxRpm),
    consumption: toText(record.consumptionLts),
    maxTemp: toText(record.maxWaterTemp),
    hooked: toText(record.carrierLicPlate),
  };
}

function normalizeObdPoint(record: ObdPointApi): ObdPoint | null {
  const lat = toNumber(record.lastLatitude ?? record.latitude);
  const lng = toNumber(record.lastLongitude ?? record.longitude);
  if (lat === undefined || lng === undefined) {
    return null;
  }

  const speedSource = toText(record.speedFrom, "").toUpperCase();
  const speedObdRawParsed = toNumber(record.speedObdRaw);
  const speedGpsParsed = toNumber(record.speedGps);
  const speedObdRaw = speedObdRawParsed ?? 0;
  const speedGps = speedGpsParsed ?? 0;
  const speed = speedSource === "CAN" ? speedObdRaw : speedGps;
  const inTravelValue =
    typeof record.inTravel === "boolean"
      ? record.inTravel
      : toText(record.inTravel, "").toLowerCase() === "true";

  return {
    timestamp: toText(record.date, ""),
    lat,
    lng,
    speed,
    speedSource: speedSource || "GPS",
    speedObdRaw,
    speedGps,
    hasSpeedCan: speedObdRawParsed !== undefined,
    hasSpeedGps: speedGpsParsed !== undefined,
    rpm: toNumber(record.rpm) ?? 0,
    waterTemp: toNumber(record.waterTemp) ?? 0,
    battery: toNumber(record.battery) ?? 0,
    oilPressure: toNumber(record.oilPress) ?? 0,
    inletPressure: toNumber(record.pressAdmission) ?? 0,
    angle: toNumber(record.angle) ?? 0,
    hdop: toNumber(record.hdop) ?? 0,
    inTravel: inTravelValue,
    status: toNumber(record.status) ?? 0,
  };
}

function metricLabel(metric: ChartMetric) {
  switch (metric) {
    case "speed":
      return "Speed";
    case "rpm":
      return "RPM";
    case "waterTemp":
      return "Water Temp";
    case "battery":
      return "Battery";
    case "oilPressure":
      return "Oil Pressure";
    case "inletPressure":
      return "Inlet Pressure";
    default:
      return metric;
  }
}

function seriesLabel(series: string) {
  if (series === "speed") return "Speed";
  if (series === "speedGps") return "Speed GPS";
  if (series === "speedObdRaw") return "Speed CAN";
  return metricLabel(series as ChartMetric);
}

function formatTimestamp(value: string) {
  const date = parseUtcTimestamp(value);
  if (!date) {
    return value || "-";
  }
  return formatInUserTimeZone(date);
}

function parseUtcTimestamp(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  let normalized = raw.replace(" ", "T");
  const hasTimezone = /(Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/.test(normalized);

  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  if (/^[+-]\d{4}$/.test(normalized.slice(-5))) {
    normalized = `${normalized.slice(0, -5)}${normalized.slice(-5, -2)}:${normalized.slice(-2)}`;
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(`${raw}Z`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function getDisplayTimeZone() {
  try {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return browserTimeZone || FALLBACK_TIME_ZONE;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

function formatInUserTimeZone(date: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: getDisplayTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return formatter.format(date);
}

function toUtcMillis(value: string) {
  const parsed = parseUtcTimestamp(value);
  return parsed ? parsed.getTime() : 0;
}

function buildAlerts(point: ObdPoint) {
  const alerts: string[] = [];
  if (point.speed > 90) alerts.push("Exceso de velocidad");
  if (point.rpm > 3000) alerts.push("RPM alto");
  if (point.waterTemp > 100) alerts.push("Temperatura alta");
  if (point.battery < 11.5) alerts.push("Bateria baja");
  if (point.oilPressure < 10) alerts.push("Presion de aceite baja");
  return alerts;
}

function downsamplePoints(points: ObdPoint[], maxPoints: number) {
  if (points.length <= maxPoints || maxPoints <= 2) {
    return points;
  }

  const sampled: ObdPoint[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round(i * step);
    sampled.push(points[index]);
  }
  return sampled;
}

function findNearestPointIndex(points: ObdPoint[], lat: number, lng: number) {
  if (points.length === 0) {
    return null;
  }

  let nearest = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const dLat = points[i].lat - lat;
    const dLng = points[i].lng - lng;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < minDistance) {
      minDistance = distance;
      nearest = i;
    }
  }

  return nearest;
}

function getTripZoom(difLat: number, difLng: number) {
  for (const rule of TRIP_ZOOM_RULES) {
    if (difLat <= rule.lat && difLng < rule.lng) {
      return rule.zoom;
    }
  }
  return 2;
}

function computeRouteZoom(routePath: Array<{ lat: number; lng: number }>) {
  if (routePath.length < 2) {
    return 14;
  }

  const first = routePath[0];
  const last = routePath[routePath.length - 1];
  const difLat = Math.abs(first.lat - last.lat);
  const difLng = Math.abs(first.lng - last.lng);

  return getTripZoom(difLat, difLng);
}

function InteractiveChart({
  points,
  metric,
  selectedIndex,
  showSpeedOverlay,
  onSelect,
}: {
  points: ObdPoint[];
  metric: ChartMetric;
  selectedIndex: number | null;
  showSpeedOverlay: boolean;
  onSelect: (index: number) => void;
}) {
  const [brushKey, setBrushKey] = useState(0);

  if (points.length === 0) {
    return (
      <div className="h-64 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        Sin datos para graficar.
      </div>
    );
  }

  const chartData = points.map((point, index) => ({
    index,
    timestamp: point.timestamp,
    speed: point.speed,
    speedGps: point.speedGps,
    speedObdRaw: point.speedObdRaw,
    hasSpeedCan: point.hasSpeedCan,
    hasSpeedGps: point.hasSpeedGps,
    rpm: point.rpm,
    waterTemp: point.waterTemp,
    battery: point.battery,
    oilPressure: point.oilPressure,
    inletPressure: point.inletPressure,
  }));

  const selected =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex < chartData.length
      ? chartData[selectedIndex]
      : null;

  const tickStep = Math.max(1, Math.floor(chartData.length / 8));
  const renderSpeedOverlay = metric === "speed" && showSpeedOverlay;
  const hasGpsSeries = chartData.some((item) => item.hasSpeedGps);
  const hasCanSeries = chartData.some((item) => item.hasSpeedCan);

  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{metricLabel(metric)} (click para seleccionar punto)</p>
        <button
          type="button"
          onClick={() => setBrushKey((current) => current + 1)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        >
          Reset Zoom
        </button>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onClick={(state) => {
              const idx = (state as { activeTooltipIndex?: number } | undefined)?.activeTooltipIndex;
              if (typeof idx === "number" && idx >= 0 && idx < chartData.length) {
                onSelect(idx);
              }
            }}
            margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 11 }}
              interval={tickStep - 1}
              tickFormatter={(value: number) => formatTimestamp(chartData[value]?.timestamp ?? "")}
            />
            <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value, name) => [Number(value ?? 0).toFixed(2), seriesLabel(String(name))]}
              labelFormatter={(label) => formatTimestamp(chartData[Number(label)]?.timestamp ?? "")}
            />
            {renderSpeedOverlay ? (
              <>
                <Legend />
                {hasGpsSeries && (
                  <Line
                    type="monotone"
                    dataKey="speedGps"
                    name="Speed GPS"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 7 }}
                  />
                )}
                {hasCanSeries && (
                  <Line
                    type="monotone"
                    dataKey="speedObdRaw"
                    name="Speed CAN"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={(props) => {
                      const pointIndex = props.index;
                      const isSelected = pointIndex === selectedIndex;
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={isSelected ? 6 : 3}
                          fill={isSelected ? "#dc2626" : "#f59e0b"}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 2 : 1}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            if (typeof pointIndex === "number") {
                              onSelect(pointIndex);
                            }
                          }}
                        />
                      );
                    }}
                    activeDot={{ r: 7 }}
                  />
                )}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#2563eb"
                strokeWidth={2}
                dot={(props) => {
                  const pointIndex = props.index;
                  const isSelected = pointIndex === selectedIndex;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={isSelected ? 6 : 3}
                      fill={isSelected ? "#dc2626" : "#2563eb"}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (typeof pointIndex === "number") {
                          onSelect(pointIndex);
                        }
                      }}
                    />
                  );
                }}
                activeDot={{ r: 7 }}
              />
            )}
            {selected && (
              <ReferenceDot
                x={selected.index}
                y={selected[metric]}
                r={7}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            )}
            <Brush
              key={brushKey}
              dataKey="index"
              height={20}
              stroke="#94a3b8"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TripsMapPanel({
  googleMapsApiKey,
  mapCenter,
  mapZoom,
  routePath,
  visualPoints,
  selectedPoint,
  onSelectPoint,
  onClearPoint,
}: {
  googleMapsApiKey: string;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  routePath: Array<{ lat: number; lng: number }>;
  visualPoints: ObdPoint[];
  selectedPoint: ObdPoint | null;
  onSelectPoint: (index: number) => void;
  onClearPoint: () => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded: isMapLoaded, loadError } = useJsApiLoader({
    id: "trip-map",
    googleMapsApiKey,
  });

  if (loadError) {
    return (
      <div className="p-4 text-sm text-rose-700">
        No se pudo cargar Google Maps. Verifica la API key y las restricciones de dominio.
      </div>
    );
  }

  if (!isMapLoaded) {
    return <div className="p-4 text-sm text-slate-600">Cargando Google Maps...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "420px" }}
      center={mapCenter}
      zoom={mapZoom}
      onLoad={(map) => {
        mapRef.current = map;
        map.setCenter(mapCenter);
        map.setZoom(mapZoom);
      }}
      onClick={(event) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (lat === undefined || lng === undefined) {
          return;
        }
        const nearest = findNearestPointIndex(visualPoints, lat, lng);
        if (nearest !== null) {
          onSelectPoint(nearest);
        }
      }}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      <PolylineF
        path={routePath}
        options={{
          strokeColor: "#2563eb",
          strokeWeight: 4,
          clickable: true,
        }}
        onClick={(event) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (lat === undefined || lng === undefined) {
            return;
          }
          const nearest = findNearestPointIndex(visualPoints, lat, lng);
          if (nearest !== null) {
            onSelectPoint(nearest);
          }
        }}
      />

      {selectedPoint && (
        <>
          <MarkerF position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }} />
          <InfoWindowF
            position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            onCloseClick={onClearPoint}
          >
            <div className="space-y-1 text-xs text-slate-700">
              <p>
                <strong>Fecha:</strong> {formatTimestamp(selectedPoint.timestamp)}
              </p>
              <p>
                <strong>Velocidad:</strong> {selectedPoint.speed.toFixed(2)} ({selectedPoint.speedSource})
              </p>
              <p>
                <strong>Speed OBD Raw:</strong> {selectedPoint.speedObdRaw.toFixed(2)}
              </p>
              <p>
                <strong>Speed GPS:</strong> {selectedPoint.speedGps.toFixed(2)}
              </p>
              <p>
                <strong>RPM:</strong> {selectedPoint.rpm.toFixed(2)}
              </p>
              <p>
                <strong>Temperatura:</strong> {selectedPoint.waterTemp.toFixed(2)}
              </p>
              <p>
                <strong>Bateria:</strong> {selectedPoint.battery.toFixed(2)}
              </p>
              <p>
                <strong>Presion Aceite:</strong> {selectedPoint.oilPressure.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> {selectedPoint.status} · <strong>In Travel:</strong> {selectedPoint.inTravel ? "true" : "false"}
              </p>
              <p>
                <strong>HDOP:</strong> {selectedPoint.hdop.toFixed(2)} · <strong>Angulo:</strong> {selectedPoint.angle.toFixed(2)}
              </p>
              <p>
                <strong>Alertas:</strong> {buildAlerts(selectedPoint).join(", ") || "Sin alertas"}
              </p>
            </div>
          </InfoWindowF>
        </>
      )}
    </GoogleMap>
  );
}

export default function TripsTab({ vin, active }: TripsTabProps) {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<TripRow | null>(null);
  const [mode, setMode] = useState<TripViewMode>("list");
  const [metric, setMetric] = useState<ChartMetric>("speed");
  const [obdPoints, setObdPoints] = useState<ObdPoint[]>([]);
  const [obdLoading, setObdLoading] = useState(false);
  const [lastVin, setLastVin] = useState(vin);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const [runtimeMapsApiKey, setRuntimeMapsApiKey] = useState("");

  const buildMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const googleMapsApiKey = buildMapsApiKey || runtimeMapsApiKey;

  useEffect(() => {
    if (buildMapsApiKey) {
      return;
    }

    let mounted = true;
    const loadRuntimeKey = async () => {
      try {
        const response = await fetch("/api/public-config", { cache: "no-store" });
        if (!response.ok || !mounted) {
          return;
        }

        const payload = (await response.json()) as { googleMapsApiKey?: string };
        const key = typeof payload.googleMapsApiKey === "string" ? payload.googleMapsApiKey.trim() : "";
        if (key) {
          setRuntimeMapsApiKey(key);
        }
      } catch {
        // Ignore and keep empty key so UI can show guidance.
      }
    };

    void loadRuntimeKey();
    return () => {
      mounted = false;
    };
  }, [buildMapsApiKey]);

  if (vin !== lastVin) {
    setLastVin(vin);
    setPage(0);
    setSelectedTrip(null);
    setMode("list");
    setObdPoints([]);
    setSelectedPointIndex(null);
    setShowSpeedOverlay(false);
  }

  useEffect(() => {
    if (!active || !vin) {
      return;
    }

    let mounted = true;
    const loadTrips = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchTripPage(vin, page, 100);
        if (!mounted) {
          return;
        }

        const normalized = payload.data
          .filter((item): item is TripApi => typeof item === "object" && item !== null)
          .map(normalizeTrip)
          .filter((item): item is TripRow => item !== null)
          .sort((a, b) => toUtcMillis(b.startTime) - toUtcMillis(a.startTime));

        setTrips(normalized);
        setTotalPages(payload.totalPages);
        setTotalElements(payload.totalElements);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Error cargando viajes");
          setTrips([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadTrips();
    return () => {
      mounted = false;
    };
  }, [active, vin, page]);

  useEffect(() => {
    if (!selectedTrip) {
      return;
    }

    let mounted = true;
    const loadObd = async () => {
      setObdLoading(true);
      try {
        const rows = await fetchObdPoints(selectedTrip.vin, selectedTrip.startTime, selectedTrip.endTime);
        if (!mounted) {
          return;
        }

        const normalized = rows
          .filter((item): item is ObdPointApi => typeof item === "object" && item !== null)
          .map(normalizeObdPoint)
          .filter((item): item is ObdPoint => item !== null)
          .sort((a, b) => toUtcMillis(a.timestamp) - toUtcMillis(b.timestamp));

        setObdPoints(normalized);
        setSelectedPointIndex(null);
      } catch {
        if (mounted) {
          setObdPoints([]);
          setSelectedPointIndex(null);
        }
      } finally {
        if (mounted) {
          setObdLoading(false);
        }
      }
    };

    void loadObd();
    return () => {
      mounted = false;
    };
  }, [selectedTrip]);

  const visualPoints = useMemo(() => downsamplePoints(obdPoints, MAX_VISUAL_POINTS), [obdPoints]);
  const routePath = useMemo(
    () => visualPoints.map((point) => ({ lat: point.lat, lng: point.lng })),
    [visualPoints]
  );
  const mapCenter = useMemo(() => {
    if (routePath.length === 0) {
      return { lat: -34.6, lng: -58.4 };
    }

    let minLat = routePath[0].lat;
    let maxLat = routePath[0].lat;
    let minLng = routePath[0].lng;
    let maxLng = routePath[0].lng;

    for (const point of routePath) {
      if (point.lat < minLat) minLat = point.lat;
      if (point.lat > maxLat) maxLat = point.lat;
      if (point.lng < minLng) minLng = point.lng;
      if (point.lng > maxLng) maxLng = point.lng;
    }

    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    };
  }, [routePath]);
  const mapZoom = useMemo(() => computeRouteZoom(routePath), [routePath]);
  const selectedPoint =
    selectedPointIndex !== null && selectedPointIndex >= 0 && selectedPointIndex < visualPoints.length
      ? visualPoints[selectedPointIndex]
      : null;

  const showList = mode === "list";
  const showMap = mode === "map" || mode === "combined";
  const showCharts = mode === "charts" || mode === "combined";

  return (
    <div className="space-y-3">
      {showList && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.06em] text-slate-600">
                <tr>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">Start Time</th>
                  <th className="px-3 py-2">Length</th>
                  <th className="px-3 py-2">Stopped</th>
                  <th className="px-3 py-2">Distance</th>
                  <th className="px-3 py-2">Avg. Speed</th>
                  <th className="px-3 py-2">Max Speed</th>
                  <th className="px-3 py-2">Max Rpm</th>
                  <th className="px-3 py-2">Consumption</th>
                  <th className="px-3 py-2">Max Temp</th>
                  <th className="px-3 py-2">Hooked</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-slate-500">
                      Cargando viajes...
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-slate-500">
                      No hay viajes para el equipo seleccionado.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, index) => (
                    <tr
                      key={`${trip.vin}-${trip.startTime}-${index}`}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      onClick={() => {
                        setSelectedTrip(trip);
                        setMode("combined");
                        setSelectedPointIndex(null);
                      }}
                    >
                      <td className="px-3 py-2">{trip.driver}</td>
                      <td className="px-3 py-2">{formatTimestamp(trip.startTime)}</td>
                      <td className="px-3 py-2">{trip.length}</td>
                      <td className="px-3 py-2">{trip.stopped}</td>
                      <td className="px-3 py-2">{trip.distance}</td>
                      <td className="px-3 py-2">{trip.avgSpeed}</td>
                      <td className="px-3 py-2">{trip.maxSpeed}</td>
                      <td className="px-3 py-2">{trip.maxRpm}</td>
                      <td className="px-3 py-2">{trip.consumption}</td>
                      <td className="px-3 py-2">{trip.maxTemp}</td>
                      <td className="px-3 py-2">{trip.hooked}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-600">Pagina {page + 1} de {totalPages} · {totalElements} viajes</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0 || loading}
                className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTrip && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-700">
              <p>
                Viaje seleccionado: {formatTimestamp(selectedTrip.startTime)} - {formatTimestamp(selectedTrip.endTime)}
              </p>
              <p className="text-xs text-slate-500">
                Driver: {selectedTrip.driver} · Distancia: {selectedTrip.distance} · Velocidad max: {selectedTrip.maxSpeed}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedTrip(null);
                setMode("list");
                setObdPoints([]);
                setSelectedPointIndex(null);
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm"
            >
              Volver al listado
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <button onClick={() => setMode("map")} className={`rounded border px-3 py-1 text-sm ${mode === "map" ? "bg-blue-600 text-white" : "bg-white"}`}>Map</button>
            <button onClick={() => setMode("combined")} className={`rounded border px-3 py-1 text-sm ${mode === "combined" ? "bg-blue-600 text-white" : "bg-white"}`}>Combined</button>
            <button onClick={() => setMode("charts")} className={`rounded border px-3 py-1 text-sm ${mode === "charts" ? "bg-blue-600 text-white" : "bg-white"}`}>Charts</button>
          </div>

          {obdLoading ? (
            <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">Cargando OBD GPS...</div>
          ) : visualPoints.length === 0 ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No hay puntos OBD/GPS para este viaje.
            </div>
          ) : (
            <div className={`grid gap-3 ${showMap && showCharts ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
              {showMap && (
                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                  {!googleMapsApiKey ? (
                    <div className="p-4 text-sm text-amber-700">
                      Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el entorno de build o en Cloud Run para ver Google Maps.
                    </div>
                  ) : (
                    <TripsMapPanel
                      googleMapsApiKey={googleMapsApiKey}
                      mapCenter={mapCenter}
                      mapZoom={mapZoom}
                      routePath={routePath}
                      visualPoints={visualPoints}
                      selectedPoint={selectedPoint}
                      onSelectPoint={(index) => setSelectedPointIndex(index)}
                      onClearPoint={() => setSelectedPointIndex(null)}
                    />
                  )}
                </div>
              )}

              {showCharts && (
                <div className="space-y-2">
                  <div className="rounded border border-slate-200 bg-white p-3">
                    <label className="text-sm text-slate-700">Metrica</label>
                    <select
                      value={metric}
                      onChange={(event) => setMetric(event.target.value as ChartMetric)}
                      className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="speed">Speed</option>
                      <option value="rpm">RPM</option>
                      <option value="waterTemp">Water Temp</option>
                      <option value="battery">Battery</option>
                      <option value="oilPressure">Oil Pressure</option>
                      <option value="inletPressure">Inlet Pressure</option>
                    </select>
                    {metric === "speed" && (
                      <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={showSpeedOverlay}
                          onChange={(event) => setShowSpeedOverlay(event.target.checked)}
                        />
                        Comparar velocidades (GPS / CAN)
                      </label>
                    )}
                  </div>
                  <InteractiveChart
                    points={visualPoints}
                    metric={metric}
                    selectedIndex={selectedPointIndex}
                    showSpeedOverlay={showSpeedOverlay}
                    onSelect={(index) => setSelectedPointIndex(index)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
}
