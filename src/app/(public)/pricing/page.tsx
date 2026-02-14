"use client";

import PricingModern from ".";
import PricingComparator from "./pricing-comparator";
import { AccordionFAQ } from "./accordion";

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