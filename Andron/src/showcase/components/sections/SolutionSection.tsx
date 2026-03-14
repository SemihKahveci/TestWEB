import { Gamepad2, Brain, FileText, ArrowRight } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const icons = [Gamepad2, Brain, FileText];
const gradients = [
  "from-coral/10 to-tangerine/10",
  "from-sky/10 to-lavender/10",
  "from-lavender/10 to-coral/10",
];
const iconColors = ["text-coral", "text-sky", "text-lavender"];

const SolutionSection = () => {
  return (
    <section className="py-24 md:py-32 bg-section-cool overflow-hidden">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-4xl font-700 text-center mb-4 text-foreground tracking-tight"
        >
          Değerlendirmeyi{" "}
          <span className="text-gradient-cool">deneyime</span>{" "}
          dönüştürüyoruz.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground mb-16 max-w-lg mx-auto font-light"
        >
          Üç adımda karar davranışı analizi
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {content.solution.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div key={i} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 50, rotate: -2 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 100 }}
                  className={`relative p-8 rounded-3xl bg-gradient-to-br ${gradients[i]} border border-border hover:shadow-xl transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm">
                      <Icon className={`h-5 w-5 ${iconColors[i]}`} />
                    </div>
                    <span className="text-xs font-display font-600 text-muted-foreground tracking-widest uppercase">Adım {i + 1}</span>
                  </div>
                  <h3 className="font-display font-600 text-xl mb-3 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">{step.text}</p>
                </motion.div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 z-10 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/20 to-tangerine/20 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-coral/60" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
