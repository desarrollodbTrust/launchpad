import { NextRequest, NextResponse } from "next/server";

function isAllowedDriveHost(url: URL) {
  return url.hostname === "drive.google.com" || url.hostname.endsWith(".googleusercontent.com");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Falta el parametro url", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return new NextResponse("URL invalida", { status: 400 });
  }

  if (!isAllowedDriveHost(targetUrl)) {
    return new NextResponse("Host no permitido", { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      cache: "force-cache",
      headers: {
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return new NextResponse("Error al obtener imagen", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    return new NextResponse(
      `Error interno del proxy: ${error instanceof Error ? error.message : "desconocido"}`,
      { status: 500 }
    );
  }
}
