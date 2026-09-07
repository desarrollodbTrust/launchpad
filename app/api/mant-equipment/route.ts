import { buildAuthHeaders } from "@/lib/tenaris-proxy";

const ASSIGNMENT_UPSTREAM_URL = "https://tenaris-468894656254.us-central1.run.app/api/maintenances/vehicle-assignments";
const DELETE_UPSTREAM_URL = "https://tenaris-468894656254.us-central1.run.app/api/data/maintenance-vehicle";

function readCompositeKeyFromObject(input: unknown) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const vin = typeof candidate.vin === "string" ? candidate.vin.trim() : "";
  const maintenanceIdValue = candidate.maintenanceId ?? candidate.maintenance_id ?? candidate.id;
  const maintenanceId = maintenanceIdValue === undefined || maintenanceIdValue === null ? "" : String(maintenanceIdValue).trim();

  if (!vin && !maintenanceId) {
    return null;
  }

  return {
    vin: vin || undefined,
    maintenanceId: maintenanceId || undefined,
  };
}

function buildDeleteTarget(request: Request, bodyText?: string) {
  const searchParams = new URL(request.url).searchParams;
  const vin = searchParams.get("vin")?.trim();
  const maintenanceId = searchParams.get("maintenanceId")?.trim() || searchParams.get("maintenance_id")?.trim();

  const composite = (() => {
    if (vin || maintenanceId) {
      return { vin: vin || undefined, maintenanceId: maintenanceId || undefined };
    }

    if (bodyText && bodyText.trim() !== "") {
      try {
        const parsed = JSON.parse(bodyText) as unknown;
        return readCompositeKeyFromObject(parsed) ?? null;
      } catch {
        return null;
      }
    }

    return null;
  })();

  if (!composite || (!composite.vin && !composite.maintenanceId)) {
    return null;
  }

  const encoded = encodeURIComponent(JSON.stringify({ vin: composite.vin, maintenanceId: composite.maintenanceId }));
  return `${DELETE_UPSTREAM_URL}/${encoded}`;
}

async function proxyRequest(request: Request, method: "GET" | "POST" | "PUT" | "DELETE", body?: string) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL(method === "DELETE" ? DELETE_UPSTREAM_URL : ASSIGNMENT_UPSTREAM_URL);

  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.append(key, value);
  }

  let targetUrl = upstream.toString();

  if (method === "DELETE") {
    const deleteTarget = buildDeleteTarget(request, body);
    if (deleteTarget) {
      targetUrl = deleteTarget;
      console.log("[mant-equipment:delete] incoming local url:", request.url);
      console.log("[mant-equipment:delete] outgoing upstream url:", targetUrl);
      console.log("[mant-equipment:delete] full query debug:", {
        vin: searchParams.get("vin"),
        maintenanceId: searchParams.get("maintenanceId"),
        method,
      });
    } else {
      console.log("[mant-equipment:delete] missing composite key", { url: request.url, body });
      return Response.json(
        {
          error: "Falta la clave compuesta para eliminar la asignación",
          detail: "Se requiere vin y maintenanceId para DELETE en maintenance-vehicle.",
        },
        { status: 400 }
      );
    }
  }

  const headers = buildAuthHeaders(request);
  let nextBody = body && body.trim() !== "" ? body : undefined;

  if (method === "DELETE") {
    nextBody = undefined;
  }

  if (nextBody) {
    try {
      const parsed = JSON.parse(nextBody) as Record<string, unknown>;
      const cleaned: Record<string, unknown> = { ...parsed };

      for (const key of ["lastKm", "lastDate", "lastHours"]) {
        const value = cleaned[key];
        if (value === null || value === undefined || value === "") {
          delete cleaned[key];
        }
      }

      if (Object.keys(cleaned).length > 0) {
        nextBody = JSON.stringify(cleaned);
      } else {
        nextBody = JSON.stringify({ vin: cleaned.vin, maintenanceId: cleaned.maintenanceId });
      }
    } catch {
      // keep raw body when parsing fails
    }
    headers.set("Content-Type", "application/json");
  }

  try {
    const upstreamMethod = method;
    const response = await fetch(targetUrl, {
      method: upstreamMethod,
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
        error: `No se pudo ejecutar ${method} en vehicle-assigments`,
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL(ASSIGNMENT_UPSTREAM_URL);

  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.append(key, value);
  }

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: buildAuthHeaders(request),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener vehicle-assigments",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyRequest(request, "POST", body);
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyRequest(request, "PUT", body);
}

export async function DELETE(request: Request) {
  const body = await request.text();
  return proxyRequest(request, "DELETE", body);
}
