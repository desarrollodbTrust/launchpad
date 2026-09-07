"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

type MaintenanceType = {
  maintenanceTypeId?: number | string | null;
  id?: number | string | null;
  name?: string | null;
  usesKm?: boolean | number | string | null;
  usesHours?: boolean | number | string | null;
  usesDate?: boolean | number | string | null;
  active?: boolean | number | string | null;
  [key: string]: unknown;
};

type MaintenanceRecord = {
  maintenanceId?: number | string | null;
  description?: string | null;
  maintenanceTypeId?: number | string | null;
  tipo?: number | string | null;
  frequency?: number | string | null;
  preAviso?: number | string | null;
  relationType?: number | string | null;
  [key: string]: unknown;
};

type MaintenanceAssignment = {
  vin?: string | null;
  maintenanceId?: number | string | null;
  description?: string | null;
  typeName?: string | null;
  status?: string | null;
  lastKm?: number | string | null;
  lastDate?: string | null;
  lastHours?: string | null;
  currentKm?: number | string | null;
  currentHours?: number | string | null;
  nextDueKm?: number | string | null;
  nextDueHours?: number | string | null;
  nextDueDate?: string | null;
  remainingKm?: number | string | null;
  remainingHours?: number | string | null;
  remainingDays?: number | string | null;
  [key: string]: unknown;
};

const emptyMaintenanceForm = {
  description: "",
  tipo: "1",
  relationType: "1",
  frequencyKm: "10000",
  preAvisoKm: "1000",
  frequencyHours: "10000",
  preAvisoHours: "1000",
  frequencyMonths: "12",
  preAvisoDays: "30",
};

const emptyAssignmentForm = {
  vin: "",
  maintenanceId: "",
  lastKm: "",
  lastDate: "",
  lastHours: "",
};

function normalizeInstantForApi(value: string): string {
  const trimmed = value?.trim?.() ?? "";
  if (!trimmed) {
    return "";
  }

  const candidate = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`;
  const asDate = new Date(candidate);

  if (Number.isNaN(asDate.getTime())) {
    return trimmed;
  }

  return asDate.toISOString();
}

function normalizeArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["data", "items", "results", "records", "content", "list", "rows", "value"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

export default function TileModule({ title, subtitle }: TileModuleProps) {
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [assignments, setAssignments] = useState<MaintenanceAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Array<{ vin?: string; licPlate?: string; [key: string]: unknown }>>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenanceForm);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<number | string | null>(null);
  const [showCreateMaintenanceForm, setShowCreateMaintenanceForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadMaintenanceTypes = async () => {
    try {
      const response = await fetch("/api/maintenance-type", { cache: "no-store" });
      const payload = await response.json();
      const items = normalizeArrayPayload(payload) as MaintenanceType[];
      setMaintenanceTypes(items);
      return items;
    } catch (error) {
      console.error("Error cargando tipos de mantenimiento", error);
      return [];
    }
  };

  const loadMaintenances = async () => {
    try {
      const response = await fetch("/api/mantenimiento", { cache: "no-store" });
      const payload = await response.json();
      const items = normalizeArrayPayload(payload) as MaintenanceRecord[];
      setMaintenances(items);
      return items;
    } catch (error) {
      console.error("Error cargando mantenimientos", error);
      setMessage("No se pudo cargar la lista de mantenimientos.");
      return [];
    }
  };

  const loadAssignments = async (vin?: string) => {
    try {
      const params = new URLSearchParams();
      if (vin && vin.trim()) {
        params.set("vin", vin.trim());
      }

      const response = await fetch(`/api/maintenance-status${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
      const payload = await response.json();
      const items = normalizeArrayPayload(payload) as MaintenanceAssignment[];
      setAssignments(items);
    } catch (error) {
      console.error("Error cargando asignaciones", error);
    }
  };

  useEffect(() => {
    const loadVehicleOptions = async () => {
      try {
        const response = await fetch("/api/vehicle-view", { cache: "no-store" });
        const payload = await response.json();
        const items = normalizeArrayPayload(payload) as Array<{ vin?: string; licPlate?: string; [key: string]: unknown }>;
        setVehicles(items.filter((vehicle) => vehicle.vin || vehicle.licPlate));
      } catch (error) {
        console.error("Error cargando vehicles", error);
      }
    };

    const loadInitialData = async () => {
      await loadMaintenanceTypes();
      await loadMaintenances();
      await loadAssignments();
      await loadVehicleOptions();
    };

    void loadInitialData();
  }, []);

  const selectedMaintenanceType = maintenanceTypes.find((type) => {
    const id = type.maintenanceTypeId ?? type.id;
    return String(id ?? "") === String(maintenanceForm.tipo ?? "");
  });

  const usesKm = Boolean(selectedMaintenanceType?.usesKm || selectedMaintenanceType?.usesKm === 1 || selectedMaintenanceType?.usesKm === "true");
  const usesHours = Boolean(selectedMaintenanceType?.usesHours || selectedMaintenanceType?.usesHours === 1 || selectedMaintenanceType?.usesHours === "true");
  const usesDate = Boolean(selectedMaintenanceType?.usesDate || selectedMaintenanceType?.usesDate === 1 || selectedMaintenanceType?.usesDate === "true");
  const isCombinedReminderType = (usesKm && usesDate) || (usesHours && usesDate);
  const primaryMetricLabel = usesKm ? "KM" : usesHours ? "horas" : usesDate ? "meses" : "valor";

  const handleMaintenanceChange = (field: keyof typeof emptyMaintenanceForm, value: string) => {
    setMaintenanceForm((current) => ({ ...current, [field]: value }));
  };

  const handleAssignmentChange = (field: keyof typeof emptyAssignmentForm, value: string) => {
    setAssignmentForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateMaintenance = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const selectedTypeId = Number(maintenanceForm.tipo || 1);
      const frequencyKmValue = Number(maintenanceForm.frequencyKm || 0);
      const preAvisoKmValue = Number(maintenanceForm.preAvisoKm || 0);
      const frequencyHoursValue = Number(maintenanceForm.frequencyHours || 0);
      const preAvisoHoursValue = Number(maintenanceForm.preAvisoHours || 0);
      const frequencyMonthsValue = Number(maintenanceForm.frequencyMonths || 0);
      const preAvisoDaysValue = Number(maintenanceForm.preAvisoDays || 0);

      const payload: Record<string, unknown> = {
        description: maintenanceForm.description.trim(),
        maintenanceTypeId: selectedTypeId,
        typeId: selectedTypeId,
        tipo: selectedTypeId,
        relationType: Number(maintenanceForm.relationType || 1),
        usesKm,
        usesHours,
        usesDate,
      };

      if (usesKm) {
        payload.frequencyKm = frequencyKmValue;
        payload.preAvisoKm = preAvisoKmValue;
        payload.frequency = frequencyKmValue;
        payload.preAviso = preAvisoKmValue;
      }

      if (usesHours) {
        payload.frequencyHours = frequencyHoursValue;
        payload.preAvisoHours = preAvisoHoursValue;
        payload.frequency = frequencyHoursValue;
        payload.preAviso = preAvisoHoursValue;
      }

      if (usesDate) {
        payload.frequencyMonths = frequencyMonthsValue;
        payload.preAvisoDays = preAvisoDaysValue;
        payload.frequency = frequencyMonthsValue;
        payload.preAviso = preAvisoDaysValue;
      }

      const response = await fetch("/api/mantenimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(body || "No se pudo crear el mantenimiento");
      }

      setMaintenanceForm(emptyMaintenanceForm);
      setEditingMaintenanceId(null);
      setShowCreateMaintenanceForm(false);
      setMessage("Mantenimiento creado correctamente.");
      await loadMaintenances();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error creando mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaintenance = async () => {
    if (editingMaintenanceId === null || editingMaintenanceId === undefined || editingMaintenanceId === "") {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const selectedTypeId = Number(maintenanceForm.tipo || 1);
      const frequencyKmValue = Number(maintenanceForm.frequencyKm || 0);
      const preAvisoKmValue = Number(maintenanceForm.preAvisoKm || 0);
      const frequencyHoursValue = Number(maintenanceForm.frequencyHours || 0);
      const preAvisoHoursValue = Number(maintenanceForm.preAvisoHours || 0);
      const frequencyMonthsValue = Number(maintenanceForm.frequencyMonths || 0);
      const preAvisoDaysValue = Number(maintenanceForm.preAvisoDays || 0);

      const payload: Record<string, unknown> = {
        maintenanceId: Number(editingMaintenanceId),
        description: maintenanceForm.description.trim(),
        maintenanceTypeId: selectedTypeId,
        typeId: selectedTypeId,
        tipo: selectedTypeId,
        relationType: Number(maintenanceForm.relationType || 1),
        usesKm,
        usesHours,
        usesDate,
      };

      if (usesKm) {
        payload.frequencyKm = frequencyKmValue;
        payload.preAvisoKm = preAvisoKmValue;
        payload.frequency = frequencyKmValue;
        payload.preAviso = preAvisoKmValue;
      }

      if (usesHours) {
        payload.frequencyHours = frequencyHoursValue;
        payload.preAvisoHours = preAvisoHoursValue;
        payload.frequency = frequencyHoursValue;
        payload.preAviso = preAvisoHoursValue;
      }

      if (usesDate) {
        payload.frequencyMonths = frequencyMonthsValue;
        payload.preAvisoDays = preAvisoDaysValue;
        payload.frequency = frequencyMonthsValue;
        payload.preAviso = preAvisoDaysValue;
      }

      const response = await fetch(`/api/mantenimiento?maintenanceId=${encodeURIComponent(String(editingMaintenanceId))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(body || "No se pudo actualizar el mantenimiento");
      }

      setMaintenanceForm(emptyMaintenanceForm);
      setEditingMaintenanceId(null);
      setShowCreateMaintenanceForm(false);
      setMessage("Mantenimiento actualizado correctamente.");
      await loadMaintenances();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error actualizando mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const vin = assignmentForm.vin.trim();
      const maintenanceId = assignmentForm.maintenanceId.trim();

      if (!vin || !maintenanceId) {
        throw new Error("Debes completar VIN y mantenimiento para asignar.");
      }

      const payload: Record<string, unknown> = {
        vin,
        maintenanceId: Number(maintenanceId),
      };

      if (assignmentForm.lastKm && assignmentForm.lastKm.trim() !== "") {
        payload.lastKm = Number(assignmentForm.lastKm);
      }

      if (assignmentForm.lastDate && assignmentForm.lastDate.trim() !== "") {
        payload.lastDate = normalizeInstantForApi(assignmentForm.lastDate);
      }

      if (assignmentForm.lastHours && assignmentForm.lastHours.trim() !== "") {
        payload.lastHours = assignmentForm.lastHours;
      }

      const response = await fetch("/api/mant-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(body || "No se pudo asignar el mantenimiento al vehículo");
      }

      setAssignmentForm(emptyAssignmentForm);
      setVehicleSearch("");
      setShowAssignmentForm(false);
      setMessage("Mantenimiento asignado correctamente.");
      await loadAssignments(vin);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error asignando mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMaintenance = (item: MaintenanceRecord) => {
    const itemRecord = item as Record<string, unknown>;
    const selectedTypeId = String(itemRecord.maintenanceTypeId ?? itemRecord.typeId ?? item.tipo ?? "1");
    const frequencyKmValue = itemRecord.frequencyKm ?? itemRecord.frequency ?? "10000";
    const preAvisoKmValue = itemRecord.preAvisoKm ?? itemRecord.preAviso ?? "1000";
    const frequencyHoursValue = itemRecord.frequencyHours ?? itemRecord.frequency ?? "10000";
    const preAvisoHoursValue = itemRecord.preAvisoHours ?? itemRecord.preAviso ?? "1000";
    const frequencyMonthsValue = itemRecord.frequencyMonths ?? itemRecord.frequency ?? "12";
    const preAvisoDaysValue = itemRecord.preAvisoDays ?? itemRecord.preAviso ?? "30";

    setEditingMaintenanceId(item.maintenanceId ?? null);
    setMaintenanceForm({
      description: item.description ?? "",
      tipo: selectedTypeId,
      relationType: String(item.relationType ?? "1"),
      frequencyKm: String(frequencyKmValue),
      preAvisoKm: String(preAvisoKmValue),
      frequencyHours: String(frequencyHoursValue),
      preAvisoHours: String(preAvisoHoursValue),
      frequencyMonths: String(frequencyMonthsValue),
      preAvisoDays: String(preAvisoDaysValue),
    });
    setMessage("Editando mantenimiento existente.");
  };

  const handleDeleteMaintenance = async (maintenanceId: number | string | null | undefined) => {
    if (maintenanceId === null || maintenanceId === undefined || maintenanceId === "") {
      return;
    }

    try {
      const response = await fetch(`/api/mantenimiento?maintenanceId=${encodeURIComponent(String(maintenanceId))}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Error eliminando mantenimiento");
      }

      if (editingMaintenanceId === maintenanceId) {
        setEditingMaintenanceId(null);
        setMaintenanceForm(emptyMaintenanceForm);
      }

      setMessage("Mantenimiento eliminado.");
      await loadMaintenances();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error eliminando mantenimiento.");
    }
  };

  const handleDeleteAssignment = async (vin: string, maintenanceId: number | string | null | undefined) => {
    if (!vin || maintenanceId === null || maintenanceId === undefined || maintenanceId === "") {
      return;
    }

    try {
      const response = await fetch(
        `/api/mant-equipment?vin=${encodeURIComponent(vin)}&maintenanceId=${encodeURIComponent(String(maintenanceId))}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Error eliminando la asignación");
      }

      setMessage("Asignación eliminada.");
      await loadAssignments(vin);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error eliminando la asignación.");
    }
  };

  const maintenanceDescriptionById = new Map(
    maintenances.map((item) => [String(item.maintenanceId ?? ""), item.description ?? "Sin descripción"])
  );

  const maintenanceTypeNameById = new Map(
    maintenanceTypes.map((type) => [String(type.maintenanceTypeId ?? type.id ?? ""), type.name ?? "Sin tipo"])
  );

  const vehicleLookupByVin = new Map(
    vehicles.map((vehicle) => [String(vehicle.vin ?? ""), vehicle])
  );

  const filteredVehicles = vehicles.filter((vehicle) => {
    const search = vehicleSearch.trim().toLowerCase();
    if (!search) {
      return true;
    }

    const vin = String(vehicle.vin ?? "").toLowerCase();
    const licPlate = String(vehicle.licPlate ?? "").toLowerCase();
    return vin.includes(search) || licPlate.includes(search);
  });

  const handleVehicleSearchChange = (value: string) => {
    const nextValue = value.trim();
    setVehicleSearch(nextValue);
    setShowVehicleSuggestions(nextValue.length > 0);

    if (!nextValue) {
      setAssignmentForm((current) => ({ ...current, vin: "" }));
      return;
    }

    const exactMatch = vehicles.find((vehicle) => {
      const vin = String(vehicle.vin ?? "").toLowerCase();
      const licPlate = String(vehicle.licPlate ?? "").toLowerCase();
      return vin.includes(nextValue.toLowerCase()) || licPlate.includes(nextValue.toLowerCase());
    });

    setAssignmentForm((current) => ({
      ...current,
      vin: exactMatch?.vin ? String(exactMatch.vin) : current.vin,
    }));
  };

  const handleVehicleSuggestionSelect = (vehicle: { vin?: string; licPlate?: string }) => {
    const nextVin = String(vehicle.vin ?? "");
    const nextPlate = String(vehicle.licPlate ?? "");
    setVehicleSearch(nextPlate || nextVin);
    setAssignmentForm((current) => ({ ...current, vin: nextVin }));
    setShowVehicleSuggestions(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] rounded-lg border border-[color:var(--tile-border)] bg-[color:var(--surface)] p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--tile-muted)]">Modulo</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</h1>
          {subtitle ? <p className="mt-2 text-base text-[color:var(--tile-muted)]">{subtitle}</p> : null}
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-[color:var(--tile-border)] bg-[color:var(--tile)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white"
        >
          Volver al Launchpad
        </Link>
      </div>

      {message ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="mt-8 rounded-lg border border-[color:var(--tile-border)] bg-[color:var(--tile)] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Mantenimientos existentes</h2>
          <button
            type="button"
            onClick={() => {
              setShowCreateMaintenanceForm((current) => !current);
              if (showCreateMaintenanceForm) {
                setEditingMaintenanceId(null);
                setMaintenanceForm(emptyMaintenanceForm);
              }
            }}
            className="rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-1.5 text-sm text-[color:var(--foreground)]"
          >
            {showCreateMaintenanceForm ? "Cerrar" : "Crear mantenimiento"}
          </button>
        </div>

        {showCreateMaintenanceForm ? (
          <div className="mt-4 space-y-3 rounded-md border border-[color:var(--tile-border)] bg-white p-4">
            <label className="block text-sm font-medium text-[color:var(--foreground)]">
              Descripción
              <input
                value={maintenanceForm.description}
                onChange={(event) => handleMaintenanceChange("description", event.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                placeholder="Service 10000"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[color:var(--foreground)]">
                Tipo de mantenimiento
                <select
                  value={maintenanceForm.tipo}
                  onChange={(event) => handleMaintenanceChange("tipo", event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                >
                  <option value="">Seleccione una opción</option>
                  {maintenanceTypes.map((type) => {
                    const id = String(type.maintenanceTypeId ?? type.id ?? "");
                    const label = type.name || id;
                    return (
                      <option key={id || `maintenance-type-${label}`} value={id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block text-sm font-medium text-[color:var(--foreground)]">
                Relación
                <input
                  type="number"
                  value={maintenanceForm.relationType}
                  onChange={(event) => handleMaintenanceChange("relationType", event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                />
              </label>
            </div>

            {selectedMaintenanceType ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {usesKm ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Frecuencia KM
                    <input
                      type="number"
                      value={maintenanceForm.frequencyKm}
                      onChange={(event) => handleMaintenanceChange("frequencyKm", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}

                {usesHours ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Frecuencia horas
                    <input
                      type="number"
                      value={maintenanceForm.frequencyHours}
                      onChange={(event) => handleMaintenanceChange("frequencyHours", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}

                {usesDate ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Frecuencia meses
                    <input
                      type="number"
                      value={maintenanceForm.frequencyMonths}
                      onChange={(event) => handleMaintenanceChange("frequencyMonths", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}

                {usesKm ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Pre aviso KM
                    <input
                      type="number"
                      value={maintenanceForm.preAvisoKm}
                      onChange={(event) => handleMaintenanceChange("preAvisoKm", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}

                {usesHours ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Pre aviso horas
                    <input
                      type="number"
                      value={maintenanceForm.preAvisoHours}
                      onChange={(event) => handleMaintenanceChange("preAvisoHours", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}

                {usesDate ? (
                  <label className="block text-sm font-medium text-[color:var(--foreground)]">
                    Pre aviso días
                    <input
                      type="number"
                      value={maintenanceForm.preAvisoDays}
                      onChange={(event) => handleMaintenanceChange("preAvisoDays", event.target.value)}
                      className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={editingMaintenanceId === null ? handleCreateMaintenance : handleUpdateMaintenance}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-[color:var(--tile)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] ring-1 ring-inset ring-[color:var(--tile-border)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : editingMaintenanceId === null ? "Crear mantenimiento" : "Guardar cambios"}
              </button>

              {editingMaintenanceId !== null ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMaintenanceId(null);
                    setMaintenanceForm(emptyMaintenanceForm);
                    setMessage(null);
                  }}
                  className="inline-flex items-center rounded-md border border-[color:var(--tile-border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)]"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full divide-y divide-[color:var(--tile-border)] text-left text-sm">
            <thead>
              <tr className="text-[color:var(--tile-muted)]">
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Frec. KM</th>
                <th className="px-3 py-2 font-medium">Pre aviso KM</th>
                <th className="px-3 py-2 font-medium">Frec. horas</th>
                <th className="px-3 py-2 font-medium">Pre aviso horas</th>
                <th className="px-3 py-2 font-medium">Frec. meses</th>
                <th className="px-3 py-2 font-medium">Pre aviso días</th>
                <th className="px-3 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--tile-border)]">
              {maintenances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-[color:var(--tile-muted)]">
                    No hay mantenimientos cargados.
                  </td>
                </tr>
              ) : (
                maintenances.map((item) => {
                  const itemRecord = item as Record<string, unknown>;
                  const itemTypeId = String(item.tipo ?? item.maintenanceTypeId ?? itemRecord.typeId ?? "");
                  const typeName = String(
                    maintenanceTypeNameById.get(itemTypeId) ?? itemRecord.typeName ?? itemRecord.name ?? "Sin tipo"
                  );
                  const frequencyKmValue = String(itemRecord.frequencyKm ?? "-");
                  const preAvisoKmValue = String(itemRecord.preAvisoKm ?? "-");
                  const frequencyHoursValue = String(itemRecord.frequencyHours ?? "-");
                  const preAvisoHoursValue = String(itemRecord.preAvisoHours ?? "-");
                  const frequencyMonthsValue = String(itemRecord.frequencyMonths ?? "-");
                  const preAvisoDaysValue = String(itemRecord.preAvisoDays ?? "-");

                  return (
                    <tr key={String(item.maintenanceId ?? JSON.stringify(item))} className="align-top">
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{item.description ?? "-"}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{typeName}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{frequencyKmValue}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{preAvisoKmValue}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{frequencyHoursValue}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{preAvisoHoursValue}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{frequencyMonthsValue}</td>
                      <td className="px-3 py-2 text-[color:var(--foreground)]">{preAvisoDaysValue}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Editar mantenimiento"
                            title="Editar"
                            onClick={() => {
                              setShowCreateMaintenanceForm(true);
                              handleEditMaintenance(item);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--tile-border)] bg-white text-[color:var(--foreground)] hover:bg-slate-50"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            aria-label="Eliminar mantenimiento"
                            title="Eliminar"
                            onClick={() => void handleDeleteMaintenance(item.maintenanceId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-[color:var(--tile-border)] bg-[color:var(--tile)] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Equipos con mantenimientos asignados</h2>
          <button
            type="button"
            onClick={() => setShowAssignmentForm((current) => !current)}
            className="rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-1.5 text-sm text-[color:var(--foreground)]"
          >
            {showAssignmentForm ? "Cerrar" : "Asignar mantenimiento"}
          </button>
        </div>

        {showAssignmentForm ? (
          <div className="mt-4 space-y-3 rounded-md border border-[color:var(--tile-border)] bg-white p-4">
            <div className="relative">
              <label className="block text-sm font-medium text-[color:var(--foreground)]">
                Buscar equipo por placa o VIN
                <input
                  value={vehicleSearch}
                  onChange={(event) => handleVehicleSearchChange(event.target.value)}
                  onFocus={() => setShowVehicleSuggestions(vehicleSearch.trim().length > 0)}
                  onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 120)}
                  className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0 shadow-sm"
                  placeholder="Ej: ABC123 o VIN parcial"
                />
              </label>

              {showVehicleSuggestions && filteredVehicles.length > 0 ? (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[color:var(--tile-border)] bg-white shadow-lg">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={String(vehicle.vin ?? `vehicle-${vehicle.licPlate ?? "unknown"}`)}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleVehicleSuggestionSelect(vehicle);
                      }}
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm text-[color:var(--foreground)] transition hover:bg-slate-50 last:border-b-0"
                    >
                      <span className="font-medium">{vehicle.licPlate || "Sin placa"}</span>
                      <span className="text-[color:var(--tile-muted)]">{vehicle.vin || "Sin VIN"}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="block text-sm font-medium text-[color:var(--foreground)]">
              Equipo seleccionado
              <input
                value={assignmentForm.vin || ""}
                readOnly
                className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-slate-50 px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                placeholder="Se llena con el VIN del equipo elegido"
              />
            </label>

            <label className="block text-sm font-medium text-[color:var(--foreground)]">
              Mantenimiento
              <select
                value={assignmentForm.maintenanceId}
                onChange={(event) => handleAssignmentChange("maintenanceId", event.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
              >
                <option value="">Seleccione un mantenimiento</option>
                {maintenances.map((item) => (
                  <option key={String(item.maintenanceId ?? `maintenance-${item.description ?? "unknown"}`)} value={String(item.maintenanceId ?? "")}>
                    {item.maintenanceId} - {item.description || "Sin descripción"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[color:var(--foreground)]">
                Último KM
                <input
                  type="number"
                  value={assignmentForm.lastKm}
                  onChange={(event) => handleAssignmentChange("lastKm", event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                />
              </label>

              <label className="block text-sm font-medium text-[color:var(--foreground)]">
                Última fecha
                <input
                  type="datetime-local"
                  value={assignmentForm.lastDate}
                  onChange={(event) => handleAssignmentChange("lastDate", event.target.value)}
                  className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-[color:var(--foreground)]">
              Últimas horas
              <input
                value={assignmentForm.lastHours}
                onChange={(event) => handleAssignmentChange("lastHours", event.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--tile-border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
                placeholder="120"
              />
            </label>

            <button
              type="button"
              onClick={handleAssignVehicle}
              disabled={loading}
              className="mt-2 inline-flex items-center rounded-md bg-[color:var(--tile)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] ring-1 ring-inset ring-[color:var(--tile-border)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Asignando..." : "Asignar mantenimiento"}
            </button>
          </div>
        ) : null}

        <div className="mt-4 min-h-[280px] max-h-[70vh] w-full overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[900px] divide-y divide-[color:var(--tile-border)] text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-[color:var(--tile)]">
              <tr className="text-[color:var(--tile-muted)]">
                <th className="px-2 py-2 font-medium">Placa</th>
                <th className="px-2 py-2 font-medium">Mantenimiento</th>
                <th className="px-2 py-2 font-medium">Próx. KM</th>
                <th className="px-2 py-2 font-medium">Próx. horas</th>
                <th className="px-2 py-2 font-medium">Próx. fecha</th>
                <th className="px-2 py-2 font-medium">Restante KM</th>
                <th className="px-2 py-2 font-medium">Restante horas</th>
                <th className="px-2 py-2 font-medium">Restante días</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--tile-border)]">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-[color:var(--tile-muted)]">
                    No hay asignaciones cargadas.
                  </td>
                </tr>
              ) : (
                assignments.map((item, index) => {
                  const vehicle = item.vin ? vehicleLookupByVin.get(String(item.vin)) : undefined;
                  const licPlate = vehicle?.licPlate ? String(vehicle.licPlate) : "-";
                  const description = item.description ?? (item.maintenanceId ? maintenanceDescriptionById.get(String(item.maintenanceId)) ?? "Sin descripción" : "-");
                  const nextDueDate = item.nextDueDate ? new Date(item.nextDueDate).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";
                  const status = String(item.status ?? "OK").toUpperCase();

                  return (
                    <tr key={`${item.vin ?? "vin"}-${item.maintenanceId ?? index}`}>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{licPlate}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">
                        {item.maintenanceId ?? "-"}
                        {item.maintenanceId ? (
                          <span className="ml-1 text-[color:var(--tile-muted)]">({description})</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{item.nextDueKm ?? "-"}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{item.nextDueHours ?? "-"}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{nextDueDate}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{item.remainingKm ?? "-"}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{item.remainingHours ?? "-"}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{item.remainingDays ?? "-"}</td>
                      <td className="px-2 py-2 text-[color:var(--foreground)]">{status}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDeleteAssignment(String(item.vin ?? ""), item.maintenanceId)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
