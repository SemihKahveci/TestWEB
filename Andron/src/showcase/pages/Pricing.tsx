import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import PricingSection from "@/showcase/components/sections/PricingSection";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 md:pt-32" />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Pricing;
