import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

const AboutHero = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            backgroundColor: "white",
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block text-xs font-semibold uppercase tracking-[0.25em] mb-6 text-coral"
        >
          Hikayemiz
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
        >
          Bir buluşma noktasından{" "}
          <br className="hidden md:block" />
          doğdu.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg leading-relaxed mx-auto max-w-[600px] text-white/60"
        >
          &quot;Andron&quot; — antik Yunanca&apos;da misafirlerin bir araya gelip fikir paylaştığı özel salonu tanımlar.
          Biz bu ruhu, bireylerin gerçek yetkinliklerini keşfettiği modern bir platforma dönüştürdük.
        </motion.p>

        <motion.div
          className="mt-12"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-white mx-auto opacity-60" />
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
