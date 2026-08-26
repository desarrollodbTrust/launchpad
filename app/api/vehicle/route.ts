import { buildAuthHeaders } from "@/lib/tenaris-proxy";

const VEHICLE_URL = "https://tenaris-468894656254.us-central1.run.app/api/data/vehicle";

async function proxyVehicleRequest(request: Request, method: string, body?: string) {
  const { searchParams } = new URL(request.url);
  const upstreamParams = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (key === "vin") {
      continue;
    }
    upstreamParams.append(key, value);
  }

  const vin = searchParams.get("vin")?.trim();
  const queryString = upstreamParams.toString();
  const targetUrl = vin && (method === "PUT" || method === "DELETE")
    ? `${VEHICLE_URL}/${encodeURIComponent(vin)}${queryString ? `?${queryString}` : ""}`
    : vin && method !== "POST"
      ? `${VEHICLE_URL}?${queryString ? `${queryString}&` : ""}vin=${encodeURIComponent(vin)}`
      : `${VEHICLE_URL}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(targetUrl, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(buildAuthHeaders(request).entries()),
    },
    body,
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin")?.trim();
  const upstream = new URL(VEHICLE_URL);

  for (const [key, value] of searchParams.entries()) {
    if (key === "vin") {
      continue;
    }
    upstream.searchParams.append(key, value);
  }

  if (vin) {
    upstream.searchParams.append("filter", `vin==${vin}`);
  }

  const response = await fetch(upstream.toString(), {
    method: "GET",
    headers: buildAuthHeaders(request),
    cache: "no-store",
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyVehicleRequest(request, "POST", body);
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyVehicleRequest(request, "PUT", body);
}

export async function DELETE(request: Request) {
  return proxyVehicleRequest(request, "DELETE");
}
