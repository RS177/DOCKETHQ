import { testimonials } from "./landing-data";

export function TestimonialsSection() {
  return (
    <section className="bg-[#F8F7F4] px-4 py-24 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8B6A32]">
            What legal teams feel
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight text-[#0A0F1E]">
            Calm is a competitive advantage in litigation.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <figure
              key={testimonial.name}
              className={`rounded-[18px] border border-[#E2D5BD] bg-white p-6 shadow-xl shadow-[#CBB98F]/10 transition hover:-translate-y-1 hover:shadow-2xl ${
                index === 1 ? "lg:mt-10" : ""
              }`}
            >
              <blockquote className="text-xl font-semibold leading-8 tracking-tight text-[#0A0F1E]">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-8 border-t border-[#EFE5D3] pt-5">
                <p className="font-bold text-[#0A0F1E]">{testimonial.name}</p>
                <p className="mt-1 text-sm text-[#8B6A32]">{testimonial.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
