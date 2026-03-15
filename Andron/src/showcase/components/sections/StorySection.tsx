import { Triangle, Compass, Sparkles } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";

const StorySection = () => {
  return (
    <section id="hakkimizda" className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, type: "spring", stiffness: 60 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-coral" />
              <h3 className="font-display font-bold text-xl text-foreground">{content.story.mission.title}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed font-light text-lg">{content.story.mission.text}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 60 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-sky" />
              <h3 className="font-display font-bold text-xl text-foreground">{content.story.what.title}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed font-light text-lg">{content.story.what.text}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <Triangle className="h-10 w-10 text-coral fill-coral mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {content.story.hikaye.title}
            </h2>
          </div>

          <div className="space-y-6">
            {content.story.hikaye.paragraphs.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className={`text-muted-foreground leading-relaxed text-center font-light text-lg ${
                  i === 1 ? "text-foreground font-normal italic border-l-4 border-coral/30 pl-6 text-left" : ""
                }`}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StorySection;

