import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import AboutHero from "@/showcase/components/sections/about/AboutHero";
import AboutLogoMetaphor from "@/showcase/components/sections/about/AboutLogoMetaphor";
import AboutMissionVision from "@/showcase/components/sections/about/AboutMissionVision";
import AboutValues from "@/showcase/components/sections/about/AboutValues";
import AboutTeam from "@/showcase/components/sections/about/AboutTeam";
import AboutComparison from "@/showcase/components/sections/about/AboutComparison";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AboutHero />
      <AboutLogoMetaphor />
      <AboutMissionVision />
      <AboutValues />
      <AboutTeam />
      <AboutComparison />
      <Footer />
    </div>
  );
};

export default About;
