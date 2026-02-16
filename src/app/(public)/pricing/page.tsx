"use client";


import PricingComparator from "./pricing-comparator";
import { AccordionFAQ } from "./accordion";
import PricingModern from "./pricing-modern";

const Page = () => {
  return (
    <div className="h-full w-full">
      <PricingModern />
      <PricingComparator />
      <AccordionFAQ />
    </div>
  );
};
export default Page;