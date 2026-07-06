import Link from "next/link";

type TileModuleProps = {
  title: string;
  subtitle?: string;
};

export default function TileModule({ title, subtitle }: TileModuleProps) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg border border-[color:var(--tile-border)] bg-[color:var(--surface)] p-8 shadow-sm">
      <p className="text-sm text-[color:var(--tile-muted)]">Modulo</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</h1>
      {subtitle ? <p className="mt-2 text-base text-[color:var(--tile-muted)]">{subtitle}</p> : null}
      <p className="mt-6 text-lg text-[color:var(--tile-muted)]">
        Esta pagina es el punto de partida para la funcionalidad de {title}.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center rounded-md border border-[color:var(--tile-border)] bg-[color:var(--tile)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white"
      >
        Volver al Launchpad
      </Link>
    </div>
  );
}
