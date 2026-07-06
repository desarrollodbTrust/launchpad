import { notFound } from "next/navigation";
import { tileComponentBySlug } from "@/components/tile-pages";
import { getTileBySlug } from "@/lib/tiles";

type TilePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TilePage({ params }: TilePageProps) {
  const { slug } = await params;
  const tile = getTileBySlug(slug);
  const TileComponent = tileComponentBySlug[slug];

  if (!tile || !TileComponent) {
    notFound();
  }

  return (
    <main className="h-screen overflow-hidden bg-[color:var(--background)] px-4 py-4 md:px-6">
      <TileComponent title={tile.title} subtitle={tile.subtitle} />
    </main>
  );
}
