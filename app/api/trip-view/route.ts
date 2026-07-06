import { buildAuthHeaders } from "@/lib/tenaris-proxy";

type UpstreamTripPayload = {
  data?: Array<Record<string, unknown>>;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

function parseDate(value: unknown) {
  if (typeof value !== "string") {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

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

    const upstreamUrl = `https://tenaris-468894656254.us-central1.run.app/api/data/trip-view?${upstreamParams.toString()}`;
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: buildAuthHeaders(request),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "application/json",
        },
      });
    }

    const payload = (await response.json()) as UpstreamTripPayload;
    const data = Array.isArray(payload.data) ? payload.data : [];
    data.sort((a, b) => parseDate(b.startTime) - parseDate(a.startTime));

    const resolvedPage = Number.isFinite(payload.page) ? Number(payload.page) : page;
    const resolvedSize = Number.isFinite(payload.size) ? Number(payload.size) : size;
    const resolvedTotalPages = Number.isFinite(payload.totalPages) ? Number(payload.totalPages) : 1;
    const resolvedTotalElements = Number.isFinite(payload.totalElements)
      ? Number(payload.totalElements)
      : data.length;
    const hasMore = resolvedPage + 1 < resolvedTotalPages;

    return Response.json({
      data,
      page: resolvedPage,
      size: resolvedSize,
      totalElements: resolvedTotalElements,
      totalPages: resolvedTotalPages,
      hasMore,
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener trip-view",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
