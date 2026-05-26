import { ArrowRight } from "lucide-react";

export function ResourcesSection() {
  return (
    <section id="resources" className="bg-[#F8F7F4] px-4 py-20 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl rounded-[18px] border border-[#E2D5BD] bg-white p-8 shadow-xl shadow-[#CBB98F]/10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8B6A32]">
              Resources
            </p>
            <h2 className="mt-4 text-[clamp(2.3rem,4vw,3.6rem)] font-semibold leading-[0.98] tracking-tight text-[#0A0F1E]">
              Legal operations content that respects the docket.
            </h2>
          </div>

          <div className="grid gap-3">
            {[
              "How to design a deadline-safe litigation workflow",
              "What a matter audit trail should capture",
              "How AI drafting should fit into lawyer review",
            ].map((item) => (
              <a
                key={item}
                href="#demo"
                className="group flex items-center justify-between rounded-xl border border-[#E2D5BD] bg-[#F8F7F4] p-5 text-sm font-bold text-[#0A0F1E] transition hover:-translate-y-0.5 hover:border-[#D4A843] hover:bg-white"
              >
                {item}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
