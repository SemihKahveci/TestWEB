"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import GetStarted from "@/components/GetStarted";
import FAQ from "@/components/FAQ";

export default function PricingPage() {
  const [sliderValue, setSliderValue] = useState(25);

  // const pricingPlans = {
  //   monthly: {
  //     free: 0,
  //     basic: 29,
  //     professional: 139,
  //   },
  //   yearly: {
  //     free: 0,
  //     basic: 29 * 12, // Assuming 2 months free for yearly
  //     professional: 139 * 12, // Assuming 2 months free for yearly
  //   },
  // };

  // const currentPrices = isYearly ? pricingPlans.yearly : pricingPlans.monthly;

  // const features = [
  //   "Lorem Ipsum",
  //   "Lorem Ipsum",
  //   "Lorem Ipsum",
  //   "Lorem Ipsum",
  //   "Lorem Ipsum",
  // ];

  return (
    <main>
      <div className="relative h-[70px]"></div>
      {/* Pricing bölməsi */}
      <section
        className="relative w-full py-16 text-white text-center overflow-hidden"
        style={{
          background:
            "url(/assets/images/pricing_bg.png) no-repeat center center / cover",
          backgroundColor: "#0B4CAC",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-[24px] font-bold mb-2 text-white"
        >
          PRICING
        </motion.h2>
        <div className="w-40 h-1 bg-white mx-auto mb-6 rounded" />
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-2xl md:text-[45px] font-extrabold text-[#fff] leading-[130%]"
        >
          Your Tool to Organize
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-[#fff] text-sm font-[500] max-w-[470px] mx-auto mb-12 leading-[140%] px-2 md:px-0"
        >
          Final tool to work with your team, store everything in one place, and
          organize projects the way you want.
        </motion.p>
        <div className="flex flex-row flex-wrap justify-center items-start md:items-center gap-4 md:gap-16 mb-12 px-2 md:px-0">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
              viewport={{ once: true }}
              className="flex items-center gap-4 md:gap-8"
            >
              <Image
                src="/assets/icons/icon-check-green.svg"
                alt="Check"
                width={20}
                height={20}
                className="text-[#1465FA]"
              />
              <span className="text-sm font-medium">
                {
                  [
                    "Free 15-day trial",
                    "Unlimited Team Members",
                    "Cancel Anytime",
                  ][i]
                }
              </span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-auto p-8 text-[#222] mb-[110px]"
        >
          <div className="flex justify-around items-end mb-8">
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center px-3 md:px-8"
                >
                  <div className="text-base md:text-md mb-6">Lorem Ipsum</div>
                  <div className="text-2xl md:text-[32px] font-extrabold">
                    XX
                  </div>
                </motion.div>
                {/* Dikey ayraç, yalnız 0 və 1-ci blokdan sonra */}
                {i < 2 && (
                  <div className="h-8 md:h-12 w-0.5 bg-gray-400 mx-2 md:mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="25"
            value={sliderValue}
            onChange={(e) => setSliderValue(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2196f3 0%, #2196f3 ${sliderValue}%, #d1d5db ${sliderValue}%, #d1d5db 100%)`,
              height: "8px",
              borderRadius: "4px",
            }}
          />
          <p className="text-[#667085] text-sm mt-6 mb-4 font-[400] leading-[24px]">
            Lorem Ipsum has been the industry&apos;s standard dummy
          </p>
          <motion.button
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-[#0099FF] hover:bg-[#0099FF] text-white font-semibold px-8 py-3 rounded-md shadow transition"
          >
            START FREE TRAIL
          </motion.button>
        </motion.div>
      </section>
      {/* Yeni bölmə: Lorem Ipsum və Kartlar */}
      <section className="bg-white w-full py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-[24px] font-bold mb-2 text-black"
        >
          AVANTAJLARI
        </motion.h2>
        <div className="w-32 h-1 bg-[#0099FF] mx-auto mb-6 rounded" />
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-2xl md:text-[45px] font-extrabold mb-4 text-[#14181F] leading-[130%] px-2 md:px-0"
        >
          Your Tool to Organize <br />
          All Your Business & Daily Life
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-[#525E6F] text-sm font-[500] max-w-2xl mx-auto mb-12 leading-[140%] px-2 md:px-0"
          style={{ maxWidth: "470px" }}
        >
          Final tool to work with your team, store everything in one place, and
          organize projects the way you want.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 max-w-7xl mx-auto justify-center z-10">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
              viewport={{ once: true }}
              className="bg-white shadow-lg p-6 w-full max-w-[300px] h-[348px] flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-[#0099FF]/30 mx-auto"
              style={{ padding: "23px 28px", gap: "10px" }}
            >
              <div className="w-[100px] h-[100px] flex items-center justify-center mb-4">
                <Image
                  src={
                    [
                      "/assets/images/game.png",
                      "/assets/images/magicpen.png",
                      "/assets/images/medal.png",
                      "/assets/images/cup.png",
                    ][i]
                  }
                  alt="Icon"
                  width={70}
                  height={70}
                  className="shrink-0"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-[#0099FF]">
                Lorem Ipsum
              </h3>
              <p className="text-[#000] text-[14px] font-[300]">
                Lorem ipsum dolor sit amet consectetur enim Lorem ipsum dolor
                sit amet consectetur enim.
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Get Started bölməsi */}
      <GetStarted />

      {/* FAQ bölməsi */}
      <FAQ
        items={faqData}
        title="FAQ"
        subtitle="Lorem ipsum dolor sit amet consectetur enim ."
      />

      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-[32px] font-bold text-[#222] mb-4"
          >
            PRICING
          </motion.h2>
          <div className="w-32 h-1 bg-[#3085C6] mx-auto mb-12 rounded" />

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-12 w-full mx-auto"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/assets/icons/check-blue.svg"
                alt="Check"
                width={20}
                height={20}
                className="text-[#1465FA]"
              />
              <span className="text-base md:text-lg text-[#000000] font-semibold">
                Free 15-day trial
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/assets/icons/check-blue.svg"
                alt="Check"
                width={20}
                height={20}
                className="text-[#1465FA]"
              />
              <span className="text-base md:text-lg text-[#000000] font-semibold">
                Unlimited Team Members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/assets/icons/check-blue.svg"
                alt="Check"
                width={20}
                height={20}
                className="text-[#1465FA]"
              />
              <span className="text-base md:text-lg text-[#000000] font-semibold">
                Cancel Anytime
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-4 mb-16"
          >
            <span className="text-gray-700 font-medium">Billed Yearly</span>
            <label
              htmlFor="toggle-billing"
              className="flex items-center cursor-pointer"
            >
              <div
                className="relative w-14 h-8 bg-gray-300 rounded-full transition duration-200 ease-in-out"
                style={{ backgroundColor: isYearly ? "#E0E0E0" : "#1465FA" }}
              >
                <input
                  type="checkbox"
                  id="toggle-billing"
                  className="sr-only"
                  checked={!isYearly}
                  onChange={() => setIsYearly(!isYearly)}
                />
                <div
                  className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform duration-200 ease-in-out"
                  style={{
                    transform: isYearly ? "translateX(0)" : "translateX(100%)",
                  }}
                ></div>
              </div>
            </label>
            <span className="text-gray-700 font-medium">Billed Monthly</span>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {[0, 1, 2].map((i) => {
              let initialAnim, whileAnim;
              if (i === 1) {
                initialAnim = { opacity: 0, x: 60 };
                whileAnim = { opacity: 1, x: 0 };
              } else if (i === 2) {
                initialAnim = { opacity: 0, x: -60 };
                whileAnim = { opacity: 1, x: 0 };
              } else {
                initialAnim = { opacity: 0, y: 40 };
                whileAnim = { opacity: 1, y: 0 };
              }
              const planProps = [
                {
                  title: "Free",
                  price: currentPrices.free,
                  color: "bg-white text-[#222] border border-gray-200",
                  btn: "w-full border border-blue-500 text-blue-500 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors text-sm",
                  featuresClass: "text-gray-700",
                  icon: "/assets/icons/check-gray.svg",
                  iconClass: "text-gray-700",
                  minH: "min-h-[550px]",
                },
                {
                  title: "Basic",
                  price: currentPrices.basic,
                  color: "bg-[#2C3140] text-white",
                  btn: "w-full bg-[#1465FA] text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors text-sm",
                  featuresClass: "text-gray-300",
                  icon: "/assets/icons/check-white.svg",
                  iconClass: "text-white",
                  minH: "min-h-[600px]",
                },
                {
                  title: "Professional",
                  price: currentPrices.professional,
                  color: "bg-white text-[#222] border border-gray-200",
                  btn: "w-full border border-blue-500 text-blue-500 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors text-sm",
                  featuresClass: "text-gray-700",
                  icon: "/assets/icons/check-gray.svg",
                  iconClass: "text-gray-700",
                  minH: "min-h-[550px]",
                },
              ][i];
              return (
                <motion.div
                  key={i}
                  initial={initialAnim}
                  whileInView={whileAnim}
                  transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
                  viewport={{ once: true }}
                  className={`${planProps.color} rounded-lg shadow-lg p-8 flex flex-col justify-between ${planProps.minH}`}
                >
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">
                      {planProps.title}
                    </h3>
                    <p className="text-5xl font-extrabold mb-2">
                      ${planProps.price}
                    </p>
                    <p
                      className={
                        planProps.title !== "Basic"
                          ? "text-gray-600 mb-8 text-center"
                          : "text-[#DDDDDD] mb-8 text-center"
                      }
                    >
                      per user, per month
                    </p>
                    <button className={planProps.btn}>
                      7 Gün Denemeyi Başlat
                    </button>
                    <div className="w-24 h-0.5 bg-[#DDDDDD] mx-auto mt-8 mb-8"></div>
                    <ul
                      className={`text-center mt-8 space-y-3 ${planProps.featuresClass}`}
                    >
                      {features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-center gap-2"
                        >
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 bg-white px-8">
        <div className="max-w-full mx-auto px-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative overflow-x-auto"
          >
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700">
                <tr className="bg-white border-b hover:bg-gray-50">
                  <th
                    scope="col"
                    className="p-6 w-1/4 align-top border-r border-gray-200 text-center"
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 flex mb-4">
                        <span className="font-semibold text-[#222] text-xl">
                          Compare plans
                        </span>
                        <span className="font-semibold inline-flex items-center px-4 py-2 border border-[#858BA0] rounded-full text-xs bg-white text-gray-800 mt-1">
                          40% Off
                        </span>
                      </div>
                      <p className="text-xs text-[#858BA0] mt-2 text-left max-w-[300px]">
                        Choose your workspace plan according to your
                        organisational plan
                      </p>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="p-6 text-center w-1/4 border-r border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex mb-4 justify-center">
                      <span className="text-3xl font-extrabold text-[#222]">
                        Free
                      </span>
                      <p className="text-gray-600 text-sm font-medium">
                        /Lifetime
                      </p>
                    </div>
                    <button className="mt-4 bg-[#0099FF] text-white py-4 px-8 rounded-md font-semibold text-sm hover:bg-blue-600 transition-colors w-full whitespace-nowrap">
                      Choose This Plan
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="p-6 text-center w-1/4 border-r border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <span className="text-3xl font-extrabold text-[#222]">
                        $29
                      </span>
                      <p className="text-gray-600 text-sm font-medium">
                        /Month
                      </p>
                    </div>
                    <button className="mt-4 bg-[#0099FF] text-white py-4 px-8 rounded-md font-semibold text-sm hover:bg-blue-600 transition-colors w-full whitespace-nowrap">
                      Choose This Plan
                    </button>
                  </th>
                  <th scope="col" className="p-6 text-center w-1/4">
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <span className="text-3xl font-extrabold text-[#222]">
                        $139
                      </span>
                      <p className="text-gray-600 text-sm font-medium">
                        /Month
                      </p>
                    </div>
                    <button className="mt-4 bg-[#0099FF] text-white py-4 px-8 rounded-md font-semibold text-sm hover:bg-blue-600 transition-colors w-full whitespace-nowrap">
                      Choose This Plan
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingTableData.map((row, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <th
                      scope="row"
                      className="px-6 py-6 font-normal text-gray-900 whitespace-nowrap border-r border-gray-200 text-left align-middle"
                    >
                      {row.feature}
                    </th>
                    <td className="px-6 py-6 text-center border-r text-[#000] border-gray-200 align-middle font-normal">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Image
                            src="/assets/icons/verify.svg"
                            alt="Verified"
                            width={20}
                            height={20}
                            className="mx-auto text-[#1465FA]"
                          />
                        ) : (
                          <span className="text-black"></span>
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="px-6 py-6 text-center border-r text-gray-900 border-gray-200 align-middle font-normal">
                      {typeof row.basic === "boolean" ? (
                        row.basic ? (
                          <Image
                            src="/assets/icons/verify.svg"
                            alt="Verified"
                            width={20}
                            height={20}
                            className="mx-auto text-[#1465FA]"
                          />
                        ) : (
                          <span className="text-gray-400"></span>
                        )
                      ) : (
                        <div className="flex flex-col">
                          <span className="">{row.basic}</span>
                          <span className="text-[#858BA0] text-sm">
                            {row.subBasic}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center text-gray-900 align-middle font-normal">
                      {typeof row.professional === "boolean" ? (
                        row.professional ? (
                          <Image
                            src="/assets/icons/verify.svg"
                            alt="Verified"
                            width={20}
                            height={20}
                            className="mx-auto text-[#1465FA]"
                          />
                        ) : (
                          <span className="text-gray-400"></span>
                        )
                      ) : (
                        <div className="flex flex-col">
                          <span className="">{row.professional}</span>
                          <span className="text-[#858BA0] text-sm">
                            {row.subProfessional}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section> */}
    </main>
  );
}

const faqData = [
  {
    question: "Can I use Spline for free?",
    answer:
      "Yes, totally! The Basic plan is free. You can have unlimited personal files and file viewers. Maximum 1 team project can be created with 2 team files and 2 editors. You also have access to the Spline Library and can publish your scenes with a Spline logo.",
  },
  {
    question: "Why should I upgrade to Super or Super Team?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "What payment methods can I use?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

// const pricingTableData = [
//   {
//     feature: "Number of Users",
//     free: "20 Pages",
//     basic: "600 Pages",
//     subBasic: "Pages Add-ons on Demand",
//     professional: "Unlimited",
//     subProfessional: "Pages Add-ons on Demand",
//   },
//   {
//     feature: "Users Per Page",
//     free: "5 Pages",
//     basic: "50 Pages",
//     professional: "Unlimited",
//     subProfessional: "Pages Add-ons on Demand",
//   },
//   {
//     feature: "Includes essential features to get started",
//     free: true,
//     basic: true,
//     professional: true,
//   },
//   {
//     feature: "More advanced features for increased productivity",
//     free: true,
//     basic: true,
//     professional: true,
//   },
//   {
//     feature: "Designing & Development",
//     free: false,
//     basic: true,
//     professional: true,
//   },
//   {
//     feature: "Customizable options to meet your specific needs",
//     free: false,
//     basic: true,
//     professional: true,
//   },
//   {
//     feature: "Secure data storage",
//     free: false,
//     basic: false,
//     professional: true,
//   },
//   {
//     feature: "Email Support",
//     free: false,
//     basic: false,
//     professional: true,
//   },
//   {
//     feature: "24/7 customer support",
//     free: false,
//     basic: false,
//     professional: true,
//   },
//   {
//     feature: "Analytics and reporting",
//     free: false,
//     basic: true,
//     professional: true,
//   },
//   {
//     feature: "Account Management",
//     free: true,
//     basic: true,
//     professional: true,
//   },
// ];
