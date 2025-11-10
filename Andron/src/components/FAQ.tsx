"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

const FAQ = ({
  items,
  title = "FAQ",
  subtitle = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. ",
}: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isFaqPage = usePathname().includes("faq");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className={`text-[32px] font-bold text-[#000] ${
              isFaqPage ? "mb-6" : "mb-0"
            }`}
          >
            {title}
          </motion.h2>
          <div
            className={`w-[150px] h-1 mx-auto mb-2 rounded ${
              isFaqPage ? "bg-[#0099FF]" : "bg-[#3085C6]"
            }`}
          />
          <motion.p
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className={`font-[500] font-inter ${
              isFaqPage
                ? "text-[22px] text-[#000] mb-[59px] mt-[33px]"
                : "text-[14px] text-[#ABABAB] "
            }`}
          >
            {subtitle}
          </motion.p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, index) => {
            let initialAnim, whileAnim;
            if (index % 3 === 1) {
              initialAnim = { opacity: 0, x: 60 };
              whileAnim = { opacity: 1, x: 0 };
            } else if (index % 3 === 2) {
              initialAnim = { opacity: 0, x: -60 };
              whileAnim = { opacity: 1, x: 0 };
            } else {
              initialAnim = { opacity: 0, y: 30 };
              whileAnim = { opacity: 1, y: 0 };
            }
            return (
              <motion.div
                key={index}
                initial={initialAnim}
                whileInView={whileAnim}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                viewport={{ once: true }}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center transition-colors bg-gray-50"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-medium text-[18px] leading-7 text-[#000]/80 font-inter">
                    {item.question}
                  </span>
                  <span className="text-2xl text-[#19406A] font-inter">
                    {openIndex === index ? "-" : "+"}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50">
                    <p className="font-normal text-[15px] leading-6 text-[#000]/40 font-inter">
                      {item.answer}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
