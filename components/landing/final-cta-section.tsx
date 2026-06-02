import { WaitlistForm } from "./waitlist-form";
import { WAITLIST_SECTION_ID } from "./waitlist";

export function FinalCtaSection() {
  return (
    <section
      id={WAITLIST_SECTION_ID}
      className="scroll-mt-8 bg-[#F8F7F4] px-4 pb-24 pt-12 sm:px-6"
      data-reveal
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0F1E] p-8 text-white shadow-2xl shadow-[#0A0F1E]/25 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#D4A843]">
              Early access
            </p>
            <h2 className="mt-5 max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-tight">
              Can I add you to early access?
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/64">
              DocketHQ is being built around one sharp promise: never miss
              another court update. Join the waitlist and we will reach out
              before opening the next access batch.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
