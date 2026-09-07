import { buildAuthHeaders } from "@/lib/tenaris-proxy";

const UPSTREAM_URL = "https://tenaris-468894656254.us-central1.run.app/api/data/maintenance";

function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMaintenancePayload(input: Record<string, unknown>) {
  const maintenanceTypeId =
    normalizeNumber(input.maintenanceTypeId ?? input.typeId ?? input.tipo ?? input.maintenance_id ?? input.id) ??
    1;

  const usesKm = Boolean(
    input.usesKm === true ||
      input.usesKm === 1 ||
      input.usesKm === "true" ||
      input.useKm === true ||
      input.useKm === "true" ||
      input.km === true ||
      input.km === "true"
  );

  const usesHours = Boolean(
    input.usesHours === true ||
      input.usesHours === 1 ||
      input.usesHours === "true" ||
      input.hours === true ||
      input.hours === "true"
  );

  const usesDate = Boolean(
    input.usesDate === true ||
      input.usesDate === 1 ||
      input.usesDate === "true" ||
      input.date === true ||
      input.date === "true" ||
      input.days === true ||
      input.days === "true"
  );

  const frequencyKm = normalizeNumber(input.frequencyKm ?? (usesKm ? input.frequency : undefined));
  const frequencyHours = normalizeNumber(input.frequencyHours ?? (usesHours ? input.frequency : undefined));
  const frequencyMonths = normalizeNumber(input.frequencyMonths ?? (usesDate ? input.frequency : undefined));
  const preAvisoKm = normalizeNumber(input.preAvisoKm ?? (usesKm ? input.preAviso : undefined));
  const preAvisoHours = normalizeNumber(input.preAvisoHours ?? (usesHours ? input.preAviso : undefined));
  const preAvisoDays = normalizeNumber(input.preAvisoDays ?? (usesDate ? input.preAviso : undefined));

  const normalizedFrequency = usesKm ? frequencyKm : usesHours ? frequencyHours : usesDate ? frequencyMonths : normalizeNumber(input.frequency) ?? 0;
  const normalizedPreAviso = usesKm ? preAvisoKm : usesHours ? preAvisoHours : usesDate ? preAvisoDays : normalizeNumber(input.preAviso) ?? 0;

  const payload: Record<string, unknown> = {
    ...input,
    maintenanceTypeId,
    typeId: maintenanceTypeId,
    tipo: maintenanceTypeId,
    relationType: normalizeNumber(input.relationType) ?? 1,
    usesKm,
    usesHours,
    usesDate,
    frequency: normalizedFrequency ?? 0,
    preAviso: normalizedPreAviso ?? 0,
  };

  if (usesKm) {
    payload.frequencyKm = frequencyKm ?? 0;
    payload.preAvisoKm = preAvisoKm ?? 0;
  }

  if (usesHours) {
    payload.frequencyHours = frequencyHours ?? 0;
    payload.preAvisoHours = preAvisoHours ?? 0;
  }

  if (usesDate) {
    payload.frequencyMonths = frequencyMonths ?? 0;
    payload.preAvisoDays = preAvisoDays ?? 0;
  }

  return payload;
}

async function proxyMaintenanceMutation(request: Request, method: "POST" | "PUT" | "DELETE", body?: string) {
  const { searchParams } = new URL(request.url);
  const candidateId = ["maintenanceId", "maintenance_id", "id"].map((key) => searchParams.get(key)).find((value) => value && value.trim() !== "");

  let upstreamUrl = UPSTREAM_URL;
  if (candidateId && (method === "PUT" || method === "DELETE")) {
    upstreamUrl = `${UPSTREAM_URL}/${encodeURIComponent(candidateId.trim())}`;
  }

  const headers = buildAuthHeaders(request);
  let nextBody = body && body.trim() !== "" ? body : undefined;

  if (nextBody) {
    try {
      const parsed = JSON.parse(nextBody) as Record<string, unknown>;
      nextBody = JSON.stringify(normalizeMaintenancePayload(parsed));
    } catch {
      // keep raw text when payload is not JSON
    }
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body: nextBody,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const payload = await response.text();

    if (response.status === 204 || response.status === 205 || response.status === 304 || payload === "") {
      return new Response(null, {
        status: response.status,
        headers: {
          "content-type": contentType,
        },
      });
    }

    return new Response(payload, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: `No se pudo ejecutar ${method} en maintenance`,
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

function buildCatalogUrl(searchParams: URLSearchParams, page: number, pageSize = 500) {
  const url = new URL(UPSTREAM_URL);
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("page", String(page));
  nextParams.set("size", String(pageSize));

  for (const [key, value] of nextParams.entries()) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const firstResponse = await fetch(buildCatalogUrl(searchParams, 0), {
      method: "GET",
      headers: buildAuthHeaders(request),
      cache: "no-store",
    });

    if (!firstResponse.ok) {
      const body = await firstResponse.text();
      return new Response(body, {
        status: firstResponse.status,
        headers: {
          "content-type": firstResponse.headers.get("content-type") ?? "application/json",
        },
      });
    }

    const firstPayload = (await firstResponse.json()) as {
      data?: unknown[];
      totalPages?: number;
      totalElements?: number;
      page?: number;
      size?: number;
    };

    const allData = Array.isArray(firstPayload.data) ? [...firstPayload.data] : [];
    const totalPages = Number.isFinite(firstPayload.totalPages) ? Number(firstPayload.totalPages) : 1;

    if (totalPages > 1) {
      const pendingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 1);
      const pageResponses = await Promise.all(
        pendingPages.map(async (page) => {
          const response = await fetch(buildCatalogUrl(searchParams, page), {
            method: "GET",
            headers: buildAuthHeaders(request),
            cache: "no-store",
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(body || `Error ${response.status} en page ${page}`);
          }

          return response.json();
        })
      );

      for (const pagePayload of pageResponses) {
        const payload = pagePayload as { data?: unknown[] };
        if (Array.isArray(payload.data)) {
          allData.push(...payload.data);
        }
      }
    }

    return Response.json({
      data: allData,
      totalElements: firstPayload.totalElements ?? allData.length,
      totalPages,
      size: 500,
      page: 0,
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener maintenance",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyMaintenanceMutation(request, "POST", body);
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyMaintenanceMutation(request, "PUT", body);
}

export async function DELETE(request: Request) {
  return proxyMaintenanceMutation(request, "DELETE");
}
