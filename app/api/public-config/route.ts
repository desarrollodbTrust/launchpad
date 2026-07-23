export async function GET() {
  return Response.json(
    {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
