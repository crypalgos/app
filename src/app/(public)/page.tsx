import HeroSection from "./_components/home/hero-section";
import TestimonialsSection from "./_components/home/testimonials-section";
import StartBuilding from "./_components/home/cta";
import { GridView } from "./_components/home/grid-view";
import FAQsThree from "./_components/home/faq-section";
import ScrollStackDemo from "./_components/home/scrollstack";
import IntegrationsSection from "./_components/home/integrations";

/** Subtle gradient divider between sections */
const SectionDivider = () => (
  <div className="relative h-px w-full">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
  </div>
);

export default function page() {
  return (
    <div>
      <HeroSection />
      <ScrollStackDemo />
      <SectionDivider />
      <GridView />
      <SectionDivider />
      <IntegrationsSection />
      <SectionDivider />
      {/* <TestimonialsSection /> */}
      <SectionDivider />
      <FAQsThree />
      <StartBuilding />
    </div>
  );
}
