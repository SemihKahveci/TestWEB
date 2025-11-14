"use client";
import Image from "next/image";
import { getImagePath } from "@/utils/imagePath";
import About from "@/components/About";
import GetStarted from "@/components/GetStarted";
import { motion } from "framer-motion";
import Mockups from "@/components/Mockups";
import KeenLogoSlider from "@/components/KeenLogoSlider";

export default function AboutUsPage() {
  return (
    <main className="w-full">
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center"
        id="header"
      >
        {/* Header Background for About Us page */}
        <div className="absolute inset-0 z-0">
          <Image
            src={getImagePath("/assets/images/header-new-bg.png")}
            alt="Header Background"
            fill
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <About />
      </section>

      {/* Referanslar bölməsi */}
      <section
        id="referanslar"
        className="bg-white w-full py-12 text-center mt-[100px]"
      >
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-[24px] font-bold mb-2 text-[#222] tracking-wide"
        >
          REFERENCES
        </motion.h2>
        <div className="w-40 h-1 bg-[#0099FF] mx-auto mb-8 rounded" />
        <KeenLogoSlider />
      </section>

      {/* Lorem Ipsum with Images Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between space-y-12 md:space-y-0 md:space-x-12">
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex-1 text-left md:text-left text-center w-full md:mt-15"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-[46px] leading-[57.6px] font-bold mb-4 text-[#000] w-full md:w-auto mx-auto"
            >
              Our Galaxy
            </motion.h2>
            <div className="w-40 h-[4px] bg-[#0099FF] mx mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-[#444] text-base leading-relaxed mb-8 w-full md:w-auto mx-auto"
            >
              The <strong className="text-[#000000]">ANDRON Game</strong> comprehensively measures the potential of candidates and
              employees using real-time, tamper-proof data. Through our scenarios, we assess{" "} <br />
              the following <strong className="text-[#000000]">12 core competencies</strong>:{" "} <br />
              <ul className="list-disc list-inside">
                <li>Customer Focus</li>
                <li>Adaptability and Resilience</li>
                <li>Aesthetic and Artistic Vision</li>
                <li>Design Ability</li>
                <li>Learning Agility</li>
                <li>Emotional Intelligence</li>
                <li>Creativity and Intellectual Depth</li>
                <li>Paradox Resolution and Decision-Making</li>
                <li>Critical and Systemic Thinking</li>
                <li>New World Literacy</li>
                <li>Trust-Building Collaboration and Synergy</li>
                <li>Influencing Others</li>
              </ul>
            </motion.p>
          </motion.div>

          {/* Right Image Gallery */}
          {/* Mobil üçün alt-alta və img-2-full, desktop üçün overlay və img-2 */}
          <div className="flex-1 w-full">
            {/* Mobil görünüş */}
            <div className="flex flex-col gap-6 md:hidden">
              <Image
                src={getImagePath("/assets/images/about-us/img-1.png")}
                alt="Image 1"
                width={700}
                height={400}
                className="rounded-xl w-full"
              />
              <Image
                src={getImagePath("/assets/images/about-us/img-2-full.png")}
                alt="Image 2"
                width={500}
                height={550}
                className="rounded-xl w-full"
              />
              <Image
                src={getImagePath("/assets/images/about-us/img-3.png")}
                alt="Image 3"
                width={450}
                height={550}
                className="rounded-xl w-full"
              />
            </div>
            {/* Desktop görünüş */}
            <div className="relative w-full h-[600px] hidden md:flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={getImagePath("/assets/images/about-us/img-1.png")}
                  alt="Image 1"
                  width={700}
                  height={400}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 w-[90%] md:w-[95%]"
                />
                <Image
                  src={getImagePath("/assets/images/about-us/img-2.png")}
                  alt="Image 2"
                  width={500}
                  height={550}
                  className="absolute top-[200px] right-5 z-20 w-[100%] md:w-[95%]"
                />
                <Image
                  src={getImagePath("/assets/images/about-us/img-3.png")}
                  alt="Image 3"
                  width={450}
                  height={550}
                  className="absolute -bottom-2 -left-15 z-30 w-[55%] md:w-[45%]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misyon & Vizyon Section */}
      <section className="bg-white py-16 px-4 text-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start space-y-12 md:space-y-0 md:space-x-12">
          {/* Misyon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="flex justify-center items-center mb-6">
              <Image
                src={getImagePath("/assets/images/mission.png")}
                alt="Mission"
                width={100}
                height={100}
                className="w-[100px] h-[100px]"
              />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-[35px] font-extrabold mb-4 relative inline-block"
            >
              <span className="text-black">OUR </span>
              <span className="text-[#0099FF]">MISSION</span>
              <span className="absolute w-[150px] left-1/2 transform -translate-x-1/2 bottom-[-10px] h-1 bg-black rounded"></span>
            </motion.h2>
            <p className="text-[#000] text-md font-[400] leading-relaxed mt-6 max-w-md mx-auto">
            The purpose of ANDRON Game is to combine the power of gamification, advanced AI
            techniques, and real-time behavioral analysis to deliver a truly novel competency
            discovery experience for both companies and candidates. By producing manipulation-proof
            data based on candidates’ natural decisions and behaviors, we match the right
            person to the right position and simplify the entire hiring process.
            </p>
          </motion.div>

          {/* Vizyon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="flex justify-center items-center mb-6">
              <Image
                src={getImagePath("/assets/images/vision.png")}
                alt="Vision"
                width={100}
                height={100}
                className="w-[100px] h-[100px]"
              />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-[35px] font-extrabold mb-4 relative inline-block"
            >
              <span className="text-black">OUR VALUE </span>
              <span className="text-[#0099FF]">PROPOSITION</span>
              <span className="absolute w-[150px] left-1/2 transform -translate-x-1/2 bottom-[-10px] h-1 bg-black rounded"></span>
            </motion.h2>
            <p className="text-[#000] text-md font-[400] leading-relaxed mt-6 max-w-md mx-auto">
            ANDRON Game goes beyond traditional evaluation methods by combining
            gamification, advanced artificial intelligence, and real-time behavioral analysis.
            Your company gets to know candidates not through boring tests, but through
            real-time scenarios — measuring not only what they know, but how they think and
            what they respond to, delivering deeper, manipulation-proof insights at every <br />
            stage of hiring.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mockups bölməsi */}
      {/* <div className="relative bg-white py-[100px]">
        <Mockups />
      </div> */}

      {/* Get Started bölməsi */}
      {/* <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <GetStarted />
      </motion.div> */}

      {/* Our Award Section */}
      {/* <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-[32px] font-bold mb-4 relative inline-block text-[#000] uppercase leading-[96px]"
          >
            OUR AWARD
            <span className="absolute w-[150px] left-1/2 transform -translate-x-1/2 bottom-[-10px] h-1 bg-[#0099FF] rounded"></span>
          </motion.h2>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <Image
                  src={getImagePath("/assets/images/star.png")}
                  alt="Star Award"
                  width={100}
                  height={100}
                  className="mb-6"
                />
                <p className="text-lg text-gray-700 font-semibold">
                  Lorem Ipsum
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}
    </main>
  );
}
