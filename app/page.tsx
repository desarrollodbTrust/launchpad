import Link from "next/link";
import { launchpadSections } from "@/lib/tiles";

const accentStyles = [
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-fuchsia-400 to-pink-500",
  "from-violet-400 to-indigo-500",
  "from-sky-400 to-cyan-500",
];

function getAccent(slug: string) {
  const sum = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return accentStyles[sum % accentStyles.length];
}

export default function Home() {
  return (
    <main className="launchpad-bg min-h-screen px-6 pb-8 pt-4 md:px-10">
      <div className="mx-auto w-full max-w-[1500px]">
        <nav className="mb-5 flex h-12 items-center justify-between rounded-2xl border border-white/55 bg-white/75 px-4 shadow-[0_14px_36px_-24px_rgba(15,23,42,0.6)] backdrop-blur-xl md:px-5">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
            Launchpad
          </span>
          <span className="text-xs font-medium text-slate-500">Aplicaciones</span>
        </nav>

        {launchpadSections.map((section) => (
          <section key={section.id} className="mb-7">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-800 md:text-2xl">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {section.tiles.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/tile/${tile.slug}`}
                  className="group relative min-h-32 overflow-hidden rounded-2xl border border-white/65 bg-white/70 p-3.5 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.65)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-25px_rgba(14,116,144,0.45)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-95 transition-opacity group-hover:opacity-100 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]" />
                  <div className="flex items-start justify-between">
                    <div
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white shadow-md ${getAccent(tile.slug)}`}
                    >
                      {tile.title.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="rounded-full border border-slate-200/80 bg-slate-50/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Open
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-5 text-slate-900">
                    {tile.title}
                  </h3>
                  {tile.subtitle && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {tile.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 transition group-hover:translate-x-0.5">
                    Entrar
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
