import HeroSection from "@/app/(public)/_components/home/hero-section";
import TestimonialsSection from "./_components/home/testimonials-section";
import FeaturesSection from "./_components/home/features-10";
import StartBuilding from "./_components/home/cta";
import { GridView } from "./_components/home/grid-view";

export default function page() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <GridView />
      <TestimonialsSection />
      <StartBuilding />
    </div>
  );
}
