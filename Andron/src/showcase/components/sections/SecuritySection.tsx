import { Shield, Globe, Lock, Cloud } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const icons = [Shield, Globe, Lock, Cloud];
const colors = ["text-sky", "text-lavender", "text-coral", "text-tangerine"];
const bgColors = ["bg-sky/10", "bg-lavender/10", "bg-coral/10", "bg-tangerine/10"];

const SecuritySection = () => {
  return (
    <section id="guvenlik" className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-700 text-foreground mb-3 tracking-tight">
            Kurumsal{" "}
            <span className="text-gradient-cool">Güvenlik</span>{" "}
            Standartları
          </h2>
          <p className="text-muted-foreground font-light">{content.security.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {content.security.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotate: i % 2 === 0 ? -3 : 3 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
                className="text-center p-6 rounded-3xl border border-border bg-card hover:shadow-lg transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${bgColors[i]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-7 w-7 ${colors[i]}`} />
                </div>
                <h3 className="font-display font-600 text-sm mb-1 text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-light">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
