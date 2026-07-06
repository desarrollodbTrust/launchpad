import { buildAuthHeaders } from "@/lib/tenaris-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = (searchParams.get("vin") ?? "").trim();
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const requestedSize = Number.parseInt(searchParams.get("size") ?? "100", 10);
  const page = Number.isFinite(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  const size = Number.isFinite(requestedSize) && requestedSize > 0 ? requestedSize : 100;

  try {
    const upstreamParams = new URLSearchParams();
    upstreamParams.set("page", String(page));
    upstreamParams.set("size", String(size));
    if (vin) {
      upstreamParams.set("filter", `vin==${vin}`);
    }

    const upstreamUrl = `https://tenaris-468894656254.us-central1.run.app/api/data/telemetry-view?${upstreamParams.toString()}`;
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: buildAuthHeaders(request),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener telemetry-view",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
