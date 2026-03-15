import { Rocket, Shield, Compass } from "lucide-react";
import { motion } from "framer-motion";
import logoWhite from "@/showcase/assets/logo-white-icon.png";
import Image from "next/image";

const points = [
  { icon: Rocket, color: "coral", text: "Zaman ve mekanın ötesine" },
  { icon: Shield, color: "sky", text: "Manipüle edilemez deneyim" },
  { icon: Compass, color: "lavender", text: "Macera ve öğrenme iç içe" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  coral: { bg: "bg-coral/10", text: "text-coral" },
  sky: { bg: "bg-sky/10", text: "text-sky" },
  lavender: { bg: "bg-lavender/10", text: "text-lavender" },
};

const AboutLogoMetaphor = () => {
  return (
    <section className="py-24 md:py-32 overflow-hidden bg-hero-gradient">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.25em] mb-4 text-coral">
              Amblemimiz
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Bir uzay gemisi neden amblemimiz?
            </h2>
            <p className="text-base leading-relaxed mb-8 text-white/60">
              Tıpkı antik andron&apos;da misafirlerin yeni düşüncelere kapı aralaması gibi, her iniş ve her keşif yeni bir evrenin kapısını aralar. Amblemimiz, keşif dolu maceramızın ve yapay zekanın rehberliğinde sürekli genişleyen yolculuğumuzun simgesidir.
            </p>

            <div className="space-y-4">
              {points.map((p, i) => {
                const Icon = p.icon;
                const c = colorMap[p.color];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
                      <Icon className={`w-4.5 h-4.5 ${c.text}`} />
                    </div>
                    <span className="text-sm text-white/80">{p.text}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right — logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div
                className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.08]"
                style={{ boxShadow: "0 0 60px hsl(var(--coral) / 0.3)" }}
              >
                <Image src={logoWhite} alt="ANDRON Logo" className="w-28 md:w-36 h-auto" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutLogoMetaphor;
