import { AlertTriangle, MessageCircle, BarChart3 } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const icons = [AlertTriangle, MessageCircle, BarChart3];
const accentColors = ["text-coral", "text-tangerine", "text-lavender"];
const bgColors = ["bg-coral/10", "bg-tangerine/10", "bg-lavender/10"];

const ProblemSection = () => {
  return (
    <section id="andron-nedir" className="py-16 md:py-32 bg-background overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-16"
        >
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Geleneksel değerlendirmeler{" "}
            <span className="text-gradient">artık yeterli değil.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {content.problem.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -60 : i === 2 ? 60 : 0, y: i === 1 ? 40 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className="text-center p-6 md:p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow group"
              >
                <div className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl ${bgColors[i]} flex items-center justify-center mx-auto mb-4 md:mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 md:h-6 w-5 md:w-6 ${accentColors[i]}`} />
                </div>
                <h3 className="font-display font-semibold text-base md:text-lg mb-2 md:mb-3 text-foreground">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-light">{item.text}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 md:mt-12 text-base md:text-lg font-display font-semibold text-coral"
        >
          "{content.problem.subtitle}"
        </motion.p>
      </div>
      <div className="container mt-10 md:mt-16">
        <div className="mx-auto w-1/3 h-px bg-border" />
      </div>
    </section>
  );
};

export default ProblemSection;

