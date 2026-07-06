import { buildAuthHeaders } from "@/lib/tenaris-proxy";

export async function GET(request: Request) {
  const baseUrl = "https://tenaris-468894656254.us-central1.run.app/api/data/vehicle-view";
  const pageSize = 500;

  try {
    const firstResponse = await fetch(`${baseUrl}?size=${pageSize}&page=0`, {
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
    const totalPages = Number.isFinite(firstPayload.totalPages)
      ? Number(firstPayload.totalPages)
      : 1;

    if (totalPages > 1) {
      const pendingPages: Promise<Response>[] = [];
      for (let page = 1; page < totalPages; page += 1) {
        pendingPages.push(
          fetch(`${baseUrl}?size=${pageSize}&page=${page}`, {
            method: "GET",
            headers: buildAuthHeaders(request),
            cache: "no-store",
          })
        );
      }

      const pageResponses = await Promise.all(pendingPages);
      for (const pageResponse of pageResponses) {
        if (!pageResponse.ok) {
          const body = await pageResponse.text();
          return new Response(body, {
            status: pageResponse.status,
            headers: {
              "content-type": pageResponse.headers.get("content-type") ?? "application/json",
            },
          });
        }

        const pagePayload = (await pageResponse.json()) as { data?: unknown[] };
        if (Array.isArray(pagePayload.data)) {
          allData.push(...pagePayload.data);
        }
      }
    }

    return Response.json({
      data: allData,
      totalElements: firstPayload.totalElements ?? allData.length,
      totalPages,
      size: pageSize,
      page: 0,
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo obtener vehicle-view",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
