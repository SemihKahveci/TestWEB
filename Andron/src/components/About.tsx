"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getImagePath } from "@/utils/imagePath";

const About = () => {
  const isAboutPage = usePathname().includes("about-us");

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
              Lorem ipsum dolor sit amet consectetur enim .
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid md:grid-rows-2 gap-4 text-left mb-[34px] max-w-[750px] mx-auto relative z-2"
            >
              <p
                className={`text-black text-sm leading-relaxed text-center ${
                  isAboutPage ? "relative z-2 text-white" : "text-black"
                }`}
              >
                Lorem ipsum dolor sit amet consectetur enim .Lorem ipsum dolor
                sit amet consectetur enim .Lorem ipsum dolor sit amet
                consectetur enim .Lorem ipsum dolor sit amet consectetur enim
                .Lorem ipsum dolor sit amet consectetur enim .Lorem ipsum dolor
                sit amet consectetur enim
              </p>
              <p
                className={`text-black text-sm leading-relaxed text-center ${
                  isAboutPage ? "relative z-2 text-white" : "text-black"
                }`}
              >
                .Lorem ipsum dolor sit amet consectetur enim .Lorem ipsum dolor
                sit amet consectetur enim .Lorem ipsum dolor sit amet
                consectetur enim .Lorem ipsum dolor sit amet consectetur enim .
              </p>
            </motion.div>
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
              DAHA FAZLA
            </motion.button>
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
                  Your Tool to Organize
                  <br />
                  All Your Business & Daily Life
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-white text-sm leading-relaxed ml-[100px] text-left"
                >
                  Final tool to work with your team, store everything in one
                  place, and organize projects the way you want. Final tool to
                  work with your team, store everything in one place, and
                  organize projects the way you want.
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
