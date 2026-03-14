import { motion } from "framer-motion";
import type { StaticImageData } from "next/image";

interface GameVisualBreakProps {
  images: Array<string | StaticImageData>;
  reverse?: boolean;
}

const GameVisualBreak = ({ images, reverse = false }: GameVisualBreakProps) => {
  return (
    <section className="py-4 md:py-10 overflow-hidden bg-background">
      <div className="container px-4 md:px-8">
        <div className={`flex gap-2 md:gap-4 ${reverse ? "flex-row-reverse" : ""}`}>
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`flex-1 rounded-xl md:rounded-2xl overflow-hidden group ${
                images.length > 2 && i >= 2 ? "hidden sm:block" : ""
              }`}
              style={{ boxShadow: "0 6px 24px hsl(0 0% 0% / 0.08)" }}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={typeof src === "string" ? src : src.src}
                  alt="ANDRON oyun görseli"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameVisualBreak;
