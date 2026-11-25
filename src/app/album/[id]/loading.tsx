export default function AlbumLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-5 pb-10 pt-6 sm:px-8">
      <div className="glass-pill mb-5 h-9 w-20 rounded-full" />

      <div className="glass-panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:p-8">
        <div className="h-44 w-44 shrink-0 rounded-2xl bg-white/[0.08] sm:h-52 sm:w-52" />
        <div className="w-full flex-1 space-y-3">
          <div className="h-3.5 w-24 rounded bg-white/[0.08]" />
          <div className="h-9 w-72 rounded-lg bg-white/[0.1]" />
          <div className="h-4 w-44 rounded bg-white/[0.07]" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 rounded-full bg-[#38bdf8]/30" />
            <div className="h-10 w-28 rounded-full bg-white/[0.08]" />
          </div>
        </div>
      </div>

      <div className="glass-panel mt-8 divide-y divide-white/[0.06] rounded-2xl">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-6 w-6 rounded-full bg-white/[0.08]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-white/[0.09]" />
              <div className="h-3 w-1/5 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
