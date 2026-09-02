import { buildAuthHeaders } from "@/lib/tenaris-proxy";

const UPSTREAM_URL = "https://tenaris-468894656254.us-central1.run.app/api/data/maintenance-vehicle";

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

function buildCompositeKeyPath(request: Request, bodyText?: string) {
  const searchParams = new URL(request.url).searchParams;
  const vin = searchParams.get("vin")?.trim();
  const maintenanceId = searchParams.get("maintenanceId")?.trim() || searchParams.get("maintenance_id")?.trim();

  if (vin || maintenanceId) {
    return `${UPSTREAM_URL}/${encodeURIComponent(JSON.stringify({ vin, maintenanceId }))}`;
  }

  if (bodyText && bodyText.trim() !== "") {
    try {
      const parsed = JSON.parse(bodyText) as unknown;
      const key = readCompositeKeyFromObject(parsed);
      if (key?.vin || key?.maintenanceId) {
        return `${UPSTREAM_URL}/${encodeURIComponent(JSON.stringify({ vin: key.vin, maintenanceId: key.maintenanceId }))}`;
      }
    } catch {
      // Ignored on non-JSON payloads;
    }
  }

  return null;
}

async function proxyRequest(request: Request, method: "GET" | "POST" | "PUT" | "DELETE", body?: string) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL(UPSTREAM_URL);

  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.append(key, value);
  }

  let targetUrl = upstream.toString();

  if (method === "PUT" || method === "DELETE") {
    const compositePath = buildCompositeKeyPath(request, body);
    if (compositePath) {
      targetUrl = compositePath;
    } else {
      return Response.json(
        {
          error: "Falta la clave compuesta de mantenimiento-vehicle",
          detail: "Se requiere vin y maintenanceId para PUT/DELETE.",
        },
        { status: 400 }
      );
    }
  }

  const headers = buildAuthHeaders(request);
  if (body && body.trim() !== "") {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.trim() !== "" ? body : undefined,
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
        error: `No se pudo ejecutar ${method} en maintenance-vehicle`,
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL(UPSTREAM_URL);

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
        error: "No se pudo obtener maintenance-vehicle",
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
