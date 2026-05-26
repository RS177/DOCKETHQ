import { problemPoints, solutionPoints } from "./landing-data";

export function ProblemSolutionSection() {
  return (
    <section className="bg-[#F8F7F4] px-4 py-24 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8B6A32]">
            The operating problem
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight text-[#0A0F1E]">
            Your docket should never become the risk.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[16px] border border-[#E2D5BD] bg-white p-6 shadow-xl shadow-[#CBB98F]/10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-500">
              Litigation teams drown in
            </p>
            <div className="mt-6 space-y-4">
              {problemPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="group rounded-xl border border-[#EFE5D3] bg-[#F8F7F4] p-5 transition hover:-translate-y-1 hover:border-red-200">
                    <Icon className="h-6 w-6 text-red-500 transition group-hover:rotate-3" />
                    <h3 className="mt-4 text-xl font-semibold text-[#0A0F1E]">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#5E6A7D]">
                      {point.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#D4A843]/35 bg-[#0A0F1E] p-6 text-white shadow-2xl shadow-[#0A0F1E]/20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4A843]">
              DocketHQ gives you
            </p>
            <div className="mt-6 space-y-4">
              {solutionPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="group rounded-xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-[#D4A843]/45">
                    <Icon className="h-6 w-6 text-[#D4A843] transition group-hover:scale-110" />
                    <h3 className="mt-4 text-xl font-semibold">{point.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {point.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
