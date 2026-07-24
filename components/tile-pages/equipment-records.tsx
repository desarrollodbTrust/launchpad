"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TripsTab from "@/components/tile-pages/trips-tab";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";

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
    id: "position-map",
    googleMapsApiKey,
  });

  if (!googleMapsApiKey) {
    return (
      <div className="flex h-[520px] items-center justify-center p-4 text-center text-sm text-slate-600">
        No se encontro Google Maps API key. Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY o /api/public-config.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[520px] items-center justify-center p-4 text-center text-sm text-rose-700">
        No se pudo cargar Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex h-[520px] items-center justify-center text-sm text-slate-600">Cargando mapa...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "520px" }}
      center={{ lat, lng }}
      zoom={16}
      onClick={() => setShowInfo(false)}
      options={{
        mapTypeControl: true,
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

export default function TileModule(props: TileModuleProps) {
  void props;
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<NormalizedVehicle[]>([]);
  const [telemetryByVin, setTelemetryByVin] = useState<Record<string, NormalizedTelemetry | undefined>>({});
  const [telemetryFetching, setTelemetryFetching] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [telemetryLastRequestByVin, setTelemetryLastRequestByVin] = useState<Record<string, string>>({});
  const [selectedVin, setSelectedVin] = useState<string>("");
  const [runtimeMapsApiKey, setRuntimeMapsApiKey] = useState("");
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
          .filter((item): item is NormalizedTelemetry => item !== null);

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
          .filter((item): item is NormalizedTelemetry => item !== null);

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
  const telemetryLoading = telemetryFetching && !selectedTelemetry;
  const selectedTelemetryLastRequest = telemetryLastRequestByVin[selectedVin] ?? "";

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

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] p-2 shadow-sm md:p-3">
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

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 md:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedVehicle?.vehicleType !== "-" ? selectedVehicle?.vehicleType : "Vehiculo"}{" "}
                  {selectedVehicle?.label ?? "Sin seleccion"}
                </h2>
                <p className="text-xs text-slate-500">LIC_PLATE: {selectedVehicle?.licPlate ?? "-"}</p>
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
                  { key: "map" as const, label: "Mapa" },
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

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {activeTab === "info" && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex h-56 items-center justify-center rounded bg-white xl:h-64">
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
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-slate-700">Make:</span> {selectedVehicle?.make ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Model:</span> {selectedVehicle?.model ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Submodel:</span> {selectedVehicle?.submodel ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Year:</span> {selectedVehicle?.year ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Lic Plate:</span> {selectedVehicle?.licPlate ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">VIN:</span> {selectedVehicle?.vin ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Device Id:</span> {selectedVehicle?.deviceId ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Colour:</span> {selectedVehicle?.color ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Vehicle type:</span> {selectedVehicle?.vehicleType ?? "-"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-base font-semibold text-slate-800">Car Specs</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-slate-700">Sector:</span> {selectedVehicle?.sector ?? "-"}</p>
                    <p><span className="font-medium text-slate-700">Engine Type:</span> Diesel</p>
                    <p><span className="font-medium text-slate-700">Engine Size:</span> -</p>
                    <p><span className="font-medium text-slate-700">HorsePower:</span> -</p>
                    <p><span className="font-medium text-slate-700">Torque:</span> -</p>
                    <p><span className="font-medium text-slate-700">Fuel Tank:</span> -</p>
                    <p><span className="font-medium text-slate-700">Avg. Consumption:</span> -</p>
                    <p><span className="font-medium text-slate-700">City Consumption:</span> -</p>
                    <p><span className="font-medium text-slate-700">Highway Consumption:</span> -</p>
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
                    {[
                      { label: "Mileage", value: selectedTelemetry?.mileage },
                      { label: "Use Hours", value: selectedTelemetry?.usedHours },
                      { label: "Odometer", value: selectedTelemetry?.odometer },
                      { label: "Last Connection", value: formatTimestamp(selectedTelemetry?.lastConnection ?? "") },
                      { label: "Speed", value: selectedTelemetry?.speed },
                      { label: "RPM", value: selectedTelemetry?.rpm },
                      { label: "Failures", value: selectedTelemetry?.failures },
                      { label: "Battery", value: selectedTelemetry?.battery },
                      { label: "Water Temp", value: selectedTelemetry?.waterTemp },
                      { label: "Oil Pressure", value: selectedTelemetry?.oilPressure },
                      { label: "Inlet Pressure", value: selectedTelemetry?.inletPressure },
                      { label: "Max Temp", value: selectedTelemetry?.temp },
                    ].map((item) => (
                      <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{item.value ?? "-"}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )
            )}

            {activeTab === "trips" && (
              <TripsTab vin={selectedVin} active={activeTab === "trips"} />
            )}

            {activeTab === "map" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">Speed:</span> {selectedTelemetry?.speed ?? "-"}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">Temp:</span> {selectedTelemetry?.temp ?? "-"}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">RPM:</span> {selectedTelemetry?.rpm ?? "-"}
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {selectedPosition ? (
                    <PositionMap
                      key={`${selectedPosition.lat}-${selectedPosition.lng}-${selectedPosition.timestamp}`}
                      lat={selectedPosition.lat}
                      lng={selectedPosition.lng}
                      timestamp={selectedPosition.timestamp}
                      googleMapsApiKey={googleMapsApiKey}
                    />
                  ) : (
                    <div className="flex h-[520px] items-center justify-center text-sm text-slate-500">
                      {telemetryLoading ? "Cargando ubicacion..." : "No hay coordenadas para el VIN seleccionado."}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">Timestamp: {formatTimestamp(selectedTelemetry?.timestamp ?? "")}</p>
                {telemetryError && <p className="text-xs text-rose-700">{telemetryError}</p>}
              </div>
            )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
