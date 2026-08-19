"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TripsTab from "@/components/tile-pages/trips-tab";
import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

type TabKey = "info" | "telemetry" | "trips" | "map";

interface VehicleApi {
  vin: string;
  licPlate?: string | null;
  colour?: string | null;
  observation?: string | null;
  modelYear?: number | string | null;
  motorCode?: string | null;
  makeId?: number | string | null;
  make?: string | null;
  modelId?: number | string | null;
  model?: string | null;
  submodelId?: number | string | null;
  submodel?: string | null;
  fuelType?: string | null;
  fuelTank?: number | string | null;
  hp?: number | string | null;
  motorCm3?: number | string | null;
  torkNm?: number | string | null;
  volEff?: number | string | null;
  gasCity?: number | string | null;
  gasAvg?: number | string | null;
  gasHwy?: number | string | null;
  co2?: number | string | null;
  linkBigImg?: string | null;
  linkSmallImg?: string | null;
  deviceId?: string | null;
  devicePhone?: string | null;
  mileage?: number | string | null;
  odoliter?: number | string | null;
  useHours?: number | string | null;
  companyId?: number | string | null;
  company?: string | null;
  typeId?: number | string | null;
  type?: string | null;
  lmsType?: string | null;
  countryId?: number | string | null;
  country?: string | null;
  plantId?: number | string | null;
  plant?: string | null;
  areaId?: number | string | null;
  area?: string | null;
  sapPmFunctionalLocation?: string | null;
  tenarisId?: string | null;
  localId?: string | null;
  pipeHandler?: boolean | string | null;
  property?: string | null;
  sectorId?: number | string | null;
  sector?: string | null;
  costCenter?: string | null;
  t1?: number | string | null;
  t2?: number | string | null;
  t3?: number | string | null;
  timeZone?: number | string | null;
  minimumIdle?: number | string | null;
  tag?: string | null;
  odometer?: number | string | null;
  lastLatitude?: number | string | null;
  lastLongitude?: number | string | null;
  date?: string | null;
  zoneAlert?: string | null;
}

interface TelemetryApi {
  speed?: number | string | null;
  vin: string;
  dateDevice?: string | null;
  inTravel?: boolean | number | string | null;
  latitudeDevice?: number | string | null;
  longitudeDevice?: number | string | null;
  licPlate?: string | null;
  sectorId?: number | string | null;
  typeId?: number | string | null;
  rpm?: number | string | null;
  speedFrom?: number | string | null;
  waterTemp?: number | string | null;
  pressAdmission?: number | string | null;
  currentIddle?: number | string | null;
  airTemp?: number | string | null;
  battery?: number | string | null;
  driverId?: number | string | null;
  firstname?: string | null;
  lastname?: string | null;
  failures?: number | string | null;
  speedObd?: number | string | null;
  minimumIdle?: number | string | null;
  activo?: number | string | null;
  status?: number | string | null;
  statusDescription?: string | null;
  oilTemp?: number | string | null;
  oilPress?: number | string | null;
  speedGps?: number | string | null;
  deviceTemp?: number | string | null;
  deviceBattery?: number | string | null;
  deviceId?: string | null;
  mileageDevice?: number | string | null;
  lastObd?: string | null;
  fuelLevel?: number | string | null;
  fuelType?: string | null;
  odoliter?: number | string | null;
  meters?: number | string | null;
  geoFenceDevice?: string | null;
  geoFencePlatform?: string | null;
  contact?: string | null;
  cartId?: string | null;
  email?: string | null;
  make?: string | null;
  model?: string | null;
  submodel?: string | null;
  fuelTank?: number | string | null;
  linkBigImg?: string | null;
  linkSmallImg?: string | null;
  useHours?: number | string | null;
  type?: string | null;
  country?: string | null;
  plant?: string | null;
  area?: string | null;
  sector?: string | null;
  mileage?: number | string | null;
  date?: string | null;
  lastLatitude?: number | string | null;
  lastLongitude?: number | string | null;
}

type NormalizedVehicle = {
  vin: string;
  label: string;
  sector: string;
  make: string;
  model: string;
  submodel: string;
  year: string;
  licPlate: string;
  deviceId: string;
  color: string;
  vehicleType: string;
  smallImageUrl?: string;
  bigImageUrl?: string;
  imageUrl?: string;
};

type NormalizedTelemetry = {
  vin: string;
  speed: string;
  rpm: string;
  temp: string;
  mileage: string;
  usedHours: string;
  odometer: string;
  lastConnection: string;
  battery: string;
  failures: string;
  waterTemp: string;
  oilPressure: string;
  inletPressure: string;
  lat?: number;
  lng?: number;
  timestamp: string;
};

const DEFAULT_IMAGE_URL = "/next.svg";
const TELEMETRY_POLL_INTERVAL_MS = 15_000;
const FALLBACK_TIME_ZONE = "America/Argentina/Buenos_Aires";

function extractDriveFileId(url: string) {
  const directMatch = url.match(/\/d\/([^/]+)/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") ?? undefined;
  } catch {
    return undefined;
  }
}

function toProxyImageUrl(rawUrl?: string | null, fallback = DEFAULT_IMAGE_URL) {
  const sourceUrl = (rawUrl ?? "").trim();
  if (!sourceUrl) {
    return fallback;
  }

  if (sourceUrl.startsWith("/api/drive-proxy?url=")) {
    return sourceUrl;
  }

  let driveUrl = sourceUrl;
  if (sourceUrl.includes("drive.google.com")) {
    const fileId = extractDriveFileId(sourceUrl);
    if (fileId) {
      driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return `/api/drive-proxy?url=${encodeURIComponent(driveUrl)}`;
  }

  return sourceUrl;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeVehicle(record: Record<string, unknown>): NormalizedVehicle | null {
  const api = record as Partial<VehicleApi>;
  const vin = toText(api.vin, "");
  if (!vin) {
    return null;
  }

  return {
    vin,
    label: toText(api.licPlate, `VIN ${vin.slice(-6)}`),
    sector: toText(api.sector, "SIN SECTOR"),
    make: toText(api.make),
    model: toText(api.model),
    submodel: toText(api.submodel),
    year: toText(api.modelYear),
    licPlate: toText(api.licPlate),
    deviceId: toText(api.deviceId),
    color: toText(api.colour),
    vehicleType: toText(api.lmsType ?? api.type),
    smallImageUrl: toProxyImageUrl(toText(api.linkSmallImg, "")),
    bigImageUrl: toProxyImageUrl(toText(api.linkBigImg, "")),
    imageUrl: toProxyImageUrl(toText(api.linkBigImg ?? api.linkSmallImg, "")),
  };
}

function normalizeTelemetry(record: Record<string, unknown>): NormalizedTelemetry | null {
  const api = record as Partial<TelemetryApi>;
  const vin = toText(api.vin, "");
  if (!vin) {
    return null;
  }

  const lat = toNumber(api.lastLatitude);
  const lng = toNumber(api.lastLongitude);

  return {
    vin,
    speed: toText(api.speed),
    rpm: toText(api.rpm),
    temp: toText(api.waterTemp),
    mileage: toText(api.mileage),
    usedHours: toText(api.useHours),
    odometer: toText(api.odoliter),
    lastConnection: toText(api.date),
    battery: toText(api.battery),
    failures: toText(api.failures, "No informado"),
    waterTemp: toText(api.waterTemp),
    oilPressure: toText(api.oilPress),
    inletPressure: toText(api.pressAdmission),
    lat,
    lng,
    timestamp: toText(api.date),
  };
}

function telemetryEquals(current?: NormalizedTelemetry, next?: NormalizedTelemetry) {
  if (current === next) {
    return true;
  }
  if (!current || !next) {
    return false;
  }

  return (
    current.vin === next.vin &&
    current.speed === next.speed &&
    current.rpm === next.rpm &&
    current.temp === next.temp &&
    current.mileage === next.mileage &&
    current.usedHours === next.usedHours &&
    current.odometer === next.odometer &&
    current.lastConnection === next.lastConnection &&
    current.battery === next.battery &&
    current.failures === next.failures &&
    current.waterTemp === next.waterTemp &&
    current.oilPressure === next.oilPressure &&
    current.inletPressure === next.inletPressure &&
    current.lat === next.lat &&
    current.lng === next.lng &&
    current.timestamp === next.timestamp
  );
}

function formatTimestamp(value: string) {
  const date = parseUtcTimestamp(value);
  if (!date) {
    return value || "-";
  }
  return formatInUserTimeZone(date);
}

function toDateTimeLocalValue(value: string) {
  const date = parseUtcTimestamp(value);
  if (!date) {
    return "";
  }

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
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

function buildSparklinePath(values: number[], width = 120, height = 52) {
  if (values.length === 0) {
    return "";
  }

  const safeValues = values.filter((value) => Number.isFinite(value));
  if (safeValues.length === 0) {
    return "";
  }

  if (safeValues.length === 1) {
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;

  return safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * width;
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const y = height - normalized * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function buildSparklineAreaPath(values: number[], width = 120, height = 52) {
  const linePath = buildSparklinePath(values, width, height);
  if (!linePath) {
    return "";
  }

  const safeValues = values.filter((value) => Number.isFinite(value));
  if (safeValues.length <= 1) {
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  }

  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;

  const points = safeValues.map((value, index) => {
    const x = (index / Math.max(safeValues.length - 1, 1)) * width;
    const normalized = range === 0 ? 0.5 : (value - min) / range;
    const y = height - normalized * height;
    return { x, y };
  });

  const firstX = points[0]?.x ?? 0;
  const lastX = points[points.length - 1]?.x ?? width;

  return `${points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ")} L ${lastX} ${height} L ${firstX} ${height} Z`;
}

function PositionMap({
  lat,
  lng,
  timestamp,
  googleMapsApiKey,
}: {
  lat: number;
  lng: number;
  timestamp: string;
  googleMapsApiKey: string;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const { isLoaded, loadError } = useJsApiLoader({
    id: "equipment-records-map",
    googleMapsApiKey,
  });

  if (!googleMapsApiKey) {
    return (
      <div className="flex h-[300px] items-center justify-center p-4 text-center text-sm text-slate-600">
        No se encontro Google Maps API key. Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY o /api/public-config.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[300px] items-center justify-center p-4 text-center text-sm text-rose-700">
        No se pudo cargar Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-slate-600">Cargando mapa...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "420px" }}
      center={{ lat, lng }}
      zoom={16}
      onClick={() => setShowInfo(false)}
      options={{
        mapTypeControl: true,
        mapTypeId: "satellite",
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      <MarkerF
        position={{ lat, lng }}
        onClick={() => {
          setShowInfo(true);
        }}
      />

      {showInfo && (
        <InfoWindowF
          position={{ lat, lng }}
          onCloseClick={() => {
            setShowInfo(false);
          }}
        >
          <div className="text-xs text-slate-700">
            <p>
              <strong>Fecha y hora:</strong> {formatTimestamp(timestamp)}
            </p>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

async function fetchJson(url: string): Promise<unknown[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en ${url}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const values = Object.values(data as Record<string, unknown>).find(Array.isArray);
    if (Array.isArray(values)) {
      return values;
    }
  }
  return [];
}

async function fetchTelemetryByVin(vin: string) {
  const response = await fetch(`/api/telemetry-view?vin=${encodeURIComponent(vin)}&page=0&size=100`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} en /api/telemetry-view`);
  }

  const payload = (await response.json()) as {
    data?: unknown[];
  };

  return Array.isArray(payload.data) ? payload.data : [];
}

type ReplayPoint = {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  rpm: number;
  waterTemp: number;
  battery: number;
  oilPressure: number;
  odometer: number;
  useHours: number;
  mileage: number;
  inTravel: boolean;
  status: number;
  speedSource: string;
};

function normalizeMonotonicSeries(values: number[]) {
  const cleaned = values.filter((value) => Number.isFinite(value));
  let lastValue: number | null = null;

  return cleaned.map((value) => {
    if (lastValue !== null && value < lastValue) {
      return lastValue;
    }
    lastValue = value;
    return value;
  });
}

function normalizeReplayPoint(record: Record<string, unknown>): ReplayPoint | null {
  const lat = toNumber(record.lastLatitude ?? record.latitude);
  const lng = toNumber(record.lastLongitude ?? record.longitude);
  if (lat === undefined || lng === undefined) {
    return null;
  }

  const speedSource = String(record.speedFrom ?? "GPS").trim().toUpperCase() || "GPS";
  const rawSpeed = toNumber(record.speedObdRaw ?? record.speedObd ?? record.speedGps ?? 0) ?? 0;
  const gpsSpeed = toNumber(record.speedGps ?? 0) ?? 0;
  const speed = speedSource === "CAN" ? rawSpeed : gpsSpeed;
  const odometer = toNumber(record.odoliter ?? record.odometer ?? record.mileageDevice ?? record.meters ?? record.totalOdometer ?? record.totalDistance ?? 0) ?? 0;
  const useHours = toNumber(record.useHours ?? record.hoursUsed ?? record.totalHours ?? record.use_hours ?? 0) ?? 0;
  const mileage = toNumber(record.mileage ?? record.mileageDevice ?? record.meters ?? record.distance ?? 0) ?? 0;

  return {
    timestamp: toText(record.date),
    lat,
    lng,
    speed,
    rpm: toNumber(record.rpm) ?? 0,
    waterTemp: toNumber(record.waterTemp) ?? 0,
    battery: toNumber(record.battery) ?? 0,
    oilPressure: toNumber(record.oilPress) ?? 0,
    odometer,
    useHours,
    mileage,
    inTravel: typeof record.inTravel === "boolean" ? record.inTravel : String(record.inTravel ?? "").toLowerCase() === "true",
    status: toNumber(record.status) ?? 0,
    speedSource,
  };
}

async function fetchReplayPoints(vin: string, startTime: string, endTime: string) {
  const params = new URLSearchParams({
    vin,
    page: "0",
    size: "20000",
  });

  if (startTime) {
    params.set("startTime", startTime);
  }
  if (endTime) {
    params.set("endTime", endTime);
  }

  const response = await fetch(`/api/obd-gps-view?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en /api/obd-gps-view`);
  }

  const payload = (await response.json()) as { data?: unknown[] };
  return Array.isArray(payload.data)
    ? payload.data
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map(normalizeReplayPoint)
        .filter((item): item is ReplayPoint => item !== null)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    : [];
}

async function fetchTrendHistoryPoints(vin: string) {
  const params = new URLSearchParams({
    vin,
    page: "0",
    size: "2000",
  });

  const response = await fetch(`/api/obd-gps-view?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en /api/obd-gps-view`);
  }

  const payload = (await response.json()) as { data?: unknown[] };

  return Array.isArray(payload.data)
    ? payload.data
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map(normalizeReplayPoint)
        .filter((item): item is ReplayPoint => item !== null)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    : [];
}

export default function TileModule(props: TileModuleProps) {
  void props;
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<NormalizedVehicle[]>([]);
  const [telemetryByVin, setTelemetryByVin] = useState<Record<string, NormalizedTelemetry | undefined>>({});
  const [trendHistoryByVin, setTrendHistoryByVin] = useState<Record<string, ReplayPoint[]>>({});
  const [telemetryFetching, setTelemetryFetching] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [telemetryLastRequestByVin, setTelemetryLastRequestByVin] = useState<Record<string, string>>({});
  const [selectedVin, setSelectedVin] = useState<string>("");
  const [runtimeMapsApiKey, setRuntimeMapsApiKey] = useState("");
  const [mapFrom, setMapFrom] = useState(() => {
    const now = new Date();
    const before = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return toDateTimeLocalValue(before.toISOString());
  });
  const [mapTo, setMapTo] = useState(() => toDateTimeLocalValue(new Date().toISOString()));
  const [routePoints, setRoutePoints] = useState<ReplayPoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [hasStartedReplay, setHasStartedReplay] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const telemetryInFlightRef = useRef(false);

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const vehicleRaw = await fetchJson("/api/vehicle-view");

        if (!mounted) {
          return;
        }

        const normalizedVehicles = vehicleRaw
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map(normalizeVehicle)
          .filter((item): item is NormalizedVehicle => item !== null);

        setVehicles(normalizedVehicles);
        setTelemetryByVin({});
        setTelemetryLastRequestByVin({});

        if (normalizedVehicles.length > 0) {
          setSelectedVin((current) => {
            if (current && normalizedVehicles.some((v) => v.vin === current)) {
              return current;
            }
            return normalizedVehicles[0].vin;
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Error cargando datos");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedVin || telemetryByVin[selectedVin]) {
      return;
    }

    let mounted = true;

    const loadTelemetry = async () => {
      if (telemetryInFlightRef.current) {
        return;
      }

      telemetryInFlightRef.current = true;
      setTelemetryFetching(true);
      setTelemetryLastRequestByVin((current) => ({
        ...current,
        [selectedVin]: new Date().toISOString(),
      }));
      setTelemetryError((current) => (current === null ? current : null));

      try {
        const rows = await fetchTelemetryByVin(selectedVin);
        if (!mounted) {
          return;
        }

        const normalized = rows
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map(normalizeTelemetry)
          .filter((item): item is NormalizedTelemetry => item !== null)
          .sort((a, b) => (parseUtcTimestamp(a.timestamp)?.getTime() ?? 0) - (parseUtcTimestamp(b.timestamp)?.getTime() ?? 0));

        const selected = normalized.find((item) => item.vin === selectedVin) ?? normalized[0];

        setTelemetryByVin((current) => {
          const previous = current[selectedVin];
          if (telemetryEquals(previous, selected)) {
            return current;
          }

          return {
            ...current,
            [selectedVin]: selected,
          };
        });
      } catch (loadError) {
        if (mounted) {
          const nextError = loadError instanceof Error ? loadError.message : "Error cargando telemetria";
          setTelemetryError((current) => (current === nextError ? current : nextError));
        }
      } finally {
        if (mounted) {
          setTelemetryFetching(false);
        }
        telemetryInFlightRef.current = false;
      }
    };

    void loadTelemetry();

    return () => {
      mounted = false;
    };
  }, [selectedVin, telemetryByVin]);

  useEffect(() => {
    if (!selectedVin) {
      return;
    }

    let mounted = true;

    const loadTrendHistory = async () => {
      try {
        const rows = await fetchTrendHistoryPoints(selectedVin);
        if (!mounted) {
          return;
        }
        setTrendHistoryByVin((current) => ({ ...current, [selectedVin]: rows }));
      } catch {
        setTrendHistoryByVin((current) => ({ ...current, [selectedVin]: [] }));
      }
    };

    void loadTrendHistory();

    return () => {
      mounted = false;
    };
  }, [selectedVin]);

  useEffect(() => {
    if (!selectedVin) {
      return;
    }

    if (activeTab !== "telemetry" && activeTab !== "map") {
      return;
    }

    let mounted = true;

    const loadTelemetry = async () => {
      if (telemetryInFlightRef.current) {
        return;
      }

      telemetryInFlightRef.current = true;
      setTelemetryFetching(true);
      setTelemetryLastRequestByVin((current) => ({
        ...current,
        [selectedVin]: new Date().toISOString(),
      }));
      setTelemetryError((current) => (current === null ? current : null));

      try {
        const rows = await fetchTelemetryByVin(selectedVin);
        if (!mounted) {
          return;
        }

        const normalized = rows
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map(normalizeTelemetry)
          .filter((item): item is NormalizedTelemetry => item !== null)
          .sort((a, b) => (parseUtcTimestamp(a.timestamp)?.getTime() ?? 0) - (parseUtcTimestamp(b.timestamp)?.getTime() ?? 0));

        const selected = normalized.find((item) => item.vin === selectedVin) ?? normalized[0];

        setTelemetryByVin((current) => {
          const previous = current[selectedVin];
          if (telemetryEquals(previous, selected)) {
            return current;
          }

          return {
            ...current,
            [selectedVin]: selected,
          };
        });
      } catch (loadError) {
        if (mounted) {
          const nextError = loadError instanceof Error ? loadError.message : "Error cargando telemetria";
          setTelemetryError((current) => (current === nextError ? current : nextError));
        }
      } finally {
        if (mounted) {
          setTelemetryFetching(false);
        }
        telemetryInFlightRef.current = false;
      }
    };

    void loadTelemetry();
    const intervalId = setInterval(() => {
      void loadTelemetry();
    }, TELEMETRY_POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [activeTab, selectedVin]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === selectedVin) ?? null,
    [vehicles, selectedVin]
  );

  const selectedTelemetry = useMemo(() => telemetryByVin[selectedVin] ?? null, [telemetryByVin, selectedVin]);
  const trendHistory = useMemo(() => trendHistoryByVin[selectedVin] ?? [], [selectedVin, trendHistoryByVin]);
  const telemetryLoading = telemetryFetching && !selectedTelemetry;
  const selectedTelemetryLastRequest = telemetryLastRequestByVin[selectedVin] ?? "";

  const telemetryTrendCards = useMemo(() => {
    const validTimestamps = trendHistory
      .map((item) => parseUtcTimestamp(item.timestamp))
      .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()));

    const newestTimestamp = validTimestamps.reduce((max, current) => {
      return current.getTime() > max.getTime() ? current : max;
    }, validTimestamps[0] ?? new Date(0));

    const sevenDaysAgo = newestTimestamp.getTime() - 7 * 24 * 60 * 60 * 1000;
    const recent = trendHistory.filter((item) => {
      const timestamp = parseUtcTimestamp(item.timestamp);
      if (!timestamp) {
        return true;
      }
      return timestamp.getTime() >= sevenDaysAgo;
    });

    const seriesFor = (field: "speed" | "rpm" | "waterTemp" | "battery" | "oilPressure") =>
      recent
        .map((item) => item[field])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    const cumulativeSeriesFor = (field: "odometer" | "useHours" | "mileage") =>
      normalizeMonotonicSeries(
        recent
          .map((item) => item[field])
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      );

    const fallbackSeries = [0];

    return [
      { key: "mileage", label: "Mileage", value: selectedTelemetry?.mileage ?? "-", icon: "/icons/odometro.png", series: cumulativeSeriesFor("mileage").length ? cumulativeSeriesFor("mileage") : fallbackSeries, color: "#475569", withTrend: true },
      { key: "useHours", label: "Use Hours", value: selectedTelemetry?.usedHours ?? "-", icon: "/icons/ultima_conexion.png", series: cumulativeSeriesFor("useHours").length ? cumulativeSeriesFor("useHours") : fallbackSeries, color: "#f59e0b", withTrend: true },
      { key: "odometer", label: "OdoLiter", value: selectedTelemetry?.odometer ?? "-", icon: "/icons/tanque_nafta.png", series: cumulativeSeriesFor("odometer").length ? cumulativeSeriesFor("odometer") : fallbackSeries, color: "#06b6d4", withTrend: true },
      { key: "lastConnection", label: "Last Connection", value: formatTimestamp(selectedTelemetry?.lastConnection ?? ""), icon: "/icons/ultima_conexion.png", series: [], color: "#8b5cf6", withTrend: false },
      { key: "speed", label: "Speed", value: selectedTelemetry?.speed ?? "-", icon: "/icons/presion_1.png", series: seriesFor("speed").length ? seriesFor("speed") : fallbackSeries, color: "#2563eb", withTrend: true },
      { key: "rpm", label: "RPM", value: selectedTelemetry?.rpm ?? "-", icon: "/icons/max_rpm.png", series: seriesFor("rpm").length ? seriesFor("rpm") : fallbackSeries, color: "#0ea5e9", withTrend: true },
      { key: "failures", label: "Failures", value: selectedTelemetry?.failures ?? "-", icon: "/icons/check.png", series: [], color: "#ef4444", withTrend: false },
      { key: "battery", label: "Battery", value: selectedTelemetry?.battery ?? "-", icon: "/icons/bateria.png", series: seriesFor("battery").length ? seriesFor("battery") : fallbackSeries, color: "#10b981", withTrend: true },
      { key: "waterTemp", label: "Water Temp", value: selectedTelemetry?.waterTemp ?? "-", icon: "/icons/temp_agua.png", series: seriesFor("waterTemp").length ? seriesFor("waterTemp") : fallbackSeries, color: "#fb7185", withTrend: true },
      { key: "oilPressure", label: "Oil Pressure", value: selectedTelemetry?.oilPressure ?? "-", icon: "/icons/presion_1.png", series: seriesFor("oilPressure").length ? seriesFor("oilPressure") : fallbackSeries, color: "#6366f1", withTrend: true },
      { key: "inletPressure", label: "Inlet Pressure", value: selectedTelemetry?.inletPressure ?? "-", icon: "/icons/presion_admision.png", series: seriesFor("oilPressure").length ? seriesFor("oilPressure") : fallbackSeries, color: "#d946ef", withTrend: true },
      { key: "maxTemp", label: "Max Temp", value: selectedTelemetry?.temp ?? "-", icon: "/icons/temp_agua.png", series: seriesFor("waterTemp").length ? seriesFor("waterTemp") : fallbackSeries, color: "#f97316", withTrend: true },
    ];
  }, [selectedTelemetry, trendHistory]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !trendHistory.length) {
      return;
    }

    const debugRows = telemetryTrendCards.map((card) => {
      const values = card.series;
      const min = values.length ? Math.min(...values) : null;
      const max = values.length ? Math.max(...values) : null;
      return {
        label: card.label,
        value: card.value,
        samples: values.length,
        min,
        max,
        first: values[0],
        last: values[values.length - 1],
        series: values,
      };
    });

    console.log("[telemetry-trend-debug]", {
      vin: selectedVin,
      rows: debugRows,
    });
  }, [selectedVin, telemetryTrendCards, trendHistory.length]);

  const handleExecuteReplay = async () => {
    if (!selectedVin) {
      return;
    }

    setRouteLoading(true);
    setRouteError(null);
    setHasStartedReplay(false);
    setIsReplayPlaying(false);
    setReplayIndex(0);
    setRoutePoints([]);

    try {
      const startTime = toApiIso(mapFrom);
      const endTime = toApiIso(mapTo);
      const rows = await fetchReplayPoints(selectedVin, startTime, endTime);
      setRoutePoints(rows);
      setReplayIndex(0);
    } catch (loadError) {
      setRouteError(loadError instanceof Error ? loadError.message : "Error cargando recorrido");
      setRoutePoints([]);
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (!isReplayPlaying || routePoints.length <= 1) {
      return;
    }

    const intervalMs = Math.max(120, 1000 / replaySpeed);
    const intervalId = window.setInterval(() => {
      setReplayIndex((current) => {
        const nextIndex = current + 1;
        if (nextIndex >= routePoints.length - 1) {
          setIsReplayPlaying(false);
          return routePoints.length - 1;
        }
        return nextIndex;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReplayPlaying, replaySpeed, routePoints]);

  const visibleVehicles = useMemo(() => {
    if (!search.trim()) {
      return vehicles;
    }
    const needle = search.toLowerCase();
    return vehicles.filter((vehicle) => {
      return (
        vehicle.label.toLowerCase().includes(needle) ||
        vehicle.vin.toLowerCase().includes(needle) ||
        vehicle.model.toLowerCase().includes(needle)
      );
    });
  }, [search, vehicles]);

  const vehiclesBySector = useMemo(() => {
    const grouped = new Map<string, NormalizedVehicle[]>();
    for (const vehicle of visibleVehicles) {
      const list = grouped.get(vehicle.sector) ?? [];
      list.push(vehicle);
      grouped.set(vehicle.sector, list);
    }
    return Array.from(grouped.entries());
  }, [visibleVehicles]);

  const selectedPosition = useMemo(() => {
    if (selectedTelemetry?.lat === undefined || selectedTelemetry?.lng === undefined) {
      return null;
    }
    return {
      lat: selectedTelemetry.lat,
      lng: selectedTelemetry.lng,
      timestamp: selectedTelemetry.timestamp,
    };
  }, [selectedTelemetry]);

  const visibleRoutePath = useMemo(() => {
    if (!routePoints.length) {
      return [] as Array<{ lat: number; lng: number }>;
    }

    if (!hasStartedReplay) {
      return routePoints.map((point) => ({ lat: point.lat, lng: point.lng }));
    }

    return routePoints.slice(0, replayIndex + 1).map((point) => ({ lat: point.lat, lng: point.lng }));
  }, [hasStartedReplay, replayIndex, routePoints]);
  const activeReplayPoint = routePoints[replayIndex] ?? null;
  const isReplayVisible = routePoints.length > 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-20px)] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] p-2 shadow-sm md:p-3">
      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
        <h1 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">Equipment Records</h1>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-[color:var(--tile-border)] bg-[color:var(--tile)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)] transition hover:bg-white"
        >
          Volver al Launchpad
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando datos...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-800">Vehiculos ({vehicles.length})</p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Patente / VIN"
                className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {vehiclesBySector.map(([sector, sectorVehicles]) => (
                <div key={sector} className="border-b border-slate-100">
                  <p className="bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase text-slate-700">{sector}</p>
                  {sectorVehicles.map((vehicle) => {
                    const selected = vehicle.vin === selectedVin;
                    return (
                      <button
                        key={vehicle.vin}
                        onClick={() => {
                          setSelectedVin(vehicle.vin);
                        }}
                        className={`flex w-full items-center gap-3 border-l-4 px-3 py-2 text-left transition ${
                          selected
                            ? "border-l-blue-600 bg-blue-50"
                            : "border-l-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className="h-8 w-8 overflow-hidden rounded bg-slate-200">
                          {vehicle.smallImageUrl ? (
                            <div
                              role="img"
                              aria-label={vehicle.label}
                              className="h-full w-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${vehicle.smallImageUrl})` }}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{vehicle.label}</p>
                          <p className="truncate text-xs text-slate-500">{vehicle.model}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col overflow-visible rounded-xl border border-slate-200 bg-white p-3 md:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                {/* <h2 className="text-lg font-semibold text-slate-900">
                  {selectedVehicle?.vehicleType !== "-" ? selectedVehicle?.vehicleType : "Vehiculo"}{" "}
                  {selectedVehicle?.label ?? "Sin seleccion"}
                </h2> */}
                <h2 className="text-lg font-semibold text-slate-900">LIC_PLATE: {selectedVehicle?.licPlate ?? "-"}</h2>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Ultima act: {formatTimestamp(selectedTelemetryLastRequest)}</span>
                  {telemetryFetching && (
                    <span
                      aria-label="Cargando telemetria"
                      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
                    />
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "info" as const, label: "Informacion" },
                  { key: "telemetry" as const, label: "Telemetria" },
                  { key: "trips" as const, label: "Viajes" },
                  { key: "map" as const, label: "Replay" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-visible pr-1">
            {activeTab === "info" && (
              <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex h-44 items-center justify-center overflow-hidden rounded bg-white xl:h-56">
                    {selectedVehicle?.imageUrl ? (
                      <div
                        role="img"
                        aria-label={selectedVehicle.label}
                        className="h-full w-full rounded bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${selectedVehicle.imageUrl})` }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400">Sin imagen</p>
                    )}
                  </div>

                  <h3 className="mb-2 text-base font-semibold text-slate-800">Vehicle</h3>
                  <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                    <p><span className="font-medium text-slate-700">Make:</span> {selectedVehicle?.make ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Model:</span> {selectedVehicle?.model ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Submodel:</span> {selectedVehicle?.submodel ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Year:</span> {selectedVehicle?.year ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Lic Plate:</span> {selectedVehicle?.licPlate ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">VIN:</span> {selectedVehicle?.vin ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Device Id:</span> {selectedVehicle?.deviceId ?? "-"}</p>
                    <p className="sm:col-span-2"><span className="font-medium text-slate-700">Vehicle type:</span> {selectedVehicle?.vehicleType ?? "-"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {selectedPosition ? (
                      <PositionMap
                        key={`${selectedPosition.lat}-${selectedPosition.lng}-${selectedPosition.timestamp}`}
                        lat={selectedPosition.lat}
                        lng={selectedPosition.lng}
                        timestamp={selectedPosition.timestamp}
                        googleMapsApiKey={googleMapsApiKey}
                      />
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">
                        {telemetryLoading ? "Cargando ubicacion..." : "No hay coordenadas para el VIN seleccionado."}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {[
                      { label: "RPM", value: selectedTelemetry?.rpm ?? "-", icon: "/icons/max_rpm.png" },
                      { label: "Velocidad", value: selectedTelemetry?.speed ?? "-", icon: "/icons/presion_1.png" },
                      { label: "Temp", value: selectedTelemetry?.temp ?? "-", icon: "/icons/temp_agua.png" },
                      { label: "Bateria", value: selectedTelemetry?.battery ?? "-", icon: "/icons/bateria.png" },
                      { label: "Ultima conex.", value: formatTimestamp(selectedTelemetry?.lastConnection ?? ""), icon: "/icons/ultima_conexion.png" },
                      { label: "Use Hours", value: selectedTelemetry?.usedHours ?? "-", icon: "/icons/ultima_conexion.png" },
                    ].map((item) => (
                      <div key={item.label} className="rounded border border-slate-200 bg-white px-2 py-2">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                          <Image src={item.icon} alt={item.label} width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                          <span>{item.label}</span>
                        </div>
                        <span className="mt-1 block font-semibold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "telemetry" && (
              telemetryLoading ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Cargando telemetria...</div>
              ) : (
                <div className="space-y-3">
                  {telemetryError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {telemetryError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {telemetryTrendCards.map((item) => {
                      const linePath = item.withTrend ? buildSparklinePath(item.series) : "";
                      const areaPath = item.withTrend ? buildSparklineAreaPath(item.series) : "";
                      const gradientId = `spark-${item.key}`;

                      const isNoTrendCard = !item.withTrend;

                      return (
                        <article key={item.key} className="min-h-[124px] rounded-xl border border-slate-200 bg-[#f5f7fb] p-2.5 shadow-sm">
                          <div className="flex h-full flex-col justify-between gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: item.color }}>
                                  <Image src={item.icon} alt={item.label} width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                                </div>
                                <div className="min-w-0 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-500">{item.label}</div>
                              </div>
                            </div>

                            <div className={`flex min-h-[38px] items-end ${isNoTrendCard ? "justify-center" : "justify-between"} gap-2`}>
                              <p
                                className={
                                  isNoTrendCard
                                    ? "max-w-full text-center text-sm font-bold leading-tight tracking-[-0.03em] text-slate-800"
                                    : "max-w-[120px] truncate text-base font-bold leading-none tracking-[-0.04em] text-slate-800"
                                }
                              >
                                {item.value ?? "-"}
                              </p>
                              {item.withTrend ? (
                                <svg viewBox="0 0 120 52" className="h-9 w-20 shrink-0 overflow-visible">
                                  <defs>
                                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                      <stop offset="0%" stopColor={item.color} stopOpacity="0.28" />
                                      <stop offset="100%" stopColor={item.color} stopOpacity="0.04" />
                                    </linearGradient>
                                  </defs>
                                  <path d={areaPath} fill={`url(#${gradientId})`} />
                                  <path d={linePath} fill="none" stroke={item.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {activeTab === "trips" && (
              <TripsTab vin={selectedVin} active={activeTab === "trips"} />
            )}

            {activeTab === "map" && (
              <div className="flex h-full flex-col gap-3">
                <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-end">
                  <label className="flex flex-1 flex-col gap-1 text-[11px] font-medium text-slate-600">
                    Desde
                    <input
                      type="datetime-local"
                      value={mapFrom}
                      onChange={(event) => setMapFrom(event.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-[11px] font-medium text-slate-600">
                    Hasta
                    <input
                      type="datetime-local"
                      value={mapTo}
                      onChange={(event) => setMapTo(event.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleExecuteReplay();
                        setHasStartedReplay(false);
                      }}
                      className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Ejecutar
                    </button>
                    <div className="flex items-center gap-1 rounded border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplayPlaying(false);
                          setHasStartedReplay(true);
                          setReplayIndex((current) => Math.max(0, current - 1));
                        }}
                        className="h-7 w-7 rounded bg-slate-50 text-base text-slate-700"
                        title="Anterior"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!routePoints.length) {
                            return;
                          }
                          if (isReplayPlaying) {
                            setIsReplayPlaying(false);
                            return;
                          }
                          setHasStartedReplay(true);
                          setReplayIndex((current) => Math.max(0, current));
                          setIsReplayPlaying(true);
                        }}
                        className="h-7 w-7 rounded bg-slate-50 text-base text-slate-700"
                        title={isReplayPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isReplayPlaying ? "❚❚" : "▶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplayPlaying(false);
                          setHasStartedReplay(true);
                          setReplayIndex((current) => Math.min(routePoints.length - 1, current + 1));
                        }}
                        className="h-7 w-7 rounded bg-slate-50 text-base text-slate-700"
                        title="Siguiente"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>

                {routePoints.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-slate-600">
                      <span>Recorrido</span>
                      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white p-0.5">
                        {[1, 2, 4].map((speedOption) => (
                          <button
                            key={speedOption}
                            type="button"
                            onClick={() => setReplaySpeed(speedOption)}
                            className={`min-w-[34px] rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              replaySpeed === speedOption
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {speedOption}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(routePoints.length - 1, 0)}
                      step={1}
                      value={replayIndex}
                      onChange={(event) => {
                        const nextIndex = Number(event.target.value);
                        setHasStartedReplay(true);
                        setIsReplayPlaying(false);
                        setReplayIndex(nextIndex);
                      }}
                      className="h-2 w-full accent-blue-600"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{formatTimestamp(routePoints[0]?.timestamp ?? "")}</span>
                      <span>{formatTimestamp(routePoints[Math.max(routePoints.length - 1, 0)]?.timestamp ?? "")}</span>
                    </div>
                  </div>
                )}

                <div className="relative overflow-visible rounded-lg border border-slate-200 bg-slate-50">
                  {routeLoading ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-600">Cargando recorrido...</div>
                  ) : routeError ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-rose-700">{routeError}</div>
                  ) : routePoints.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                      Seleccione rango de fechas para graficar.
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "480px" }}
                      center={{
                        lat: routePoints[Math.max(0, replayIndex)]?.lat ?? selectedPosition?.lat ?? -34.6,
                        lng: routePoints[Math.max(0, replayIndex)]?.lng ?? selectedPosition?.lng ?? -58.4,
                      }}
                      zoom={15}
                      onClick={() => setIsReplayPlaying(false)}
                      options={{
                        mapTypeControl: true,
                        mapTypeId: "satellite",
                        streetViewControl: false,
                        fullscreenControl: true,
                      }}
                    >
                      {isReplayVisible && (
                        <PolylineF
                          path={visibleRoutePath}
                          options={{
                            strokeColor: "#2563eb",
                            strokeWeight: 4,
                          }}
                        />
                      )}

                      {!isReplayPlaying && routePoints.length > 0 && (
                        <>
                          <MarkerF
                            position={{ lat: routePoints[0].lat, lng: routePoints[0].lng }}
                            icon={{
                              url: "/icons/startPoint.png",
                              scaledSize: new google.maps.Size(14, 14),
                              anchor: new google.maps.Point(7, 7),
                            }}
                          />
                          <MarkerF
                            position={{ lat: routePoints[routePoints.length - 1].lat, lng: routePoints[routePoints.length - 1].lng }}
                            icon={{
                              url: "/icons/llegada.png",
                              scaledSize: new google.maps.Size(28, 28),
                              anchor: new google.maps.Point(14, 14),
                            }}
                          />
                        </>
                      )}

                      {activeReplayPoint && (
                        <MarkerF position={{ lat: activeReplayPoint.lat, lng: activeReplayPoint.lng }} />
                      )}
                    </GoogleMap>
                  )}

                  {activeReplayPoint && (
                    <div className="pointer-events-none absolute right-2 top-2 z-10 w-[180px] rounded-lg border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
                      <div className="mb-1 border-b border-slate-100 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Punto activo
                      </div>
                      <div className="space-y-1 text-[9px] text-slate-700">
                        <p><span className="font-semibold text-slate-800">Fecha:</span> {formatTimestamp(activeReplayPoint.timestamp)}</p>
                        <p><span className="font-semibold text-slate-800">RPM:</span> {activeReplayPoint.rpm.toFixed(2)}</p>
                        <p><span className="font-semibold text-slate-800">Temp:</span> {activeReplayPoint.waterTemp.toFixed(2)}</p>
                        <p><span className="font-semibold text-slate-800">Bateria:</span> {activeReplayPoint.battery.toFixed(2)}</p>
                        <p><span className="font-semibold text-slate-800">Aceite:</span> {activeReplayPoint.oilPressure.toFixed(2)}</p>
                        <p><span className="font-semibold text-slate-800">Estado:</span> {activeReplayPoint.inTravel ? "En viaje" : "Detenido"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {routePoints.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Recorrido: {formatTimestamp(routePoints[0]?.timestamp ?? "")} - {formatTimestamp(routePoints[routePoints.length - 1]?.timestamp ?? "")}
                  </p>
                )}
                {routeError && <p className="text-xs text-rose-700">{routeError}</p>}
              </div>
            )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
