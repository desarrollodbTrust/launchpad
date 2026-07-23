export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return Response.json(
    {
      googleMapsApiKey,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
