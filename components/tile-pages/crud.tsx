"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

type CatalogKey = "make" | "model" | "submodel" | "country" | "plant" | "area" | "sector" | "vehicleType";

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

type CatalogConfig = {
  label: string;
  route: string;
  idField: string;
  parentKey?: "makeId" | "modelId" | "countryId" | "plantId" | "areaId";
  parentLabel?: string;
};

const catalogIdFieldMap: Record<CatalogKey, string> = {
  make: "makeId",
  model: "modelId",
  submodel: "submodelId",
  country: "countryId",
  plant: "plantId",
  area: "areaId",
  sector: "sectorId",
  vehicleType: "typeId",
};

const catalogFields: Record<CatalogKey, string[]> = {
  make: ["makeId", "description", "linkLogo"],
  model: ["modelId", "makeId", "description"],
  submodel: ["submodelId", "modelId", "description", "fuelType", "fuelTank", "hp", "motorCm3", "torkNm", "volEff", "gasCity", "gasAvg", "gasHwy", "co2", "linkBigImg", "linkSmallImg"],
  country: ["countryId", "description"],
  plant: ["plantId", "countryId", "description"],
  area: ["areaId", "plantId", "description"],
  sector: ["sectorId", "areaId", "description", "costCenter", "t1", "t2", "t3"],
  vehicleType: ["typeId", "description"],
};

const catalogConfig: Record<CatalogKey, CatalogConfig> = {
  make: { label: "Marca", route: "/api/make", idField: "makeId" },
  model: { label: "Modelo", route: "/api/model", idField: "modelId", parentKey: "makeId", parentLabel: "Marca" },
  submodel: { label: "Submodelo", route: "/api/submodel", idField: "submodelId", parentKey: "modelId", parentLabel: "Modelo" },
  country: { label: "País", route: "/api/country", idField: "countryId" },
  plant: { label: "Planta", route: "/api/plant", idField: "plantId", parentKey: "countryId", parentLabel: "País" },
  area: { label: "Área", route: "/api/area", idField: "areaId", parentKey: "plantId", parentLabel: "Planta" },
  sector: { label: "Sector", route: "/api/sector", idField: "sectorId", parentKey: "areaId", parentLabel: "Área" },
  vehicleType: { label: "Vehicle Type", route: "/api/vehicle-type", idField: "typeId" },
};

const formFieldLabels: Record<string, string> = {
  makeId: "Make ID",
  modelId: "Model ID",
  submodelId: "Submodel ID",
  countryId: "Country ID",
  plantId: "Plant ID",
  areaId: "Area ID",
  sectorId: "Sector ID",
  typeId: "Type ID",
  description: "Descripción",
  linkLogo: "Link logo",
  linkBigImg: "Link imagen grande",
  linkSmallImg: "Link imagen chica",
  fuelType: "Fuel type",
  fuelTank: "Fuel tank",
  hp: "HP",
  motorCm3: "Motor cm3",
  torkNm: "Torque Nm",
  volEff: "Vol. eff.",
  gasCity: "Gas city",
  gasAvg: "Gas avg",
  gasHwy: "Gas hwy",
  co2: "CO2",
  costCenter: "Centro de costo",
  t1: "T1",
  t2: "T2",
  t3: "T3",
};

const emptyFormState = {
  id: "",
  makeId: "",
  modelId: "",
  submodelId: "",
  countryId: "",
  plantId: "",
  areaId: "",
  sectorId: "",
  typeId: "",
  description: "",
  linkLogo: "",
  linkBigImg: "",
  linkSmallImg: "",
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
  costCenter: "",
  t1: "",
  t2: "",
  t3: "",
};

function toText(value: unknown, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function normalizeCatalogPayload(payload: unknown): CatalogItem[] {
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
        if (["description", "name", "makeId", "modelId", "submodelId", "countryId", "plantId", "areaId", "sectorId", "typeId", "id"].some((field) => field in nested)) {
          return [nested as CatalogItem];
        }
      }
    }

    const directMatches = Object.values(record).find((value) => Array.isArray(value));
    if (Array.isArray(directMatches)) {
      return directMatches as CatalogItem[];
    }
  }

  return [];
}

function readEntityField(item: CatalogItem, keys: string[]) {
  for (const key of keys) {
    const value = (item as Record<string, unknown>)[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return undefined;
}

function getCatalogId(item: CatalogItem, idField = "") {
  const field = idField || Object.keys(catalogIdFieldMap).map((key) => catalogIdFieldMap[key as CatalogKey]).find((candidate) => candidate in item || Object.keys(item).some((key) => normalizeLookupKey(key) === normalizeLookupKey(candidate)));
  const value = field ? readEntityField(item, [field, field.toLowerCase(), field.toUpperCase(), field.replace(/Id$/, "ID")]) : undefined;
  if (value !== undefined) {
    return String(value);
  }

  const fallbackValue = readEntityField(item, ["id", "ID", "makeId", "modelId", "submodelId", "countryId", "plantId", "areaId", "sectorId", "typeId"]);
  return fallbackValue !== undefined ? String(fallbackValue) : "";
}

function normalizeLookupKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function getCatalogLabel(item: CatalogItem) {
  const labelValue = readEntityField(item, ["description", "name", "description_es", "name_es", "label", "title", "value", "code"]);
  if (labelValue !== undefined) {
    return String(labelValue);
  }

  return "Sin nombre";
}

function buildFormFromItem(item: CatalogItem | null, catalogKey: CatalogKey) {
  const nextState = { ...emptyFormState };

  if (!item) {
    return nextState;
  }

  for (const field of catalogFields[catalogKey]) {
    const value = (item as Record<string, unknown>)[field];
    nextState[field as keyof typeof nextState] = toText(value);
  }

  nextState.id = getCatalogId(item, catalogIdFieldMap[catalogKey]);
  return nextState;
}

function getOptionLabel(item: CatalogItem) {
  const label = getCatalogLabel(item);
  return label === "" || label === null || label === undefined ? "Sin nombre" : String(label);
}

function toPayload(form: Record<string, string>, catalogKey?: CatalogKey) {
  const payload: Record<string, unknown> = {};
  const numericKeys = new Set(["makeId", "modelId", "submodelId", "countryId", "plantId", "areaId", "sectorId", "typeId", "fuelTank", "hp", "motorCm3", "torkNm", "volEff", "gasCity", "gasAvg", "gasHwy", "co2", "costCenter", "t1", "t2", "t3"]);
  const uiOnlyKeys = new Set(catalogKey === "submodel" ? ["makeId"] : catalogKey === "sector" ? ["plantId"] : []);

  Object.entries(form).forEach(([key, value]) => {
    if (key === "id") {
      if (value.trim()) {
        payload.id = value.trim();
      }
      return;
    }

    if (uiOnlyKeys.has(key)) {
      return;
    }

    if (value === null || value === undefined || value.trim() === "") {
      return;
    }

    payload[key] = numericKeys.has(key) ? Number(value) : value.trim();
  });

  return payload;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} en ${url}`);
  }
  return response.json();
}

export default function TileModule({ title }: TileModuleProps) {
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogKey>("make");
  const [catalogItems, setCatalogItems] = useState<Record<CatalogKey, CatalogItem[]>>({
    make: [],
    model: [],
    submodel: [],
    country: [],
    plant: [],
    area: [],
    sector: [],
    vehicleType: [],
  });
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [form, setForm] = useState<Record<string, string>>({ ...emptyFormState });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCatalogs = async () => {
      try {
        const nextEntries = await Promise.all(
          (Object.entries(catalogConfig) as [CatalogKey, CatalogConfig][]).map(async ([key, config]) => {
            const response = await fetchJson(config.route);
            return [key, normalizeCatalogPayload(response)] as const;
          })
        );

        if (!mounted) {
          return;
        }

        const nextState = {} as Record<CatalogKey, CatalogItem[]>;
        for (const [key, value] of nextEntries) {
          nextState[key] = value;
        }

        setCatalogItems(nextState);
        setSelectedItemId("");
        setForm({ ...emptyFormState });
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar los catálogos");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCatalogs();
    return () => {
      mounted = false;
    };
  }, []);

  const currentCatalog = catalogConfig[selectedCatalog];

  const visibleItems = useMemo(() => {
    return catalogItems[selectedCatalog] ?? [];
  }, [catalogItems, selectedCatalog]);

  const handleCatalogChange = (nextCatalog: CatalogKey) => {
    setSelectedCatalog(nextCatalog);
    setSelectedItemId("");
    setForm({ ...emptyFormState });
  };

  const handleSelectItem = (item: CatalogItem) => {
    const entityId = getCatalogId(item, catalogIdFieldMap[selectedCatalog]);
    const nextForm = buildFormFromItem(item, selectedCatalog);

    if (selectedCatalog === "submodel") {
      const model = catalogItems.model.find((candidate) => getCatalogId(candidate) === String((item as CatalogItem).modelId ?? ""));
      nextForm.makeId = model?.makeId ? String(model.makeId) : "";
    }

    if (selectedCatalog === "sector") {
      const area = catalogItems.area.find((candidate) => getCatalogId(candidate) === String((item as CatalogItem).areaId ?? ""));
      nextForm.plantId = area?.plantId ? String(area.plantId) : "";
    }

    setSelectedItemId(entityId);
    setForm(nextForm);
    setError(null);
  };

  const handleNew = () => {
    setSelectedItemId("");
    setForm({ ...emptyFormState });
    setError(null);
  };

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const endpoint = currentCatalog.route;
      const idField = catalogIdFieldMap[selectedCatalog];
      const payload = toPayload(form, selectedCatalog);

      if (selectedCatalog === "sector") {
        delete payload.plantId;
      }

      if (selectedCatalog === "submodel") {
        delete payload.makeId;
      }

      if (selectedItemId && idField && !payload[idField]) {
        payload[idField] = Number(selectedItemId);
      }
      const isEditing = Boolean(selectedItemId || form.id);
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo guardar el registro");
      }

      const nextData = await fetchJson(endpoint);
      const nextItems = normalizeCatalogPayload(nextData);
      setCatalogItems((current) => ({ ...current, [selectedCatalog]: nextItems }));
      const saved = nextItems.find((item) => getCatalogId(item, idField) === String(selectedItemId || form.id || "")) ?? nextItems[0] ?? null;
      if (saved) {
        const nextId = getCatalogId(saved, idField);
        setSelectedItemId(nextId);
        setForm(buildFormFromItem(saved, selectedCatalog));
      } else {
        setSelectedItemId("");
        setForm({ ...emptyFormState });
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItemId) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const idField = catalogIdFieldMap[selectedCatalog];
      const response = await fetch(`${currentCatalog.route}?${encodeURIComponent(idField)}=${encodeURIComponent(selectedItemId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo eliminar el registro");
      }

      const nextItems = (catalogItems[selectedCatalog] ?? []).filter((item) => getCatalogId(item) !== selectedItemId);
      setCatalogItems((current) => ({ ...current, [selectedCatalog]: nextItems }));
      setSelectedItemId("");
      setForm({ ...emptyFormState });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const parentOptions = (selectedCatalog === "model"
    ? catalogItems.make
    : selectedCatalog === "submodel"
      ? catalogItems.model.filter((item) => !form.makeId || String(item.makeId ?? "") === String(form.makeId))
      : selectedCatalog === "plant"
        ? catalogItems.country
        : selectedCatalog === "area"
          ? catalogItems.plant.filter((item) => !form.plantId || String(item.plantId ?? "") === String(form.plantId))
          : selectedCatalog === "sector"
            ? catalogItems.area.filter((item) => !form.plantId || String(item.plantId ?? "") === String(form.plantId))
            : []) as CatalogItem[];

  const renderParentSelector = () => {
    const parentConfig = currentCatalog.parentKey;
    if (!parentConfig) {
      return null;
    }

    const parentFieldMap: Record<string, string> = {
      makeId: "makeId",
      modelId: "modelId",
      countryId: "countryId",
      plantId: "plantId",
      areaId: "areaId",
    };

    const parentField = parentFieldMap[parentConfig] ?? parentConfig;

    return (
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        <span>{currentCatalog.parentLabel ?? "Relacionado"}</span>
        <select
          value={form[parentField] ?? ""}
          onChange={(event) => handleChange(parentField, event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">Seleccionar {currentCatalog.parentLabel ?? "relación"}</option>
          {parentOptions.map((item) => {
            const itemId = getCatalogId(item, parentFieldMap[parentConfig] ?? catalogIdFieldMap[selectedCatalog]);
            return (
              <option key={`${selectedCatalog}-${itemId}`} value={itemId}>
                {getOptionLabel(item)}
              </option>
            );
          })}
        </select>
      </label>
    );
  };

  const makeOptions = catalogItems.make;
  const plantSelectorOptions = catalogItems.plant;
  const areaSelectorOptions = catalogItems.area.filter((item) => !form.plantId || String(item.plantId ?? "") === String(form.plantId));
  const modelSelectorOptions = catalogItems.model.filter((item) => !form.makeId || String(item.makeId ?? "") === String(form.makeId));

  const formFields = catalogFields[selectedCatalog];

  return (
    <div className="mx-auto h-[calc(100vh-32px)] w-full max-w-[1700px] overflow-hidden rounded-2xl border border-[color:var(--tile-border)] bg-[color:var(--surface)] shadow-sm">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modulo</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
          </div>
          <Link href="/" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Volver al Launchpad
          </Link>
        </header>

        <div className="grid h-full min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] overflow-hidden">
          <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">Catálogos</h2>
              <button type="button" onClick={handleNew} className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                Nuevo
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              {(Object.entries(catalogConfig) as [CatalogKey, CatalogConfig][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCatalogChange(key)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    selectedCatalog === key ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{config.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-600">
                      {catalogItems[key]?.length ?? 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4">
            <div className="mx-auto max-w-6xl pb-6">
              {error ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Catálogo</p>
                  <h2 className="text-xl font-semibold text-slate-900">{currentCatalog.label}</h2>
                </div>
                {selectedItemId ? (
                  <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-3 py-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">Listado</h3>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-sm text-slate-500">Cargando…</div>
                    ) : visibleItems.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">No hay registros.</div>
                    ) : (
                      visibleItems.map((item, index) => {
                        const rowId = getCatalogId(item, currentCatalog.idField);

                        return (
                          <button
                            key={`${selectedCatalog}-${rowId || "no-id"}-${index}`}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className={`w-full border-b border-slate-100 px-3 py-3 text-left transition ${
                              selectedItemId === rowId ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-900">{getOptionLabel(item)}</div>
                            <div className="mt-1 text-xs text-slate-500">{rowId || "Sin id"}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
                      {selectedItemId ? "Editar" : "Crear"}
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedCatalog === "submodel" ? (
                      <>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span>Marca</span>
                          <select
                            value={form.makeId ?? ""}
                            onChange={(event) => {
                              const nextMakeId = event.target.value;
                              handleChange("makeId", nextMakeId);
                              handleChange("modelId", "");
                            }}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">Seleccionar marca</option>
                            {makeOptions.map((item) => {
                              const itemId = getCatalogId(item, "makeId");
                              return (
                                <option key={`make-${itemId}`} value={itemId}>
                                  {getOptionLabel(item)}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span>Modelo</span>
                          <select
                            value={form.modelId ?? ""}
                            onChange={(event) => handleChange("modelId", event.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">Seleccionar modelo</option>
                            {modelSelectorOptions.map((item) => {
                              const itemId = getCatalogId(item, "modelId");
                              return (
                                <option key={`model-${itemId}`} value={itemId}>
                                  {getOptionLabel(item)}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      </>
                    ) : selectedCatalog === "sector" ? (
                      <>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span>Planta</span>
                          <select
                            value={form.plantId ?? ""}
                            onChange={(event) => {
                              const nextPlantId = event.target.value;
                              handleChange("plantId", nextPlantId);
                              handleChange("areaId", "");
                            }}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">Seleccionar planta</option>
                            {plantSelectorOptions.map((item) => {
                              const itemId = getCatalogId(item, "plantId");
                              return (
                                <option key={`plant-${itemId}`} value={itemId}>
                                  {getOptionLabel(item)}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span>Área</span>
                          <select
                            value={form.areaId ?? ""}
                            onChange={(event) => handleChange("areaId", event.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">Seleccionar área</option>
                            {areaSelectorOptions.map((item) => {
                              const itemId = getCatalogId(item, "areaId");
                              return (
                                <option key={`area-${itemId}`} value={itemId}>
                                  {getOptionLabel(item)}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      </>
                    ) : (
                      renderParentSelector()
                    )}

                    {formFields
                      .filter((field) => {
                        if (selectedCatalog === "submodel" && field === "modelId") return false;
                        if (selectedCatalog === "sector" && field === "areaId") return false;
                        if (currentCatalog.parentKey && field === currentCatalog.parentKey) return false;
                        return true;
                      })
                      .map((field) => {
                        const isNumericField = ["makeId", "modelId", "submodelId", "countryId", "plantId", "areaId", "sectorId", "typeId", "fuelTank", "hp", "motorCm3", "torkNm", "volEff", "gasCity", "gasAvg", "gasHwy", "co2", "costCenter", "t1", "t2", "t3"].includes(field);

                        return (
                          <label key={`${selectedCatalog}-${field}`} className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                            <span>{formFieldLabels[field] ?? field}</span>
                            <input
                              type={isNumericField ? "number" : "text"}
                              step={field === "volEff" || field === "gasCity" || field === "gasAvg" || field === "gasHwy" || field === "co2" ? "0.01" : undefined}
                              value={form[field] ?? ""}
                              onChange={(event) => handleChange(field, event.target.value)}
                              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                              placeholder={field === "description" ? "Ingrese descripción" : `Ingrese ${formFieldLabels[field] ?? field}`}
                            />
                          </label>
                        );
                      })}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={handleNew} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Limpiar
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
                      {saving ? "Guardando..." : selectedItemId ? "Guardar cambios" : "Crear registro"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
