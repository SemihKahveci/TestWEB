import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Send, Timer, BarChart2, FileText, Gift, LogIn, Gamepad2, Brain, Sparkles, Calendar, Pause, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/showcase/lib/utils";

import hiwSurecIk from "@/showcase/assets/hiw-surec-ik.png";
import hiwSurecAday from "@/showcase/assets/hiw-surec-aday.png";
import hiwDavetIk from "@/showcase/assets/hiw-davet-ik.png";
import hiwDavetAday from "@/showcase/assets/hiw-davet-aday.jpeg";
import hiwDeneyimIk from "@/showcase/assets/hiw-deneyim-ik.png";
import hiwDeneyimAday from "@/showcase/assets/hiw-deneyim-aday.png";
import hiwAnalizIk from "@/showcase/assets/hiw-analiz-ik.png";
import hiwAnalizAday from "@/showcase/assets/hiw-analiz-aday.png";
import hiwRaporIk from "@/showcase/assets/hiw-rapor-ik.png";
import hiwRaporAday from "@/showcase/assets/hiw-rapor-aday.png";

const AUTOPLAY_DURATION = 6000;

const tabs = [
  {
    num: 1,
    label: "Süreç Tasarımı",
    ikIcon: Settings,
    ikText: "Rolü seç, yetkinlikleri belirle, süreci dakikalar içinde kur.",
    ikImage: hiwSurecIk,
    candidateIcon: Gift,
    candidateText: "Gelen kutuna düşen bir davetiye — sıradan değil, bir göreve çağrı.",
    candidateImage: hiwSurecAday,
  },
  {
    num: 2,
    label: "Davet",
    ikIcon: Send,
    ikText: "Tek tıkla davetleri gönder, dashboard'dan takip et.",
    ikImage: hiwDavetIk,
    candidateIcon: LogIn,
    candidateText: "Kodu gir, dünyaya adım at. Değerlendirme burada başlıyor.",
    candidateImage: hiwDavetAday,
  },
  {
    num: 3,
    label: "Deneyim",
    ikIcon: Timer,
    ikText: "Sen beklerken ANDRON çalışıyor — her karar sessizce ölçülüyor.",
    ikImage: hiwDeneyimIk,
    candidateIcon: Gamepad2,
    candidateText: "Sorular değil senaryolar. Baskı değil akış. 15-20 dakika.",
    candidateImage: hiwDeneyimAday,
  },
  {
    num: 4,
    label: "Analiz",
    ikIcon: BarChart2,
    ikText: "Gerçek zamanlı dashboard — kim nerede, nasıl ilerledi.",
    ikImage: hiwAnalizIk,
    candidateIcon: Brain,
    candidateText: "Bitirdin. Sistem senin reflekslerini analiz ediyor.",
    candidateImage: hiwAnalizAday,
  },
  {
    num: 5,
    label: "Rapor",
    ikIcon: FileText,
    ikText: "Yetkinlik bazlı rapor, mülakat soruları ve gelişim önerileri hazır.",
    ikImage: hiwRaporIk,
    candidateIcon: Sparkles,
    candidateText: "Güçlü yönlerin, gelişim alanların — sana özel bir ayna.",
    candidateImage: hiwRaporAday,
  },
];

const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const tab = tabs[active];

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1) % tabs.length);
    setProgress(0);
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    setProgress(0);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + (100 / (AUTOPLAY_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, goNext]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-8 md:pt-40 md:pb-12 bg-gradient-to-b from-background to-muted/30">
        <div className="container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl font-700 tracking-tight text-foreground mb-4"
          >
            Karmaşık süreçleri <span className="text-coral">sadeleştiren</span> bir akış.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-xl mx-auto font-light text-lg mb-2"
          >
            İK profesyoneli ve aday — iki farklı yolculuk, tek bir platform.
          </motion.p>
        </div>
      </section>

      {/* Stepper + Content */}
      <section className="pb-16 md:pb-24">
        <div className="container max-w-6xl">
          {/* Horizontal Stepper */}
          <div className="relative mb-12">
            <div className="flex items-center justify-between gap-0">
              {tabs.map((t, i) => {
                const Icon = i <= active ? t.ikIcon : t.ikIcon;
                const isActive = i === active;
                const isPast = i < active;
                return (
                  <button
                    key={t.num}
                    onClick={() => goTo(i)}
                    className="flex-1 group relative"
                  >
                    {/* Progress bar track */}
                    <div className="h-1 w-full bg-border rounded-full overflow-hidden mb-4">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isPast ? "bg-coral w-full" : "",
                          isActive ? "bg-coral" : "",
                          !isActive && !isPast ? "w-0" : ""
                        )}
                        style={isActive ? { width: `${progress}%`, transition: 'width 50ms linear' } : undefined}
                      />
                    </div>

                    {/* Step indicator */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                          isActive
                            ? "bg-coral border-coral text-white shadow-lg scale-110"
                            : isPast
                              ? "bg-coral/10 border-coral text-coral"
                              : "bg-muted border-border text-muted-foreground group-hover:border-coral/40"
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span
                        className={cn(
                          "font-display text-xs font-600 transition-colors hidden sm:block",
                          isActive ? "text-coral" : isPast ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {t.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Play/Pause */}
            <div className="absolute -top-1 right-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={isPlaying ? "Durdur" : "Oynat"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 text-coral font-display font-600 text-sm mb-3">
                Adım {tab.num} / {tabs.length}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-700 text-foreground tracking-tight">
                {tab.label}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Two-Column Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* IK Column */}
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col">
                <span className="font-display font-700 text-lg tracking-wide text-foreground mb-5 block">
                  İK Profesyoneli
                </span>
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm mb-5 aspect-video">
                  <motion.img
                    key={`ik-${active}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    src={typeof tab.ikImage === "string" ? tab.ikImage : tab.ikImage.src}
                    alt={`${tab.label} - İK Profesyoneli`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <tab.ikIcon className="h-4 w-4 text-coral" />
                  </div>
                  <p className="text-foreground font-light leading-relaxed text-[15px]">{tab.ikText}</p>
                </div>
              </div>

              {/* Candidate Column */}
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col">
                <span className="font-display font-700 text-lg tracking-wide text-foreground mb-5 block">
                  Aday / Çalışan
                </span>
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm mb-5 aspect-video">
                  <motion.img
                    key={`cand-${active}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    src={typeof tab.candidateImage === "string" ? tab.candidateImage : tab.candidateImage.src}
                    alt={`${tab.label} - Aday / Çalışan`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <tab.candidateIcon className="h-4 w-4 text-sky" />
                  </div>
                  <p className="text-foreground font-light leading-relaxed text-[15px]">{tab.candidateText}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default HowItWorks;
