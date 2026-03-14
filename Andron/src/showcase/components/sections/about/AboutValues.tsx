import { Heart, Users, Unlock, Zap, Award, User } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  { icon: Heart, color: "text-coral", label: "Bütünlük" },
  { icon: Users, color: "text-sky", label: "Empati" },
  { icon: Unlock, color: "text-lavender", label: "Açıklık" },
  { icon: Zap, color: "text-tangerine", label: "Şevk" },
  { icon: Award, color: "text-coral", label: "Miras" },
  { icon: User, color: "text-sky", label: "Bireysellik" },
];

const mottos = ["Fark yaratın", "Birlikte büyüyelim", "Keşfetmeye her zaman devam et"];

const AboutValues = () => {
  return (
    <section className="py-24 md:py-32 bg-card">
      <div className="container max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-[32px] font-bold text-center mb-16 text-foreground"
        >
          Değer verdiğimiz şeyler
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group text-center py-6"
              >
                <Icon className={`w-7 h-7 mx-auto mb-3 ${v.color}`} />
                <span className="font-display font-semibold text-sm text-foreground">
                  {v.label}
                </span>
                <div className="mx-auto mt-2 h-0.5 w-0 group-hover:w-8 transition-all duration-300 rounded-full bg-coral" />
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-border mx-auto max-w-md" />

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mt-8">
          {mottos.map((m, i) => (
            <span key={i} className="text-sm italic text-muted-foreground">
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutValues;
