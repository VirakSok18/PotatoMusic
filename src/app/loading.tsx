export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 pb-10 pt-6 sm:px-8">
      <div className="space-y-10">
        {Array.from({ length: 2 }).map((_, sectionIdx) => (
          <div key={sectionIdx}>
            <div className="mb-4 h-7 w-40 rounded-lg bg-white/[0.1]" />
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-3.5">
                  <div className="mb-3.5 aspect-[4/3] w-full rounded-xl bg-white/[0.08]" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.09]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
