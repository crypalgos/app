import React from 'react'
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
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Users Say
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of traders who are already building their strategies
          </p>
        </div>
        <AnimatedTestimonials data={formattedTestimonials} />
      </div>
    </section>
  )
}
