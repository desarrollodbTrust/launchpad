"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

type CatalogItem = {
  id?: number | string | null;
  name?: string | null;
  description?: string | null;
  makeId?: number | string | null;
  modelId?: number | string | null;
  countryId?: number | string | null;
  plantId?: number | string | null;
  areaId?: number | string | null;
  sectorId?: number | string | null;
  typeId?: number | string | null;
  [key: string]: unknown;
};

type VehicleForm = {
  vin?: string;
  licPlate?: string;
  colour?: string;
  observation?: string;
  modelYear?: string;
  motorCode?: string;
  companyId?: string;
  useHours?: string;
  typeId?: string;
  countryId?: string;
  plantId?: string;
  areaId?: string;
  sapPmFunctionalLocation?: string;
  tenarisId?: string;
  localId?: string;
  pipeHandler?: boolean;
  property?: string;
  sectorId?: string;
  tag?: string;
  makeId?: string;
  modelId?: string;
  submodelId?: string;
  fuelType?: string;
  fuelTank?: string;
  hp?: string;
  motorCm3?: string;
  torkNm?: string;
  volEff?: string;
  gasCity?: string;
  gasAvg?: string;
  gasHwy?: string;
  co2?: string;
  linkBigImg?: string;
  linkSmallImg?: string;
  deviceId?: string;
  devicePhone?: string;
  horometerReader?: string;
  hoursChecked?: string;
  telemetryHours?: string;
  platformHours?: string;
  diffHours?: string;
  lastLatitude?: string;
  lastLongitude?: string;
  date?: string;
  odometer?: string;
  status?: string;
  dateStatus?: string;
  loadStatus?: string;
  loadTime?: string;
  uacsBefore?: string;
  uacsNow?: string;
  uacsLastUpdate?: string;
  tasksLastUpdate?: string;
  odometerChecked?: string;
  mileReader?: string;
  geoFencePlatform?: string;
  lastHookedBy?: string;
  zoneAlert?: string;
  pin13?: string;
  vehicleType?: string;
};

type VehicleRecord = Record<string, unknown> & {
  vin?: string | null;
  licPlate?: string | null;
  makeId?: number | string | null;
  modelId?: number | string | null;
  submodelId?: number | string | null;
  countryId?: number | string | null;
  plantId?: number | string | null;
  areaId?: number | string | null;
  sectorId?: number | string | null;
  typeId?: number | string | null;
  make?: string | null;
  model?: string | null;
  submodel?: string | null;
  country?: string | null;
  plant?: string | null;
  area?: string | null;
  sector?: string | null;
  vehicleType?: string | null;
  [key: string]: unknown;
};

const emptyVehicle: VehicleForm = {
  vin: "",
  licPlate: "",
  colour: "",
  observation: "",
  modelYear: "",
  motorCode: "",
  companyId: "",
  useHours: "",
  typeId: "",
  countryId: "",
  plantId: "",
  areaId: "",
  sapPmFunctionalLocation: "",
  tenarisId: "",
  localId: "",
  pipeHandler: false,
  property: "",
  sectorId: "",
  tag: "",
  makeId: "",
  modelId: "",
  submodelId: "",
  fuelType: "",
  fuelTank: "",
  hp: "",
  motorCm3: "",
  torkNm: "",
  volEff: "",
  gasCity: "",
  gasAvg: "",
  gasHwy: "",
  co2: "",
  linkBigImg: "",
  linkSmallImg: "",
  deviceId: "",
  devicePhone: "",
  horometerReader: "",
  hoursChecked: "",
  telemetryHours: "",
  platformHours: "",
  diffHours: "",
  lastLatitude: "",
  lastLongitude: "",
  date: "",
  odometer: "",
  status: "",
  dateStatus: "",
  loadStatus: "",
  loadTime: "",
  uacsBefore: "",
  uacsNow: "",
  uacsLastUpdate: "",
  tasksLastUpdate: "",
  odometerChecked: "",
  mileReader: "",
  geoFencePlatform: "",
  lastHookedBy: "",
  zoneAlert: "",
  pin13: "",
  vehicleType: "",
};

function toText(value: unknown, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function sanitizeOptionalValue(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function removeEmptyPayloadValues<T extends Record<string, unknown>>(payload: T): T {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string" && value.trim() === "") {
      continue;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter((entry) => !(entry === null || entry === undefined || (typeof entry === "string" && entry.trim() === "")));
      if (filtered.length > 0) {
        cleaned[key] = filtered;
      }
      continue;
    }

    if (typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const normalized = removeEmptyPayloadValues(nested);
      if (Object.keys(normalized).length > 0) {
        cleaned[key] = normalized;
      }
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned as T;
}

function normalizeCatalogPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as CatalogItem[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidateKeys = ["data", "items", "results", "records", "content", "list", "rows", "value"];

    for (const key of candidateKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as CatalogItem[];
      }

      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        const nestedLooksLikeItem = [
          "id",
          "ID",
          "description",
          "name",
          "makeId",
          "makeID",
          "modelId",
          "modelID",
          "submodelId",
          "subModelId",
          "submodelID",
          "countryId",
          "countryID",
          "plantId",
          "plantID",
          "areaId",
          "areaID",
          "sectorId",
          "sectorID",
          "typeId",
          "typeID",
          "code",
          "value",
        ].some((field) => field in nested);

        if (nestedLooksLikeItem) {
          return [nested as CatalogItem];
        }
      }
    }

    const looksLikeCatalogItem = [
      "id",
      "ID",
      "description",
      "name",
      "makeId",
      "makeID",
      "modelId",
      "modelID",
      "submodelId",
      "subModelId",
      "submodelID",
      "countryId",
      "countryID",
      "plantId",
      "plantID",
      "areaId",
      "areaID",
      "sectorId",
      "sectorID",
      "typeId",
      "typeID",
      "code",
      "value",
    ].some((key) => key in record);

    if (looksLikeCatalogItem) {
      return [record as CatalogItem];
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        return value as CatalogItem[];
      }

      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        const nestedLooksLikeItem = [
          "id",
          "ID",
          "description",
          "name",
          "makeId",
          "makeID",
          "modelId",
          "modelID",
          "submodelId",
          "subModelId",
          "submodelID",
          "countryId",
          "countryID",
          "plantId",
          "plantID",
          "areaId",
          "areaID",
          "sectorId",
          "sectorID",
          "typeId",
          "typeID",
          "code",
          "value",
        ].some((field) => field in nested);

        if (nestedLooksLikeItem) {
          return [nested as CatalogItem];
        }
      }
    }
  }

  return [] as CatalogItem[];
}

function isIgnorableCatalogText(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return [
    "sin asignar",
    "sin asignado",
    "sin nombre",
    "sin dato",
    "n/a",
    "na",
    "null",
    "undefined",
  ].includes(normalized) || normalized.includes("sin asign");
}

function getCatalogValue(item: CatalogItem, keys: readonly string[]) {
  const record = item as Record<string, unknown>;

  for (const key of keys) {
    const exactValue = record[key];
    if (exactValue !== null && exactValue !== undefined && exactValue !== "" && !isIgnorableCatalogText(exactValue)) {
      return exactValue;
    }
  }

  const normalizedKeys = keys.map((key) => normalizeLookupKey(key));
  for (const candidateKey of Object.keys(record)) {
    if (normalizedKeys.includes(normalizeLookupKey(candidateKey))) {
      const value = record[candidateKey];
      if (value !== null && value !== undefined && value !== "" && !isIgnorableCatalogText(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function getCatalogId(item: CatalogItem, preferredKeys: readonly string[] = []) {
  const record = item as Record<string, unknown>;
  const candidateKeys = [
    ...preferredKeys,
    "id",
    "ID",
    "makeId",
    "make_id",
    "makeID",
    "makeid",
    "modelId",
    "model_id",
    "modelID",
    "modelid",
    "submodelId",
    "submodel_id",
    "submodelID",
    "submodelid",
    "subModelId",
    "subModelID",
    "countryId",
    "country_id",
    "countryID",
    "countryid",
    "plantId",
    "plant_id",
    "plantID",
    "plantid",
    "areaId",
    "area_id",
    "areaID",
    "areaid",
    "sectorId",
    "sector_id",
    "sectorID",
    "sectorid",
    "typeId",
    "type_id",
    "typeID",
    "typeid",
    "vehicleTypeId",
    "vehicle_type_id",
    "vehicleTypeID",
    "vehicletypeid",
  ];

  const uniqueKeys = Array.from(new Set(candidateKeys));

  for (const key of uniqueKeys) {
    const directValue = record[key];
    if (directValue !== null && directValue !== undefined && directValue !== "") {
      return directValue;
    }

    const matchingKey = Object.keys(record).find((candidate) => normalizeLookupKey(candidate) === normalizeLookupKey(key));
    if (matchingKey !== undefined) {
      const value = record[matchingKey];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
  }

  return undefined;
}

function catalogOptionKey(prefix: string, item: CatalogItem, index: number) {
  const id = getCatalogId(item);
  const label = getCatalogLabel(item);
  return `${prefix}-${id ?? "no-id"}-${label ?? "no-label"}-${index}`;
}

function normalizeLookupKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function toLookupValue(value: unknown) {
  return normalizeLookupKey(String(value ?? ""));
}

function collectNestedValues(value: unknown, results: unknown[]) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectNestedValues(entry, results);
    }
    return;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const nestedValue of Object.values(record)) {
      collectNestedValues(nestedValue, results);
    }

    for (const nestedKey of Object.keys(record)) {
      if (nestedKey === "id" || nestedKey.toLowerCase().endsWith("id") || nestedKey.toLowerCase().includes("make") || nestedKey.toLowerCase().includes("model") || nestedKey.toLowerCase().includes("submodel") || nestedKey.toLowerCase().includes("country") || nestedKey.toLowerCase().includes("plant") || nestedKey.toLowerCase().includes("area") || nestedKey.toLowerCase().includes("sector") || nestedKey.toLowerCase().includes("type")) {
        const nestedEntry = record[nestedKey];
        if (nestedEntry !== null && nestedEntry !== undefined && nestedEntry !== "" && !isIgnorableCatalogText(nestedEntry)) {
          results.push(nestedEntry);
        }
      }
    }
  }
}

function getCatalogRelationId(item: CatalogItem, relation: "make" | "model" | "submodel" | "country" | "plant" | "area" | "sector" | "type") {
  const aliases = {
    make: ["makeId", "make_id", "makeID", "makeid", "make"],
    model: ["modelId", "model_id", "modelID", "modelid", "model"],
    submodel: ["submodelId", "submodel_id", "submodelID", "submodelid", "subModelId", "subModelID", "submodel"],
    country: ["countryId", "country_id", "countryID", "countryid", "country"],
    plant: ["plantId", "plant_id", "plantID", "plantid", "plant"],
    area: ["areaId", "area_id", "areaID", "areaid", "area"],
    sector: ["sectorId", "sector_id", "sectorID", "sectorid", "sector"],
    type: ["typeId", "type_id", "typeID", "typeid", "vehicleTypeId", "vehicle_type_id", "vehicleTypeID", "vehicletypeid", "vehicleType", "type"],
  } as const;

  const value = getCatalogValue(item, aliases[relation]);
  if (value !== undefined && !isIgnorableCatalogText(value)) {
    return value;
  }

  const matchingValues: unknown[] = [];
  collectNestedValues(item, matchingValues);

  for (const candidate of matchingValues) {
    if (candidate !== null && candidate !== undefined && candidate !== "" && !isIgnorableCatalogText(candidate)) {
      const text = String(candidate);
      const normalized = normalizeLookupKey(text);
      for (const alias of aliases[relation]) {
        if (normalized === normalizeLookupKey(alias)) {
          return candidate;
        }
      }
    }
  }

  return undefined;
}

function getCatalogLabel(item: CatalogItem) {
  const direct = getCatalogValue(item, [
    "description",
    "description_es",
    "description_en",
    "name",
    "name_es",
    "name_en",
    "label",
    "title",
    "value",
    "code",
    "shortName",
    "short_name",
    "country",
    "plant",
    "area",
    "sector",
    "make",
    "model",
    "submodel",
    "subModel",
    "vehicleType",
    "type",
  ]);

  if (direct !== undefined) {
    return toText(direct);
  }

  const fallbackKey = Object.keys(item).find((key) => {
    const normalized = normalizeLookupKey(key);
    return [
      "description",
      "name",
      "label",
      "title",
      "value",
      "code",
      "country",
      "plant",
      "area",
      "sector",
      "make",
      "model",
      "submodel",
      "vehicletype",
      "type",
    ].includes(normalized);
  });

  if (fallbackKey) {
    return toText((item as Record<string, unknown>)[fallbackKey]);
  }

  return toText(getCatalogId(item) ?? "Sin nombre");
}

function resolveCatalogDescription(items: CatalogItem[], rawValue: unknown, idFieldNames: string[]) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "-";
  }

  const normalizedValue = String(rawValue).trim();
  if (!normalizedValue) {
    return "-";
  }

  const allIdKeys = Array.from(
    new Set([
      ...idFieldNames,
      "id",
      "ID",
      "makeId",
      "make_id",
      "makeID",
      "makeid",
      "modelId",
      "model_id",
      "modelID",
      "modelid",
      "submodelId",
      "submodel_id",
      "submodelID",
      "submodelid",
      "subModelId",
      "subModelID",
      "countryId",
      "country_id",
      "countryID",
      "countryid",
      "plantId",
      "plant_id",
      "plantID",
      "plantid",
      "areaId",
      "area_id",
      "areaID",
      "areaid",
      "sectorId",
      "sector_id",
      "sectorID",
      "sectorid",
      "typeId",
      "type_id",
      "typeID",
      "typeid",
      "vehicleTypeId",
      "vehicle_type_id",
      "vehicleTypeID",
      "vehicletypeid",
      "uuid",
    ])
  );

  const exactIdMatch = items.find((item) => {
    const record = item as Record<string, unknown>;
    return Object.keys(record).some((recordKey) => {
      const recordValue = record[recordKey];
      if (recordValue === null || recordValue === undefined || recordValue === "") {
        return false;
      }

      const recordKeyNormalized = normalizeLookupKey(recordKey);
      const isIdKey = allIdKeys.some((fieldName) => normalizeLookupKey(fieldName) === recordKeyNormalized);
      if (!isIdKey) {
        return false;
      }

      return normalizeLookupKey(String(recordValue)) === normalizeLookupKey(normalizedValue);
    });
  });

  if (exactIdMatch) {
    return getCatalogLabel(exactIdMatch);
  }

  const directTextMatch = items.find((item) => {
    const candidates = [
      getCatalogValue(item, ["description", "description_es", "description_en", "name", "name_es", "name_en", "label", "title", "value", "code"]),
      getCatalogValue(item, ["country", "plant", "area", "sector", "make", "model", "submodel", "subModel", "vehicleType", "type"]),
    ];
    return candidates.some((candidate) => candidate !== undefined && normalizeLookupKey(String(candidate)) === normalizeLookupKey(normalizedValue));
  });

  if (directTextMatch) {
    return getCatalogLabel(directTextMatch);
  }

  return String(rawValue);
}

function getVehicleSummary(vehicle: VehicleRecord) {
  return `${vehicle.licPlate ?? vehicle.vin ?? "Sin patente"}`;
}

function readVehicleField(vehicle: VehicleRecord, candidates: string[]) {
  const record = vehicle as Record<string, unknown>;
  for (const key of candidates) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return toText(value);
    }
  }
  return "";
}

function toFormData(vehicle: VehicleRecord | null): VehicleForm {
  if (!vehicle) {
    return { ...emptyVehicle };
  }

  return {
    vin: toText(vehicle.vin),
    licPlate: toText(vehicle.licPlate),
    colour: toText(vehicle.colour),
    observation: toText(vehicle.observation),
    modelYear: toText(vehicle.modelYear),
    motorCode: toText(vehicle.motorCode),
    companyId: toText(vehicle.companyId),
    useHours: toText(vehicle.useHours),
    typeId: readVehicleField(vehicle, ["typeId", "typeID", "vehicleTypeId", "vehicleTypeID"]),
    countryId: readVehicleField(vehicle, ["countryId", "countryID", "country_id"]),
    plantId: readVehicleField(vehicle, ["plantId", "plantID", "plant_id"]),
    areaId: readVehicleField(vehicle, ["areaId", "areaID", "area_id"]),
    sapPmFunctionalLocation: toText(vehicle.sapPmFunctionalLocation),
    tenarisId: toText(vehicle.tenarisId),
    localId: toText(vehicle.localId),
    pipeHandler: Boolean(vehicle.pipeHandler === true || vehicle.pipeHandler === "true"),
    property: toText(vehicle.property),
    sectorId: readVehicleField(vehicle, ["sectorId", "sectorID", "sector_id"]),
    tag: toText(vehicle.tag),
    makeId: readVehicleField(vehicle, ["makeId", "makeID", "make_id"]),
    modelId: readVehicleField(vehicle, ["modelId", "modelID", "model_id"]),
    submodelId: readVehicleField(vehicle, ["submodelId", "subModelId", "submodelID", "subModelID", "submodel_id", "subModel_id"]),
    fuelType: toText(vehicle.fuelType),
    fuelTank: toText(vehicle.fuelTank),
    hp: toText(vehicle.hp),
    motorCm3: toText(vehicle.motorCm3),
    torkNm: toText(vehicle.torkNm),
    volEff: toText(vehicle.volEff),
    gasCity: toText(vehicle.gasCity),
    gasAvg: toText(vehicle.gasAvg),
    gasHwy: toText(vehicle.gasHwy),
    co2: toText(vehicle.co2),
    linkBigImg: toText(vehicle.linkBigImg),
    linkSmallImg: toText(vehicle.linkSmallImg),
    deviceId: toText(vehicle.deviceId),
    devicePhone: toText(vehicle.devicePhone),
    horometerReader: toText(vehicle.horometerReader),
    hoursChecked: toText(vehicle.hoursChecked),
    telemetryHours: toText(vehicle.telemetryHours),
    platformHours: toText(vehicle.platformHours),
    diffHours: toText(vehicle.diffHours),
    lastLatitude: toText(vehicle.lastLatitude),
    lastLongitude: toText(vehicle.lastLongitude),
    date: toText(vehicle.date),
    odometer: toText(vehicle.odometer),
    status: toText(vehicle.status),
    dateStatus: toText(vehicle.dateStatus),
    loadStatus: toText(vehicle.loadStatus),
    loadTime: toText(vehicle.loadTime),
    uacsBefore: toText(vehicle.uacsBefore),
    uacsNow: toText(vehicle.uacsNow),
    uacsLastUpdate: toText(vehicle.uacsLastUpdate),
    tasksLastUpdate: toText(vehicle.tasksLastUpdate),
    odometerChecked: toText(vehicle.odometerChecked),
    mileReader: toText(vehicle.mileReader),
    geoFencePlatform: toText(vehicle.geoFencePlatform),
    lastHookedBy: toText(vehicle.lastHookedBy),
    zoneAlert: toText(vehicle.zoneAlert),
    pin13: toText(vehicle.pin13),
    vehicleType: toText(vehicle.vehicleType ?? vehicle.typeId),
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en ${url}`);
  }
  return response.json();
}

export default function TileModule({ title }: TileModuleProps) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [catalogs, setCatalogs] = useState({
    makes: [] as CatalogItem[],
    models: [] as CatalogItem[],
    submodels: [] as CatalogItem[],
    countries: [] as CatalogItem[],
    plants: [] as CatalogItem[],
    areas: [] as CatalogItem[],
    sectors: [] as CatalogItem[],
    vehicleTypes: [] as CatalogItem[],
  });
  const [selectedVin, setSelectedVin] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>({ ...emptyVehicle });

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        const [vehiclesResponse, makesResponse, modelsResponse, submodelsResponse, countriesResponse, plantsResponse, areasResponse, sectorsResponse, vehicleTypesResponse] = await Promise.all([
          fetchJson("/api/vehicle-view"),
          fetchJson("/api/make"),
          fetchJson("/api/model"),
          fetchJson("/api/submodel"),
          fetchJson("/api/country"),
          fetchJson("/api/plant"),
          fetchJson("/api/area"),
          fetchJson("/api/sector"),
          fetchJson("/api/vehicle-type"),
        ]);

        if (!mounted) {
          return;
        }

        const nextVehicles = normalizeCatalogPayload(vehiclesResponse) as VehicleRecord[];
        setVehicles(nextVehicles);
        setCatalogs({
          makes: normalizeCatalogPayload(makesResponse),
          models: normalizeCatalogPayload(modelsResponse),
          submodels: normalizeCatalogPayload(submodelsResponse),
          countries: normalizeCatalogPayload(countriesResponse),
          plants: normalizeCatalogPayload(plantsResponse),
          areas: normalizeCatalogPayload(areasResponse),
          sectors: normalizeCatalogPayload(sectorsResponse),
          vehicleTypes: normalizeCatalogPayload(vehicleTypesResponse),
        });

        if (nextVehicles.length > 0) {
          setSelectedVin(nextVehicles[0].vin ?? "");
          setForm(toFormData(nextVehicles[0]));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la información");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) {
      return vehicles;
    }
    const needle = search.toLowerCase();
    return vehicles.filter((vehicle) => {
      const plate = toText(vehicle.licPlate).toLowerCase();
      const vin = toText(vehicle.vin).toLowerCase();
      return plate.includes(needle) || vin.includes(needle);
    });
  }, [search, vehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => (vehicle.vin ?? "") === selectedVin) ?? null,
    [selectedVin, vehicles]
  );

  const makeModels = useMemo(() => {
    const selectedMake = form.makeId ? toLookupValue(form.makeId) : "";
    return catalogs.models.filter((model) => {
      const modelMakeId = getCatalogRelationId(model, "make");
      if (!selectedMake) {
        return true;
      }
      return toLookupValue(modelMakeId) === selectedMake;
    });
  }, [catalogs.models, form.makeId]);

  const modelSubmodels = useMemo(() => {
    const selectedModel = form.modelId ? toLookupValue(form.modelId) : "";
    return catalogs.submodels.filter((submodel) => {
      const submodelModelId = getCatalogRelationId(submodel, "model");
      if (!selectedModel) {
        return true;
      }
      return toLookupValue(submodelModelId) === selectedModel;
    });
  }, [catalogs.submodels, form.modelId]);

  const countryPlants = useMemo(() => {
    const selectedCountry = form.countryId ? toLookupValue(form.countryId) : "";
    return catalogs.plants.filter((plant) => {
      const plantCountryId = getCatalogRelationId(plant, "country");
      if (!selectedCountry) {
        return true;
      }
      return toLookupValue(plantCountryId) === selectedCountry;
    });
  }, [catalogs.plants, form.countryId]);

  const plantAreas = useMemo(() => {
    const selectedPlant = form.plantId ? toLookupValue(form.plantId) : "";
    return catalogs.areas.filter((area) => {
      const areaPlantId = getCatalogRelationId(area, "plant");
      if (!selectedPlant) {
        return true;
      }
      return toLookupValue(areaPlantId) === selectedPlant;
    });
  }, [catalogs.areas, form.plantId]);

  const areaSectors = useMemo(() => {
    const selectedArea = form.areaId ? toLookupValue(form.areaId) : "";
    return catalogs.sectors.filter((sector) => {
      const sectorAreaId = getCatalogRelationId(sector, "area");
      if (!selectedArea) {
        return true;
      }
      return toLookupValue(sectorAreaId) === selectedArea;
    });
  }, [catalogs.sectors, form.areaId]);

  const handleSelectVehicle = (vehicle: VehicleRecord) => {
    setSelectedVin(vehicle.vin ?? "");
    setIsCreating(false);
    setIsEditing(false);
    setForm(toFormData(vehicle));
    setError(null);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedVin("");
    setIsEditing(true);
    setForm({ ...emptyVehicle });
    setError(null);
  };

  const handleEditToggle = () => {
    if (selectedVehicle) {
      setForm(toFormData(selectedVehicle));
    }
    setIsEditing((current) => !current);
    setError(null);
  };

  const handleChange = (field: keyof VehicleForm, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "makeId") {
        next.modelId = "";
        next.submodelId = "";
      }

      if (field === "modelId") {
        next.submodelId = "";
      }

      if (field === "countryId") {
        next.plantId = "";
        next.areaId = "";
        next.sectorId = "";
      }

      if (field === "plantId") {
        next.areaId = "";
        next.sectorId = "";
      }

      if (field === "areaId") {
        next.sectorId = "";
      }

      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (!isCreating && !isEditing && selectedVehicle) {
      setSaving(false);
      return;
    }

    const payload = removeEmptyPayloadValues({
      ...form,
      pipeHandler: Boolean(form.pipeHandler),
      status: sanitizeOptionalValue(form.status),
      dateStatus: sanitizeOptionalValue(form.dateStatus),
      loadStatus: sanitizeOptionalValue(form.loadStatus),
      makeId: form.makeId ? Number(form.makeId) : undefined,
      modelId: form.modelId ? Number(form.modelId) : undefined,
      submodelId: form.submodelId ? Number(form.submodelId) : undefined,
      countryId: form.countryId ? Number(form.countryId) : undefined,
      plantId: form.plantId ? Number(form.plantId) : undefined,
      areaId: form.areaId ? Number(form.areaId) : undefined,
      sectorId: form.sectorId ? Number(form.sectorId) : undefined,
      typeId: form.typeId ? Number(form.typeId) : undefined,
      modelYear: form.modelYear ? Number(form.modelYear) : undefined,
      companyId: form.companyId ? Number(form.companyId) : undefined,
      useHours: form.useHours ? Number(form.useHours) : undefined,
      fuelTank: form.fuelTank ? Number(form.fuelTank) : undefined,
      hp: form.hp ? Number(form.hp) : undefined,
      motorCm3: form.motorCm3 ? Number(form.motorCm3) : undefined,
      torkNm: form.torkNm ? Number(form.torkNm) : undefined,
      volEff: form.volEff ? Number(form.volEff) : undefined,
      gasCity: form.gasCity ? Number(form.gasCity) : undefined,
      gasAvg: form.gasAvg ? Number(form.gasAvg) : undefined,
      gasHwy: form.gasHwy ? Number(form.gasHwy) : undefined,
      co2: form.co2 ? Number(form.co2) : undefined,
    });

    try {
      const method = isCreating || !selectedVehicle ? "POST" : "PUT";
      const targetVin = selectedVehicle?.vin ?? form.vin ?? "";
      const endpoint = method === "POST" ? "/api/vehicle" : `/api/vehicle?vin=${encodeURIComponent(targetVin)}`;
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No se pudo guardar el equipo");
      }

      const updatedVehicle = (await fetchJson("/api/vehicle-view")) as { data?: VehicleRecord[] };
      const nextVehicles = normalizeCatalogPayload(updatedVehicle) as VehicleRecord[];
      setVehicles(nextVehicles);
      const nextSelected = nextVehicles.find((vehicle) => vehicle.vin === payload.vin) ?? nextVehicles[0] ?? null;
      if (nextSelected) {
        setSelectedVin(nextSelected.vin ?? "");
        setForm(toFormData(nextSelected));
      }
      setIsCreating(false);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle?.vin) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/vehicle?vin=${encodeURIComponent(selectedVehicle.vin)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No se pudo eliminar el equipo");
      }

      const remainingVehicles = vehicles.filter((vehicle) => (vehicle.vin ?? "") !== selectedVehicle.vin);
      setVehicles(remainingVehicles);
      if (remainingVehicles.length > 0) {
        const next = remainingVehicles[0];
        setSelectedVin(next.vin ?? "");
        setForm(toFormData(next));
      } else {
        setSelectedVin("");
        setForm({ ...emptyVehicle });
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const canEdit = isCreating || isEditing;

  const getVehicleRelationLabel = (
    vehicle: VehicleRecord | null,
    relationKey: "make" | "model" | "submodel" | "country" | "plant" | "area" | "sector" | "vehicleType",
    catalogItems: CatalogItem[],
    idFieldNames: string[]
  ) => {
    if (!vehicle) {
      return "-";
    }

    const rawVehicle = vehicle as Record<string, unknown>;
    const aliasLookup = {
      make: ["makeId", "make_id", "makeID", "makeid", "make"],
      model: ["modelId", "model_id", "modelID", "modelid", "model"],
      submodel: ["submodelId", "submodel_id", "submodelID", "submodelid", "subModelId", "subModelID", "submodel"],
      country: ["countryId", "country_id", "countryID", "countryid", "country"],
      plant: ["plantId", "plant_id", "plantID", "plantid", "plant"],
      area: ["areaId", "area_id", "areaID", "areaid", "area"],
      sector: ["sectorId", "sector_id", "sectorID", "sectorid", "sector"],
      vehicleType: ["typeId", "type_id", "typeID", "typeid", "vehicleTypeId", "vehicle_type_id", "vehicleTypeID", "vehicletypeid", "vehicleType", "type"],
    } as const;

    const idValue = aliasLookup[relationKey]
      .map((key) => rawVehicle[key])
      .find((value) => value !== null && value !== undefined && value !== "");

    if (idValue !== undefined) {
      const resolved = resolveCatalogDescription(catalogItems, idValue, idFieldNames);
      if (resolved !== "-" && String(resolved).trim() !== String(idValue).trim()) {
        return resolved;
      }
    }

    const directText = Object.keys(rawVehicle)
      .filter((key) => normalizeLookupKey(key) === normalizeLookupKey(relationKey))
      .map((key) => rawVehicle[key])
      .find((value) => value !== null && value !== undefined && value !== "");

    return directText !== undefined ? toText(directText) : "-";
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-[calc(100vh-32px)] w-full max-w-[1700px] items-center justify-center rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] shadow-sm">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium">Cargando información del equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto h-[calc(100vh-32px)] w-full max-w-[1700px] overflow-hidden rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] shadow-sm">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modulo</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver al Launchpad
          </Link>
        </header>

        <div className="grid h-full min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] overflow-hidden">
          <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">Vehículos</h2>
              <button
                type="button"
                onClick={handleCreateNew}
                className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
              >
                Nuevo
              </button>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por patente"
              className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-blue-500"
            />

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-sm text-slate-500">Cargando vehículos...</p>
              ) : filteredVehicles.length === 0 ? (
                <p className="text-sm text-slate-500">No hay vehículos para mostrar.</p>
              ) : (
                filteredVehicles.map((vehicle, index) => (
                  <button
                    key={vehicle.vin ?? `${vehicle.licPlate ?? "vehiculo"}-${index}`}
                    type="button"
                    onClick={() => handleSelectVehicle(vehicle)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      (vehicle.vin ?? "") === selectedVin
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{getVehicleSummary(vehicle)}</p>
                        <p className="text-xs text-slate-500">{vehicle.vin ?? "Sin VIN"}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-600">
                        {vehicle.make ?? "-"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4">
            <div className="mx-auto max-w-6xl pb-6">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Equipo</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {isCreating ? "Nuevo equipo" : selectedVehicle ? getVehicleSummary(selectedVehicle) : "Seleccione un equipo"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isCreating && selectedVehicle ? (
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </button>
                  ) : null}
                  {!isCreating && selectedVehicle ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>VIN</span>
                  {canEdit ? (
                    <input
                      value={form.vin ?? ""}
                      onChange={(event) => handleChange("vin", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.vin || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Patente</span>
                  {canEdit ? (
                    <input
                      value={form.licPlate ?? ""}
                      onChange={(event) => handleChange("licPlate", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.licPlate || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Color</span>
                  {canEdit ? (
                    <input
                      value={form.colour ?? ""}
                      onChange={(event) => handleChange("colour", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.colour || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Marca</span>
                  {canEdit ? (
                    <select
                      value={form.makeId ?? ""}
                      onChange={(event) => handleChange("makeId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar marca</option>
                      {catalogs.makes.map((make, index) => (
                        <option key={catalogOptionKey("make", make, index)} value={String(getCatalogId(make, ["makeId", "make_id", "makeID", "makeid", "id"]) ?? "")}>{getCatalogLabel(make)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "make", catalogs.makes, ["makeId", "make_id", "makeID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Modelo</span>
                  {canEdit ? (
                    <select
                      value={form.modelId ?? ""}
                      onChange={(event) => handleChange("modelId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar modelo</option>
                      {makeModels.map((model, index) => (
                        <option key={catalogOptionKey("model", model, index)} value={String(getCatalogId(model, ["modelId", "model_id", "modelID", "modelid", "id"]) ?? "")}>{getCatalogLabel(model)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "model", catalogs.models, ["modelId", "model_id", "modelID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Submodelo</span>
                  {canEdit ? (
                    <select
                      value={form.submodelId ?? ""}
                      onChange={(event) => handleChange("submodelId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar submodelo</option>
                      {modelSubmodels.map((submodel, index) => (
                        <option key={catalogOptionKey("submodel", submodel, index)} value={String(getCatalogId(submodel, ["submodelId", "subModelId", "submodel_id", "submodelID", "submodelid", "id"]) ?? "")}>{getCatalogLabel(submodel)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "submodel", catalogs.submodels, ["submodelId", "submodel_id", "submodelID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>País</span>
                  {canEdit ? (
                    <select
                      value={form.countryId ?? ""}
                      onChange={(event) => handleChange("countryId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar país</option>
                      {catalogs.countries.map((country, index) => (
                        <option key={catalogOptionKey("country", country, index)} value={String(getCatalogId(country) ?? "")}>{getCatalogLabel(country)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "country", catalogs.countries, ["countryId", "country_id", "countryID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Planta</span>
                  {canEdit ? (
                    <select
                      value={form.plantId ?? ""}
                      onChange={(event) => handleChange("plantId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar planta</option>
                      {countryPlants.map((plant, index) => (
                        <option key={catalogOptionKey("plant", plant, index)} value={String(getCatalogId(plant, ["plantId", "plant_id", "plantID", "plantid", "id"]) ?? "")}>{getCatalogLabel(plant)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "plant", catalogs.plants, ["plantId", "plant_id", "plantID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Área</span>
                  {canEdit ? (
                    <select
                      value={form.areaId ?? ""}
                      onChange={(event) => handleChange("areaId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar área</option>
                      {plantAreas.map((area, index) => (
                        <option key={catalogOptionKey("area", area, index)} value={String(getCatalogId(area, ["areaId", "area_id", "areaID", "areaid", "id"]) ?? "")}>{getCatalogLabel(area)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "area", catalogs.areas, ["areaId", "area_id", "areaID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Sector</span>
                  {canEdit ? (
                    <select
                      value={form.sectorId ?? ""}
                      onChange={(event) => handleChange("sectorId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar sector</option>
                      {areaSectors.map((sector, index) => (
                        <option key={catalogOptionKey("sector", sector, index)} value={String(getCatalogId(sector, ["sectorId", "sector_id", "sectorID", "sectorid", "id"]) ?? "")}>{getCatalogLabel(sector)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "sector", catalogs.sectors, ["sectorId", "sector_id", "sectorID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Tipo</span>
                  {canEdit ? (
                    <select
                      value={form.typeId ?? ""}
                      onChange={(event) => handleChange("typeId", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar tipo</option>
                      {catalogs.vehicleTypes.map((type, index) => (
                        <option key={catalogOptionKey("vehicletype", type, index)} value={String(getCatalogId(type, ["typeId", "type_id", "typeID", "typeid", "vehicleTypeId", "vehicle_type_id", "vehicleTypeID", "vehicletypeid", "id"]) ?? "")}>{getCatalogLabel(type)}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {getVehicleRelationLabel(selectedVehicle, "vehicleType", catalogs.vehicleTypes, ["typeId", "type_id", "typeID", "vehicleTypeId", "vehicle_type_id", "vehicleTypeID", "id"]) }
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Año</span>
                  {canEdit ? (
                    <input
                      value={form.modelYear ?? ""}
                      onChange={(event) => handleChange("modelYear", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.modelYear || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Motor</span>
                  {canEdit ? (
                    <input
                      value={form.motorCode ?? ""}
                      onChange={(event) => handleChange("motorCode", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.motorCode || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Uso Horas</span>
                  {canEdit ? (
                    <input
                      value={form.useHours ?? ""}
                      onChange={(event) => handleChange("useHours", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.useHours || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Observación</span>
                  {canEdit ? (
                    <input
                      value={form.observation ?? ""}
                      onChange={(event) => handleChange("observation", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.observation || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Propiedad</span>
                  {canEdit ? (
                    <input
                      value={form.property ?? ""}
                      onChange={(event) => handleChange("property", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.property || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Tag</span>
                  {canEdit ? (
                    <input
                      value={form.tag ?? ""}
                      onChange={(event) => handleChange("tag", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.tag || "-"}
                    </div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2 xl:col-span-3">
                  <span>Ubicación SAP</span>
                  {canEdit ? (
                    <input
                      value={form.sapPmFunctionalLocation ?? ""}
                      onChange={(event) => handleChange("sapPmFunctionalLocation", event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      {form.sapPmFunctionalLocation || "-"}
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Empresa</span>
                  {canEdit ? (
                    <input value={form.companyId ?? ""} onChange={(event) => handleChange("companyId", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.companyId || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Tipo de combustible</span>
                  {canEdit ? (
                    <input value={form.fuelType ?? ""} onChange={(event) => handleChange("fuelType", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.fuelType || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Capacidad tanque</span>
                  {canEdit ? (
                    <input value={form.fuelTank ?? ""} onChange={(event) => handleChange("fuelTank", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.fuelTank || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>HP</span>
                  {canEdit ? (
                    <input value={form.hp ?? ""} onChange={(event) => handleChange("hp", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.hp || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Motor cm3</span>
                  {canEdit ? (
                    <input value={form.motorCm3 ?? ""} onChange={(event) => handleChange("motorCm3", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.motorCm3 || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Torque Nm</span>
                  {canEdit ? (
                    <input value={form.torkNm ?? ""} onChange={(event) => handleChange("torkNm", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.torkNm || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Vol eff</span>
                  {canEdit ? (
                    <input value={form.volEff ?? ""} onChange={(event) => handleChange("volEff", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.volEff || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Gas ciudad</span>
                  {canEdit ? (
                    <input value={form.gasCity ?? ""} onChange={(event) => handleChange("gasCity", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.gasCity || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Gas promedio</span>
                  {canEdit ? (
                    <input value={form.gasAvg ?? ""} onChange={(event) => handleChange("gasAvg", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.gasAvg || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Gas ruta</span>
                  {canEdit ? (
                    <input value={form.gasHwy ?? ""} onChange={(event) => handleChange("gasHwy", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.gasHwy || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>CO2</span>
                  {canEdit ? (
                    <input value={form.co2 ?? ""} onChange={(event) => handleChange("co2", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.co2 || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Imagen grande</span>
                  {canEdit ? (
                    <input value={form.linkBigImg ?? ""} onChange={(event) => handleChange("linkBigImg", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.linkBigImg || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Imagen chica</span>
                  {canEdit ? (
                    <input value={form.linkSmallImg ?? ""} onChange={(event) => handleChange("linkSmallImg", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.linkSmallImg || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Dispositivo</span>
                  {canEdit ? (
                    <input value={form.deviceId ?? ""} onChange={(event) => handleChange("deviceId", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.deviceId || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Teléfono dispositivo</span>
                  {canEdit ? (
                    <input value={form.devicePhone ?? ""} onChange={(event) => handleChange("devicePhone", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.devicePhone || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Horómetro lector</span>
                  {canEdit ? (
                    <input value={form.horometerReader ?? ""} onChange={(event) => handleChange("horometerReader", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.horometerReader || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Horas chequeadas</span>
                  {canEdit ? (
                    <input value={form.hoursChecked ?? ""} onChange={(event) => handleChange("hoursChecked", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.hoursChecked || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Horas telemétricas</span>
                  {canEdit ? (
                    <input value={form.telemetryHours ?? ""} onChange={(event) => handleChange("telemetryHours", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.telemetryHours || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Horas plataforma</span>
                  {canEdit ? (
                    <input value={form.platformHours ?? ""} onChange={(event) => handleChange("platformHours", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.platformHours || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Diferencia horas</span>
                  {canEdit ? (
                    <input value={form.diffHours ?? ""} onChange={(event) => handleChange("diffHours", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.diffHours || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Latitud</span>
                  {canEdit ? (
                    <input value={form.lastLatitude ?? ""} onChange={(event) => handleChange("lastLatitude", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.lastLatitude || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Longitud</span>
                  {canEdit ? (
                    <input value={form.lastLongitude ?? ""} onChange={(event) => handleChange("lastLongitude", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.lastLongitude || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Fecha</span>
                  {canEdit ? (
                    <input value={form.date ?? ""} onChange={(event) => handleChange("date", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.date || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Odómetro</span>
                  {canEdit ? (
                    <input value={form.odometer ?? ""} onChange={(event) => handleChange("odometer", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.odometer || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Status</span>
                  {canEdit ? (
                    <input value={form.status ?? ""} onChange={(event) => handleChange("status", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.status || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Fecha status</span>
                  {canEdit ? (
                    <input value={form.dateStatus ?? ""} onChange={(event) => handleChange("dateStatus", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.dateStatus || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Load status</span>
                  {canEdit ? (
                    <input value={form.loadStatus ?? ""} onChange={(event) => handleChange("loadStatus", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.loadStatus || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Load time</span>
                  {canEdit ? (
                    <input value={form.loadTime ?? ""} onChange={(event) => handleChange("loadTime", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.loadTime || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>UACS antes</span>
                  {canEdit ? (
                    <input value={form.uacsBefore ?? ""} onChange={(event) => handleChange("uacsBefore", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.uacsBefore || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>UACS ahora</span>
                  {canEdit ? (
                    <input value={form.uacsNow ?? ""} onChange={(event) => handleChange("uacsNow", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.uacsNow || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Última actualización UACS</span>
                  {canEdit ? (
                    <input value={form.uacsLastUpdate ?? ""} onChange={(event) => handleChange("uacsLastUpdate", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.uacsLastUpdate || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Última actualización tareas</span>
                  {canEdit ? (
                    <input value={form.tasksLastUpdate ?? ""} onChange={(event) => handleChange("tasksLastUpdate", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.tasksLastUpdate || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Odometer checked</span>
                  {canEdit ? (
                    <input value={form.odometerChecked ?? ""} onChange={(event) => handleChange("odometerChecked", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.odometerChecked || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Mile reader</span>
                  {canEdit ? (
                    <input value={form.mileReader ?? ""} onChange={(event) => handleChange("mileReader", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.mileReader || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Geo fence platform</span>
                  {canEdit ? (
                    <input value={form.geoFencePlatform ?? ""} onChange={(event) => handleChange("geoFencePlatform", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.geoFencePlatform || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Último hook</span>
                  {canEdit ? (
                    <input value={form.lastHookedBy ?? ""} onChange={(event) => handleChange("lastHookedBy", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.lastHookedBy || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Zone alert</span>
                  {canEdit ? (
                    <input value={form.zoneAlert ?? ""} onChange={(event) => handleChange("zoneAlert", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.zoneAlert || "-"}</div>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  <span>Pin 13</span>
                  {canEdit ? (
                    <input value={form.pin13 ?? ""} onChange={(event) => handleChange("pin13", event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{form.pin13 || "-"}</div>
                  )}
                </label>
              </div>

              {!canEdit && selectedVehicle ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Datos adicionales del vehículo</h3>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Horómetro lector", form.horometerReader],
                      ["Horas chequeadas", form.hoursChecked],
                      ["Horas telemétricas", form.telemetryHours],
                      ["Horas plataforma", form.platformHours],
                      ["Diferencia horas", form.diffHours],
                      ["Latitud", form.lastLatitude],
                      ["Longitud", form.lastLongitude],
                      ["Fecha", form.date],
                      ["Odometer", form.odometer],
                      ["Status", form.status],
                      ["Fecha status", form.dateStatus],
                      ["Load status", form.loadStatus],
                      ["Load time", form.loadTime],
                      ["UACS antes", form.uacsBefore],
                      ["UACS ahora", form.uacsNow],
                      ["Última actualización UACS", form.uacsLastUpdate],
                      ["Última actualización tareas", form.tasksLastUpdate],
                      ["Odometer checked", form.odometerChecked],
                      ["Mile reader", form.mileReader],
                      ["Geo fence platform", form.geoFencePlatform],
                      ["Último hook", form.lastHookedBy],
                      ["Zone alert", form.zoneAlert],
                      ["Pin 13", form.pin13],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                        <div className="mt-1 text-sm text-slate-800">{value || "-"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Limpiar
                </button>
                {(isCreating || isEditing) ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : isCreating ? "Crear equipo" : "Guardar cambios"}
                  </button>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}