import { User } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const gradientBorders = [
  "hover:border-coral/30",
  "hover:border-sky/30",
  "hover:border-lavender/30",
  "hover:border-tangerine/30",
];
const roleColors = ["text-coral", "text-sky", "text-lavender", "text-tangerine"];

const TeamSection = () => {
  return (
    <section className="py-24 md:py-32 bg-section-alt overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-700 text-foreground mb-3 tracking-tight">
            {content.team.title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">{content.team.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.team.members.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, rotate: i % 2 === 0 ? -3 : 3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
              className={`p-6 rounded-3xl border border-border bg-card text-center hover:shadow-lg transition-all ${gradientBorders[i]}`}
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-600 text-foreground mb-1">{member.name}</h3>
              <p className={`text-sm font-display font-500 mb-3 ${roleColors[i]}`}>{member.role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">{member.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
