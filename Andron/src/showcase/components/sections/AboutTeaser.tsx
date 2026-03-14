import { ArrowRight, Compass, Users } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";
import Link from "next/link";

const AboutTeaser = () => {
  return (
    <section id="hakkimizda" className="py-24 md:py-32 bg-section-alt overflow-hidden">
      <div className="container max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-coral/20 bg-coral/5 mb-6">
            <Compass className="w-3.5 h-3.5 text-coral" />
            <span className="text-xs font-medium text-coral tracking-wide">Bizi Tanıyın</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            {content.story.mission.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed font-light">
            {content.story.mission.text}
          </p>
        </motion.div>

        {/* Mini Team Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {content.team.members.map((member, i) => (
            <div
              key={i}
              className="text-center p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h4 className="font-display font-semibold text-foreground text-sm">{member.name}</h4>
              <p className="text-xs text-coral mt-0.5">{member.role}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA to full about page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/hakkimizda"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity group"
          >
            Hikayemizi Keşfedin
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutTeaser;
