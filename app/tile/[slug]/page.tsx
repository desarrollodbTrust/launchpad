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
    <main className="min-h-screen bg-[color:var(--background)] px-6 py-10">
      <TileComponent title={tile.title} subtitle={tile.subtitle} />
    </main>
  );
}
