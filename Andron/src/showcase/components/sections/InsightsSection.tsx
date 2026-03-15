import { BookOpen, Users, Rocket, Lightbulb, BarChart3, TrendingUp, MessageSquare, FileText, ArrowRight, Download } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/showcase/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/showcase/components/ui/tabs";

import slide1 from "@/showcase/assets/report-slide-1.png";
import slide2 from "@/showcase/assets/report-slide-2.png";
import slide3 from "@/showcase/assets/report-slide-3.png";
import slide4 from "@/showcase/assets/report-slide-4.png";
import slide5 from "@/showcase/assets/report-slide-5.png";
import slide6 from "@/showcase/assets/report-slide-6.png";
import slide7 from "@/showcase/assets/report-slide-7.png";

const compIcons = [BookOpen, Users, Rocket, Lightbulb];
const compColors = [
  { bg: "bg-sky/10", text: "text-sky", border: "hover:border-sky/30" },
  { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
  { bg: "bg-lavender/10", text: "text-lavender", border: "hover:border-lavender/30" },
  { bg: "bg-tangerine/10", text: "text-tangerine", border: "hover:border-tangerine/30" },
];

const reportIcons = [BarChart3, TrendingUp, MessageSquare, FileText];
const reportIconColors = ["text-sky", "text-coral", "text-tangerine", "text-lavender"];
const slides = [slide1.src, slide2.src, slide3.src, slide4.src, slide5.src, slide6.src, slide7.src];

const tabBgStyles: Record<string, string> = {
  yetkinlikler: "bg-gradient-to-br from-lavender/5 via-background to-coral/5",
  raporlama: "bg-gradient-to-br from-sky/5 via-background to-lavender/5",
};

const InsightsSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("yetkinlikler");

  useEffect(() => {
    if (activeTab !== "raporlama") return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <section id="yetkinlikler" className={`py-24 md:py-32 overflow-hidden transition-colors duration-700 ${tabBgStyles[activeTab]}`}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Neyi ölçüyoruz,{" "}
            <span className={activeTab === "yetkinlikler" ? "text-gradient" : "text-gradient-cool"} style={{ transition: "all 0.5s" }}>
              nasıl raporluyoruz?
            </span>
          </h2>
          <p className="text-muted-foreground font-light">
            12 temel yetkinlik ve veri odaklı raporlama ile karar kalitenizi yükseltin.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/60 rounded-full p-1">
              <TabsTrigger value="yetkinlikler" className="rounded-full px-6 py-2 font-display font-medium text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Yetkinlikler
              </TabsTrigger>
              <TabsTrigger value="raporlama" className="rounded-full px-6 py-2 font-display font-medium text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Raporlama
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Yetkinlikler Tab */}
          <TabsContent value="yetkinlikler">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.competency.cards.map((card, i) => {
                const Icon = compIcons[i];
                const color = compColors[i];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`p-6 rounded-3xl border border-border bg-card ${color.border} hover:shadow-lg transition-all duration-300 group`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${color.text}`} />
                    </div>
                    <h3 className="font-display font-semibold text-base mb-2 text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">{card.text}</p>
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-10"
            >
              <a href="/yetkinlikler" className="inline-flex items-center gap-2 text-coral font-display font-medium text-sm hover:gap-3 transition-all">
                {content.competency.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </TabsContent>

          {/* Raporlama Tab */}
          <TabsContent value="raporlama">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
                  İşe alım ve gelişim kararları için{" "}
                  <span className="text-gradient-cool">tek veri kaynağı</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-8 font-light">
                  {content.reporting.text}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {content.reporting.components.map((comp, i) => {
                    const Icon = reportIcons[i];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow"
                      >
                        <Icon className={`h-5 w-5 ${reportIconColors[i]} mt-0.5 shrink-0`} />
                        <div>
                          <h4 className="font-display font-semibold text-sm text-foreground">{comp.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 font-light">{comp.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button asChild variant="outline" className="gap-2">
                  <a href="/api/download/sample-report">
                    <Download className="h-4 w-4" />
                    Örnek Raporu İndir (PDF)
                  </a>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="rounded-3xl bg-card border border-border p-3 shadow-lg overflow-hidden">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentSlide}
                        src={slides[currentSlide]}
                        alt={`Rapor önizleme ${currentSlide + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    </AnimatePresence>
                  </div>
                  <div className="flex justify-center gap-1.5 mt-3 mb-1">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentSlide ? "w-6 bg-sky" : "w-1.5 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default InsightsSection;

