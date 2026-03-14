import { ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-coral/10 via-lavender/10 to-sky/10 overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Hazır mısın?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-light mb-10 leading-relaxed">
            Takvimimizden sana uygun bir slot seç — satış baskısı yok, 30 dakika yeter.
          </p>
          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold bg-coral text-white hover:bg-coral/90 shadow-lg hover:shadow-xl hover:shadow-coral/25 transition-all duration-300"
          >
            <Calendar className="w-5 h-5" />
            Hemen Planla
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
