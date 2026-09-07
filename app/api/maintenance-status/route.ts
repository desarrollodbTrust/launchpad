import { buildAuthHeaders } from "@/lib/tenaris-proxy";

const DATA_BASE_URL = "https://tenaris-468894656254.us-central1.run.app/api/data";
const MAINTENANCE_URL = `${DATA_BASE_URL}/maintenance`;
const MAINTENANCE_TYPE_URL = `${DATA_BASE_URL}/maintenance-type`;
const MAINTENANCE_VEHICLE_STATUS_URL = `${DATA_BASE_URL}/maintenance-vehicle-status`;

function parseXmlPayload(xmlText: string): unknown {
  const trimmed = xmlText.trim();
  if (!trimmed || !trimmed.startsWith("<")) {
    return trimmed;
  }

  const tagPattern = /<([A-Za-z0-9_-]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>|<([A-Za-z0-9_-]+)(?:\s[^>]*)?\/>/g;
  const rootNodes = [...trimmed.matchAll(tagPattern)];

  if (rootNodes.length === 0) {
    return trimmed;
  }

  const rootObject: Record<string, unknown> = {};
  const dataItems: Record<string, unknown>[] = [];

  for (const match of rootNodes) {
    const tagName = match[1] ?? match[3];
    if (!tagName) {
      continue;
    }

    const rawValue = match[2] ?? "";
    const normalizedValue = rawValue.replace(/<[^>]+>/g, "").trim();

    if (tagName === "data" && rawValue.includes("<vin>") && rawValue.includes("<maintenanceId>")) {
      const item: Record<string, unknown> = {};
      const itemMatches = [...rawValue.matchAll(tagPattern)];

      for (const itemMatch of itemMatches) {
        const itemTag = itemMatch[1] ?? itemMatch[3];
        if (!itemTag) {
          continue;
        }

        const itemRaw = itemMatch[2] ?? "";
        item[itemTag] = itemRaw.replace(/<[^>]+>/g, "").trim();
      }

      if (Object.keys(item).length > 0) {
        dataItems.push(item);
      }
      continue;
    }

    if (tagName === "data" && rawValue.includes("<data>")) {
      continue;
    }

    rootObject[tagName] = normalizedValue || "";
  }

  if (dataItems.length > 0) {
    rootObject.data = dataItems;
  }

  return rootObject;
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

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const asString = String(value).trim();
  if (!asString) {
    return null;
  }

  const normalized = asString.includes("T") ? asString : `${asString}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(dateA: Date, dateB: Date) {
  const ms = dateA.getTime() - dateB.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function buildCatalogUrl(baseUrl: string, searchParams: URLSearchParams, page: number, pageSize = 500) {
  const url = new URL(baseUrl);
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("page", String(page));
  nextParams.set("size", String(pageSize));

  for (const [key, value] of nextParams.entries()) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

async function fetchPaginatedCatalog(request: Request, baseUrl: string, extraParams: URLSearchParams) {
  const firstResponse = await fetch(buildCatalogUrl(baseUrl, extraParams, 0), {
    method: "GET",
    headers: buildAuthHeaders(request),
    cache: "no-store",
  });

  if (!firstResponse.ok) {
    const body = await firstResponse.text();
    return {
      ok: false as const,
      status: firstResponse.status,
      body,
    };
  }

  const firstRaw = await firstResponse.text();
  const firstPayload = firstRaw.trim().startsWith("<") ? (parseXmlPayload(firstRaw) as {
    data?: unknown[];
    totalPages?: number;
    totalElements?: number;
  }) : (JSON.parse(firstRaw) as {
    data?: unknown[];
    totalPages?: number;
    totalElements?: number;
  });

  const firstData = normalizeArrayPayload(firstPayload);
  const totalPages = Number.isFinite(Number(firstPayload?.totalPages)) ? Number(firstPayload.totalPages) : 1;
  const allData = [...firstData];

  if (totalPages > 1) {
    const pageResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => index + 1).map(async (page) => {
        const pageResponse = await fetch(buildCatalogUrl(baseUrl, extraParams, page), {
          method: "GET",
          headers: buildAuthHeaders(request),
          cache: "no-store",
        });

        if (!pageResponse.ok) {
          const body = await pageResponse.text();
          throw new Error(body || `Error ${pageResponse.status} en la página ${page}`);
        }

        const pageRaw = await pageResponse.text();
        return (pageRaw.trim().startsWith("<") ? parseXmlPayload(pageRaw) : JSON.parse(pageRaw)) as { data?: unknown[] };
      })
    );

    for (const pagePayload of pageResponses) {
      allData.push(...normalizeArrayPayload(pagePayload));
    }
  }

  return {
    ok: true as const,
    data: allData,
    totalElements: firstPayload.totalElements ?? allData.length,
    totalPages,
  };
}

function resolveString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function readMaintenanceState(assignment: Record<string, unknown>, maintenanceDefinition: Record<string, unknown>, typeDefinition: Record<string, unknown> | null, currentValues?: { currentKm?: number | null; currentHours?: number | null; currentDate?: Date | null }) {
  const usesKm = Boolean(
    toNumber(typeDefinition?.usesKm ?? maintenanceDefinition.usesKm ?? maintenanceDefinition.km ?? maintenanceDefinition.usesKilometers) === 1 ||
      String(typeDefinition?.usesKm ?? maintenanceDefinition.usesKm ?? maintenanceDefinition.km ?? maintenanceDefinition.usesKilometers ?? "false").toLowerCase() === "true" ||
      Boolean(typeDefinition?.usesKm ?? maintenanceDefinition.usesKm ?? maintenanceDefinition.km ?? maintenanceDefinition.usesKilometers)
  );

  const usesHours = Boolean(
    toNumber(typeDefinition?.usesHours ?? maintenanceDefinition.usesHours ?? maintenanceDefinition.hours ?? maintenanceDefinition.usesHoras) === 1 ||
      String(typeDefinition?.usesHours ?? maintenanceDefinition.usesHours ?? maintenanceDefinition.hours ?? maintenanceDefinition.usesHoras ?? "false").toLowerCase() === "true" ||
      Boolean(typeDefinition?.usesHours ?? maintenanceDefinition.usesHours ?? maintenanceDefinition.hours ?? maintenanceDefinition.usesHoras)
  );

  const usesDate = Boolean(
    toNumber(typeDefinition?.usesDate ?? maintenanceDefinition.usesDate ?? maintenanceDefinition.date ?? maintenanceDefinition.usesFecha) === 1 ||
      String(typeDefinition?.usesDate ?? maintenanceDefinition.usesDate ?? maintenanceDefinition.date ?? maintenanceDefinition.usesFecha ?? "false").toLowerCase() === "true" ||
      Boolean(typeDefinition?.usesDate ?? maintenanceDefinition.usesDate ?? maintenanceDefinition.date ?? maintenanceDefinition.usesFecha)
  );

  const lastKm = toNumber(assignment.lastKm ?? assignment.km ?? assignment.last_km ?? assignment.distanceKm) ?? 0;
  const lastHours = toNumber(assignment.lastHours ?? assignment.hours ?? assignment.last_hours) ?? 0;
  const lastDate = toDate(assignment.lastDate ?? assignment.date ?? assignment.last_date) ?? new Date();

  const baseFrequencyKm = toNumber(maintenanceDefinition.frequencyKm ?? maintenanceDefinition.frequency ?? maintenanceDefinition.kmFrequency ?? maintenanceDefinition.kilometers) ?? 0;
  const baseFrequencyHours = toNumber(maintenanceDefinition.frequencyHours ?? maintenanceDefinition.hoursFrequency ?? maintenanceDefinition.hours ?? maintenanceDefinition.frequencyHour) ?? 0;
  const baseFrequencyDays = toNumber(maintenanceDefinition.frequencyDias ?? maintenanceDefinition.daysFrequency ?? maintenanceDefinition.frequencyDays ?? maintenanceDefinition.days) ?? 0;

  const preAvisoKm = toNumber(maintenanceDefinition.preAviso ?? maintenanceDefinition.preAvisoKm ?? maintenanceDefinition.warningKm) ?? 0;
  const preAvisoHours = toNumber(maintenanceDefinition.preAvisoHours ?? maintenanceDefinition.warningHours) ?? 0;
  const preAvisoDias = toNumber(maintenanceDefinition.preAvisoDias ?? maintenanceDefinition.warningDays ?? maintenanceDefinition.daysPreAviso) ?? 0;

  const currentKm = currentValues?.currentKm ?? lastKm;
  const currentHours = currentValues?.currentHours ?? lastHours;
  const currentDate = currentValues?.currentDate ?? lastDate;

  const metricStatuses: Array<{ status: "ok" | "pending" | "due" | "overdue"; label: string }> = [];

  if (usesKm && baseFrequencyKm > 0) {
    const deltaKm = Math.max(0, currentKm - lastKm);
    const remainingKm = Math.max(0, baseFrequencyKm - deltaKm);

    if (remainingKm <= 0) {
      metricStatuses.push({ status: "overdue", label: "km" });
    } else if (remainingKm <= (preAvisoKm || 0)) {
      metricStatuses.push({ status: "due", label: "km" });
    } else {
      metricStatuses.push({ status: "pending", label: "km" });
    }
  }

  if (usesHours && baseFrequencyHours > 0) {
    const deltaHours = Math.max(0, currentHours - lastHours);
    const remainingHours = Math.max(0, baseFrequencyHours - deltaHours);

    if (remainingHours <= 0) {
      metricStatuses.push({ status: "overdue", label: "hours" });
    } else if (remainingHours <= (preAvisoHours || 0)) {
      metricStatuses.push({ status: "due", label: "hours" });
    } else {
      metricStatuses.push({ status: "pending", label: "hours" });
    }
  }

  if (usesDate && baseFrequencyDays > 0) {
    const elapsedDays = Math.max(0, diffDays(currentDate, lastDate));
    const remainingDays = Math.max(0, baseFrequencyDays - elapsedDays);

    if (remainingDays <= 0) {
      metricStatuses.push({ status: "overdue", label: "date" });
    } else if (remainingDays <= (preAvisoDias || 0)) {
      metricStatuses.push({ status: "due", label: "date" });
    } else {
      metricStatuses.push({ status: "pending", label: "date" });
    }
  }

  let status: "ok" | "pending" | "due" | "overdue" = "ok";
  if (metricStatuses.length === 0) {
    status = "ok";
  } else {
    const priority = { overdue: 3, due: 2, pending: 1, ok: 0 } as const;
    status = metricStatuses.reduce((highest, current) => {
      if (priority[current.status] > priority[highest]) {
        return current.status;
      }
      return highest;
    }, metricStatuses[0].status);
  }

  const pending = status !== "ok";

  return {
    status,
    pending,
    dueSoon: status === "due",
    overdue: status === "overdue",
    usesKm,
    usesHours,
    usesDate,
    baseFrequencyKm,
    baseFrequencyHours,
    baseFrequencyDays,
    preAvisoKm,
    preAvisoHours,
    preAvisoDias,
    lastKm,
    lastHours,
    lastDate,
    currentKm,
    currentHours,
    currentDate,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vinFilter = (searchParams.get("vin") ?? "").trim();
  const statusFilter = (searchParams.get("status") ?? "").trim().toLowerCase();
  const pageParam = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const sizeParam = Number.parseInt(searchParams.get("size") ?? "100", 10);
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;
  const size = Number.isFinite(sizeParam) && sizeParam > 0 ? sizeParam : 100;

  try {
    const maintenanceParams = new URLSearchParams();
    maintenanceParams.set("page", "0");
    maintenanceParams.set("size", "500");
    const typesParams = new URLSearchParams();
    typesParams.set("page", "0");
    typesParams.set("size", "500");

    const [maintenanceResult, typesResult, assignmentsResult] = await Promise.all([
      fetchPaginatedCatalog(request, MAINTENANCE_URL, maintenanceParams),
      fetchPaginatedCatalog(request, MAINTENANCE_TYPE_URL, typesParams),
      fetchPaginatedCatalog(request, MAINTENANCE_VEHICLE_STATUS_URL, new URLSearchParams(vinFilter ? { vin: vinFilter } : {})),
    ]);

    if (!maintenanceResult.ok) {
      return new Response(maintenanceResult.body, {
        status: maintenanceResult.status,
        headers: { "content-type": "application/json" },
      });
    }

    if (!typesResult.ok) {
      return new Response(typesResult.body, {
        status: typesResult.status,
        headers: { "content-type": "application/json" },
      });
    }

    if (!assignmentsResult.ok) {
      return new Response(assignmentsResult.body, {
        status: assignmentsResult.status,
        headers: { "content-type": "application/json" },
      });
    }

    const maintenanceMap = new Map<string, Record<string, unknown>>();
    for (const item of maintenanceResult.data) {
      const key = resolveString((item as Record<string, unknown>).maintenanceId ?? (item as Record<string, unknown>).id) ?? "";
      if (key) {
        maintenanceMap.set(String(key), item as Record<string, unknown>);
      }
    }

    const typeMap = new Map<string, Record<string, unknown>>();
    for (const item of typesResult.data) {
      const key = resolveString((item as Record<string, unknown>).maintenanceTypeId ?? (item as Record<string, unknown>).id) ?? "";
      if (key) {
        typeMap.set(String(key), item as Record<string, unknown>);
      }
    }

    const items: Array<Record<string, unknown>> = [];
    for (const assignment of assignmentsResult.data) {
      const assignmentRecord = assignment as Record<string, unknown>;
      const assignmentVin = resolveString(assignmentRecord.vin ?? assignmentRecord.vehicleVin ?? assignmentRecord.licensePlate) ?? "";
      const maintenanceId = resolveString(assignmentRecord.maintenanceId ?? assignmentRecord.maintenance_id ?? assignmentRecord.id) ?? "";

      if (!assignmentVin) {
        continue;
      }

      if (vinFilter && assignmentVin !== vinFilter) {
        continue;
      }

      const maintenanceDefinition = maintenanceMap.get(String(maintenanceId));
      if (!maintenanceDefinition) {
        continue;
      }

      const maintenanceTypeId = resolveString(
        maintenanceDefinition.tipo ?? maintenanceDefinition.maintenanceTypeId ?? maintenanceDefinition.typeId ?? assignmentRecord.typeId
      );
      const typeDefinition = maintenanceTypeId ? typeMap.get(String(maintenanceTypeId)) ?? null : null;

      const rawCurrentKm = toNumber(searchParams.get("currentKm") ?? searchParams.get(`${assignmentVin}-currentKm`));
      const rawCurrentHours = toNumber(searchParams.get("currentHours") ?? searchParams.get(`${assignmentVin}-currentHours`));
      const rawCurrentDate = toDate(searchParams.get("currentDate") ?? searchParams.get(`${assignmentVin}-currentDate`));

      const evaluated = readMaintenanceState(assignmentRecord, maintenanceDefinition, typeDefinition, {
        currentKm: rawCurrentKm ?? toNumber(assignmentRecord.currentKm ?? assignmentRecord.kmActual),
        currentHours: rawCurrentHours ?? toNumber(assignmentRecord.currentHours ?? assignmentRecord.hoursActual),
        currentDate: rawCurrentDate ?? toDate(assignmentRecord.currentDate ?? assignmentRecord.dateActual),
      });

      if (statusFilter && statusFilter !== "all" && evaluated.status !== statusFilter) {
        continue;
      }

      items.push({
        vin: assignmentVin,
        maintenanceId,
        description: resolveString(assignmentRecord.description ?? maintenanceDefinition.description ?? maintenanceDefinition.name) ?? "Sin descripción",
        maintenanceTypeId: maintenanceTypeId ?? resolveString(assignmentRecord.maintenanceTypeId ?? assignmentRecord.typeId) ?? null,
        typeName: resolveString(assignmentRecord.typeName ?? typeDefinition?.name ?? maintenanceDefinition.typeName) ?? "Sin tipo",
        status: resolveString(assignmentRecord.status ?? evaluated.status) ?? "OK",
        pending: evaluated.pending,
        dueSoon: evaluated.dueSoon,
        overdue: evaluated.overdue,
        usesKm: evaluated.usesKm,
        usesHours: evaluated.usesHours,
        usesDate: evaluated.usesDate,
        lastKm: resolveString(assignmentRecord.lastKm ?? assignmentRecord.km ?? assignmentRecord.last_km) ?? evaluated.lastKm ?? null,
        lastHours: resolveString(assignmentRecord.lastHours ?? assignmentRecord.hours ?? assignmentRecord.last_hours) ?? evaluated.lastHours ?? null,
        lastDate: resolveString(assignmentRecord.lastDate ?? assignmentRecord.date ?? assignmentRecord.last_date) || (evaluated.lastDate ? evaluated.lastDate.toISOString() : null),
        currentKm: resolveString(assignmentRecord.currentKm ?? assignmentRecord.kmActual ?? assignmentRecord.current_km) ?? evaluated.currentKm ?? null,
        currentHours: resolveString(assignmentRecord.currentHours ?? assignmentRecord.hoursActual ?? assignmentRecord.current_hours) ?? evaluated.currentHours ?? null,
        currentDate: resolveString(assignmentRecord.currentDate ?? assignmentRecord.dateActual ?? assignmentRecord.current_date) || (evaluated.currentDate ? evaluated.currentDate.toISOString() : null),
        nextDueKm: resolveString(assignmentRecord.nextDueKm ?? assignmentRecord.next_due_km) || null,
        nextDueHours: resolveString(assignmentRecord.nextDueHours ?? assignmentRecord.next_due_hours) || null,
        nextDueDate: resolveString(assignmentRecord.nextDueDate ?? assignmentRecord.next_due_date) || null,
        remainingKm: resolveString(assignmentRecord.remainingKm ?? assignmentRecord.remaining_km) || null,
        remainingHours: resolveString(assignmentRecord.remainingHours ?? assignmentRecord.remaining_hours) || null,
        remainingDays: resolveString(assignmentRecord.remainingDays ?? assignmentRecord.remaining_days) || null,
        frequencyKm: evaluated.baseFrequencyKm,
        frequencyHours: evaluated.baseFrequencyHours,
        frequencyDays: evaluated.baseFrequencyDays,
        preAvisoKm: evaluated.preAvisoKm,
        preAvisoHours: evaluated.preAvisoHours,
        preAvisoDias: evaluated.preAvisoDias,
      });
    }

    const start = page * size;
    const end = start + size;
    const paginated = items.slice(start, end);

    return Response.json({
      data: paginated,
      totalElements: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
      page,
      size,
      summary: {
        total: items.length,
        pending: items.filter((item) => Boolean((item as Record<string, unknown>).pending)).length,
        dueSoon: items.filter((item) => Boolean((item as Record<string, unknown>).dueSoon)).length,
        overdue: items.filter((item) => Boolean((item as Record<string, unknown>).overdue)).length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener maintenance-status",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
