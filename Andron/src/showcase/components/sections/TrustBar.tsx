import { Shield, Globe, Lock, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: Shield, label: "KVKK Uyumlu" },
  { icon: Globe, label: "GDPR Uyumlu" },
  { icon: Lock, label: "Uçtan Uca Şifreleme" },
  { icon: Cloud, label: "Güvenli Bulut" },
];

const TrustBar = () => {
  return (
    <section className="py-8 md:py-10 bg-background border-y border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-center gap-4 md:gap-14"
        >
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center justify-center gap-2 text-muted-foreground">
                <Icon className="h-4 md:h-5 w-4 md:w-5 text-sky" />
                <span className="text-xs md:text-sm font-display font-500">{b.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBar;
