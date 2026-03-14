import { motion } from "framer-motion";

import game1 from "@/showcase/assets/andron-game-1.png";
import game2 from "@/showcase/assets/andron-game-2.png";
import game3 from "@/showcase/assets/andron-game-3.png";
import game4 from "@/showcase/assets/andron-game-4.png";

const images = [
  { src: game1, alt: "ANDRON oyun sahne 1" },
  { src: game2, alt: "ANDRON oyun sahne 2" },
  { src: game3, alt: "ANDRON oyun sahne 3" },
  { src: game4, alt: "ANDRON oyun sahne 4" },
];

const GameShowcaseSection = () => {
  return (
    <section className="py-16 md:py-24 overflow-hidden bg-background">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden group"
              style={{
                boxShadow: "0 8px 32px hsl(0 0% 0% / 0.1)",
              }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={img.src.src}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameShowcaseSection;
