"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TripsTab from "@/components/tile-pages/trips-tab";

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
    imageUrl: toText(api.linkBigImg ?? api.linkSmallImg, "") || undefined,
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

export default function TileModule({ title, subtitle }: TileModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<NormalizedVehicle[]>([]);
  const [telemetryByVin, setTelemetryByVin] = useState<Record<string, NormalizedTelemetry | undefined>>({});
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [selectedVin, setSelectedVin] = useState<string>("");

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
    if (!selectedVin) {
      return;
    }

    if (activeTab !== "telemetry" && activeTab !== "map") {
      return;
    }

    if (telemetryByVin[selectedVin]) {
      return;
    }

    let mounted = true;
    const loadTelemetry = async () => {
      setTelemetryLoading(true);
      setError(null);
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
        setTelemetryByVin((current) => ({
          ...current,
          [selectedVin]: selected,
        }));
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Error cargando telemetria");
        }
      } finally {
        if (mounted) {
          setTelemetryLoading(false);
        }
      }
    };

    void loadTelemetry();

    return () => {
      mounted = false;
    };
  }, [activeTab, selectedVin, telemetryByVin]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === selectedVin) ?? null,
    [vehicles, selectedVin]
  );

  const selectedTelemetry = useMemo(() => telemetryByVin[selectedVin] ?? null, [telemetryByVin, selectedVin]);

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

  const mapSrc = useMemo(() => {
    if (selectedTelemetry?.lat === undefined || selectedTelemetry?.lng === undefined) {
      return null;
    }
    return `https://www.google.com/maps?q=${selectedTelemetry.lat},${selectedTelemetry.lng}&z=16&output=embed`;
  }, [selectedTelemetry]);

  return (
    <div className="mx-auto w-full max-w-[1500px] rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Modulo</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-[color:var(--tile-border)] bg-[color:var(--tile)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white"
        >
          Volver al Launchpad
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando datos...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-800">Vehiculos ({vehicles.length})</p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Patente / VIN"
                className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <div className="max-h-[740px] overflow-y-auto">
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
                        <div className="h-8 w-8 rounded bg-slate-200" />
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

          <section className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedVehicle?.vehicleType !== "-" ? selectedVehicle?.vehicleType : "Vehiculo"}{" "}
                  {selectedVehicle?.label ?? "Sin seleccion"}
                </h2>
                <p className="text-xs text-slate-500">LIC_PLATE: {selectedVehicle?.licPlate ?? "-"}</p>
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

            {activeTab === "info" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex h-64 items-center justify-center rounded bg-white">
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
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "Mileage", value: selectedTelemetry?.mileage },
                    { label: "Use Hours", value: selectedTelemetry?.usedHours },
                    { label: "Odometer", value: selectedTelemetry?.odometer },
                    { label: "Last Connection", value: selectedTelemetry?.lastConnection },
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
                  {mapSrc ? (
                    <iframe
                      title="Ultima posicion"
                      src={mapSrc}
                      className="h-[520px] w-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[520px] items-center justify-center text-sm text-slate-500">
                      {telemetryLoading ? "Cargando ubicacion..." : "No hay coordenadas para el VIN seleccionado."}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">Timestamp: {selectedTelemetry?.timestamp ?? "-"}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
