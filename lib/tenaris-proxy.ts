export function buildAuthHeaders(request: Request) {
  const headers = new Headers({
    Accept: "application/json",
  });

  const requestAuthorization = request.headers.get("authorization");
  const requestApiKey = request.headers.get("x-api-key");
  const requestCookie = request.headers.get("cookie");

  const envToken = process.env.TENARIS_API_TOKEN;
  const envApiKey = process.env.TENARIS_API_KEY;
  const envUser = process.env.TENARIS_API_USER;
  const envPassword = process.env.TENARIS_API_PASSWORD;

  if (requestAuthorization) {
    headers.set("authorization", requestAuthorization);
  } else if (envToken) {
    const token = envToken.startsWith("Bearer ") ? envToken : `Bearer ${envToken}`;
    headers.set("authorization", token);
  } else if (envUser && envPassword) {
    const basicAuth = Buffer.from(`${envUser}:${envPassword}`).toString("base64");
    headers.set("authorization", `Basic ${basicAuth}`);
  }

  if (requestApiKey) {
    headers.set("x-api-key", requestApiKey);
  } else if (envApiKey) {
    headers.set("x-api-key", envApiKey);
  }

  if (requestCookie) {
    headers.set("cookie", requestCookie);
  }

  return headers;
}

export async function proxyTenaris(request: Request, targetUrl: string, label: string) {
  try {
    const response = await fetch(targetUrl, {
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
        error: `No se pudo obtener ${label}`,
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function proxyCatalogMutation(request: Request, targetUrl: string, method: "POST" | "PUT" | "DELETE", body?: string) {
  const { searchParams } = new URL(request.url);
  const candidateIdKeys = ["makeId", "modelId", "submodelId", "countryId", "plantId", "areaId", "sectorId", "typeId", "id"];
  const idValue = candidateIdKeys.map((key) => searchParams.get(key)).find((value) => value && value.trim() !== "");

  let upstreamUrl = targetUrl;
  if (idValue && (method === "PUT" || method === "DELETE")) {
    upstreamUrl = `${targetUrl}/${encodeURIComponent(idValue.trim())}`;
  }

  const headers = buildAuthHeaders(request);
  if (body && body.trim() !== "") {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(upstreamUrl, {
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
        error: `No se pudo ejecutar ${method} en ${targetUrl}`,
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
