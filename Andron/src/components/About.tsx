"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getImagePath } from "@/utils/imagePath";

interface AboutProps {
  ourStoryText1?: string;
  ourStoryText2?: string;
}

const About = ({ ourStoryText1, ourStoryText2 }: AboutProps) => {
  const isAboutPage = usePathname().includes("about-us");
  
  // Default texts for home page
  const defaultHomeText1 = "As an alternative to the tedium and high costs of traditional competency evaluation methods, we set out with a vision for a discovery experience that is both engaging and trustworthy.";
  const defaultHomeText2 = "At its core, \"Andron\" signifies a place of gathering and dialogue. Inspired by the millennia-old stone walls we admired at the Istanbul Archaeology Museum, we've reimagined Andron for the modern era as an AI-powered discovery platform.";
  
  // Default texts for about-us page
  const defaultAboutText1 = `As an alternative to the tedium and high costs of traditional competency evaluation methods, we set out with a vision for a discovery experience that is both engaging and trustworthy.

"Andron" (Greek: ἀνδρών) originally referred to a private hall in ancient Greece where guests gathered to converse and share ideas. We've adopted this name as our own "council of discovery," bringing players together to explore their hidden potentials.`;

  const defaultAboutText2 = `At its core, "Andron" signifies a place of gathering and dialogue. Inspired by the millennia-old stone walls we admired at the Istanbul Archaeology Museum, we've reimagined Andron for the modern era as an AI-powered discovery platform.

The Ancient Greek term ἀνδρών describes a space where guests sparked a flow of ideas. We channel that very spirit into real-time, immersive experiences—allowing individuals to follow their own competency "flow" in rich, interactive scenarios.

Our emblem resembles a sleek spaceship. Just as the ancient andron opened doors to new thoughts, each landing and every exploration in our logo unlocks a door to a new universe. This symbol is the visual essence of our adventure-filled journey, guided by discovery and artificial intelligence.`;
  
  // Use provided texts or defaults based on page
  const text1 = ourStoryText1 || (isAboutPage ? defaultAboutText1 : defaultHomeText1);
  const text2 = ourStoryText2 || (isAboutPage ? defaultAboutText2 : defaultHomeText2);

  return (
    <section className="w-full bg-white">
      {/* Top Section - ABOUT US Title */}
      {!isAboutPage && (
        <div className="w-full py-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-[24px] font-[700] mb-2 text-[#000]"
          >
            ABOUT US
          </motion.h2>
          <div className="w-[150px] h-[4px] bg-[#0099FF] mx-auto rounded" />
        </div>
      )}

      {/* Content Sections with flex order */}
      <div
        className={`w-full flex flex-col ${isAboutPage ? "min-h-screen" : ""}`}
      >
        {/* Our Story Section - Order changes based on page */}
        <div
          className={`w-full text-center ${
            isAboutPage
              ? "order-1 pt-32 pb-20 bg-transparent"
              : "order-2 py-20 bg-white"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-[40px] font-[600] text-[#0099FF] relative z-2"
            >
              Our Story
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-sm text-[#ABABAB] mb-[34px] relative z-2"
            >
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4 text-left mb-[34px] max-w-[750px] mx-auto relative z-2"
            >
              <p
                className={`text-black text-sm leading-relaxed text-center whitespace-pre-line ${
                  isAboutPage ? "relative z-2 text-white" : "text-black"
                }`}
              >
                {text1}
              </p>
              <p
                className={`text-black text-sm leading-relaxed text-center whitespace-pre-line ${
                  isAboutPage ? "relative z-2 text-white" : "text-black"
                }`}
              >
                {text2}
              </p>
            </motion.div>
            {!isAboutPage && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="bg-[#0099FF] w-[200px] h-[50px] hover:bg-[#0077CC] text-white text-[18px] font-semibold px-8 py-3 shadow-lg transition-colors"
                style={{
                  clipPath: "polygon(100% 0, 100% 15%, 90% 100%, 0 100%, 0 0)",
                  borderRadius: "10px",
                }}
              >
                MORE ABOUT
              </motion.button>
            )}
          </div>
        </div>

        {/* Image and Text Section - Order changes based on page */}
        <div className={`w-full ${isAboutPage ? "order-2" : "order-1"}`}>
          <div className="relative">
            {/* Left Side - Image with cosmic background */}
            <div className="relative">
              <Image
                src={getImagePath("/assets/images/header_bg-min.png")}
                alt="About Us"
                width={600}
                height={359}
                className="object-cover absolute left-0 -top-[17px] w-[600px] h-[359px] z-1"
                style={{ clipPath: "polygon(0 0, 90% 0%, 100% 100%, 0% 100%)" }}
              />
            </div>

            {/* Right Side - Text Content */}
            <motion.div
              className="flex items-center justify-center h-[330px] p-8 sm:p-14 lg:p-16 max-w-[100%] xl:max-w-[88%] xl:ml-auto"
              style={{
                backgroundColor: "rgba(0, 153, 255, 1)",
              }}
            >
              <div className="max-w-[100%] md:max-w-[80%] xl:max-w-[60%] z-10">
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="md:text-[45px] text-2xl font-bold text-white mb-6 leading-tight text-left"
                >
                  What We Do:
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-white text-sm leading-relaxed ml-[100px] text-left"
                >
                  We design and deliver assessment tools that leverage{" "} <br />
                  cutting-edge technologies and methodologies to unlock individuals’ <br />
                  potential and track their development through competency measurements;{" "}
                  today measuring skills, tomorrow mapping potential and opening doors to <br />
                  new domains—from leadership to innovation—as a modular discovery <br />
                  platform.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
