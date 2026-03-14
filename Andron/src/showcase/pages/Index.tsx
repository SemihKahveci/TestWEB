import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import HeroSection from "@/showcase/components/sections/HeroSection";
import ProblemSection from "@/showcase/components/sections/ProblemSection";
import SolutionSection from "@/showcase/components/sections/SolutionSection";
import GameVisualBreak from "@/showcase/components/sections/GameVisualBreak";
import HowItWorksSection from "@/showcase/components/sections/HowItWorksSection";
import InsightsSection from "@/showcase/components/sections/InsightsSection";
import MetricsSection from "@/showcase/components/sections/MetricsSection";
import TestimonialsSection from "@/showcase/components/sections/TestimonialsSection";
import TrustBar from "@/showcase/components/sections/TrustBar";
import PricingSection from "@/showcase/components/sections/PricingSection";


import game1 from "@/showcase/assets/andron-game-1.png";
import game2 from "@/showcase/assets/andron-game-2.png";
import game3 from "@/showcase/assets/andron-game-3.png";
import game4 from "@/showcase/assets/andron-game-4.png";
import game5 from "@/showcase/assets/andron-game-5.png";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <GameVisualBreak images={[game1, game2, game3]} />
      <HowItWorksSection />
      <GameVisualBreak images={[game4, game5]} reverse />
      <InsightsSection />
      <MetricsSection />
      <TestimonialsSection />
      <TrustBar />
      <PricingSection />
      
      <Footer />
    </div>
  );
};

export default Index;
