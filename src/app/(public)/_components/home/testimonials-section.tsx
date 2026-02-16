import React from "react";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { testimonials } from "./constants";

export default function TestimonialsSection() {
  // Map the testimonials data to match the AnimatedTestimonials expected format
  const formattedTestimonials = testimonials.map((testimonial) => ({
    name: testimonial.name,
    image: testimonial.avatar,
    description: testimonial.content,
    handle: testimonial.company,
  }));

  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter mb-4">
            Loved by Crypto Traders
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-80">
            From beginners to quants — our community is growing every day.
          </p>
        </div>
        <AnimatedTestimonials data={formattedTestimonials} />
      </div>
    </section>
  );
}
