import { buildAuthHeaders, proxyCatalogMutation } from "@/lib/tenaris-proxy";

const UPSTREAM_URL = "https://tenaris-468894656254.us-central1.run.app/api/data/area";

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
        error: "No se pudo obtener area",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyCatalogMutation(request, UPSTREAM_URL, "POST", body);
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyCatalogMutation(request, UPSTREAM_URL, "PUT", body);
}

export async function DELETE(request: Request) {
  return proxyCatalogMutation(request, UPSTREAM_URL, "DELETE");
}
