export async function GET() {
  return Response.json({
    status: "ok",
    service: "launchpad-api",
    timestamp: new Date().toISOString(),
  });
}