import { FileText, BarChart3, MessageSquare, TrendingUp, Download } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/showcase/components/ui/button";

import slide1 from "@/showcase/assets/report-slide-1.png";
import slide2 from "@/showcase/assets/report-slide-2.png";
import slide3 from "@/showcase/assets/report-slide-3.png";
import slide4 from "@/showcase/assets/report-slide-4.png";
import slide5 from "@/showcase/assets/report-slide-5.png";
import slide6 from "@/showcase/assets/report-slide-6.png";
import slide7 from "@/showcase/assets/report-slide-7.png";

const icons = [BarChart3, TrendingUp, MessageSquare, FileText];
const iconColors = ["text-sky", "text-coral", "text-tangerine", "text-lavender"];
const slides = [slide1.src, slide2.src, slide3.src, slide4.src, slide5.src, slide6.src, slide7.src];

const ReportSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="raporlama" className="py-24 md:py-32 bg-section-warm overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, type: "spring", stiffness: 60 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              İşe alım ve gelişim kararları için{" "}
              <span className="text-gradient">tek veri kaynağı</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 font-light text-lg">
              {content.reporting.text}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {content.reporting.components.map((comp, i) => {
                const Icon = icons[i];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow"
                  >
                    <Icon className={`h-5 w-5 ${iconColors[i]} mt-0.5 shrink-0`} />
                    <div>
                      <h4 className="font-display font-semibold text-sm text-foreground">{comp.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 font-light">{comp.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Button asChild variant="outline" className="gap-2">
              <a href="/ANDRON_Ornek_Rapor.pdf" download>
                <Download className="h-4 w-4" />
                Örnek Raporu İndir (PDF)
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 60 }}
          >
            <div className="rounded-3xl bg-card border border-border p-3 shadow-lg overflow-hidden">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={current}
                    src={slides[current]}
                    alt={`Rapor önizleme ${current + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </AnimatePresence>
              </div>
              {/* Dots */}
              <div className="flex justify-center gap-1.5 mt-3 mb-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ReportSection;

