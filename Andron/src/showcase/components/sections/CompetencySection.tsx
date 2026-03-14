import { BookOpen, Users, Rocket, Lightbulb, ArrowRight } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const icons = [BookOpen, Users, Rocket, Lightbulb];
const cardColors = [
  { bg: "bg-sky/10", text: "text-sky", border: "hover:border-sky/30" },
  { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
  { bg: "bg-lavender/10", text: "text-lavender", border: "hover:border-lavender/30" },
  { bg: "bg-tangerine/10", text: "text-tangerine", border: "hover:border-tangerine/30" },
];

const CompetencySection = () => {
  return (
    <section id="yetkinlikler" className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-4xl font-700 text-center mb-4 text-foreground tracking-tight"
        >
          Geleceğin iş dünyası için tasarlanmış{" "}
          <span className="text-gradient">12 temel yetkinlik</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground mb-16 max-w-lg mx-auto font-light"
        >
          4 kategori altında bütünsel bir yetkinlik çerçevesi
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.competency.cards.map((card, i) => {
            const Icon = icons[i];
            const color = cardColors[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
                className={`p-6 rounded-3xl border border-border bg-card ${color.border} hover:shadow-lg transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${color.text}`} />
                </div>
                <h3 className="font-display font-600 text-base mb-2 text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{card.text}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <a href="/yetkinlikler" className="inline-flex items-center gap-2 text-coral font-display font-500 text-sm hover:gap-3 transition-all">
            {content.competency.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default CompetencySection;
