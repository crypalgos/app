import React from "react";
import { testimonials } from "./constants";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export default function TestimonialsSection() {
  const formattedTestimonials = testimonials.map((testimonial) => ({
    name: testimonial.name,
    image: testimonial.avatar,
    description: testimonial.content,
    handle: testimonial.company,
  }));

  return (
    <section className="w-full py-10 md:py-16 relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Editorial header */}
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-6">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Community
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-4">
            What our traders
            <br />
            <span className="text-primary">say about us.</span>
          </h2>
          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-lg mx-auto">
            From beginners to quants — our community is growing every day.
          </p>
        </div>

        <AnimatedTestimonials data={formattedTestimonials} />
      </div>
    </section>
  );
}
