"use client";

import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { Gamepad2, Brain, FileText, ArrowRight, Smartphone, BarChart3, Users, Calendar, Settings, Send, Timer, BarChart2, Gift, LogIn, Sparkles, Pause, Play } from "lucide-react";
import { Button } from "@/showcase/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/showcase/lib/utils";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useOpenContactFormDialog } from "@/showcase/components/ContactFormDialogProvider";

import game1 from "@/showcase/assets/andron-game-1.png";
import game2 from "@/showcase/assets/andron-game-2.png";
import game3 from "@/showcase/assets/andron-game-3.png";
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

const steps = [
  {
    icon: Gamepad2, title: "Deneyim", color: "coral",
    text: "Aday, mobil uyumlu interaktif senaryoya katılır ve gerçek iş durumlarına benzer kararlar alır.",
    detail: "ANDRON'un oyunlaştırılmış deneyimi, adayları alışıldık test ortamından çıkararak gerçek karar senaryolarına sokar. Bilinçli cevaplar değil, doğal refleksler ölçülür.",
    image: game1,
  },
  {
    icon: Brain, title: "Analiz", color: "sky",
    text: "Sistem, karar süresi, seçim örüntüsü ve davranış göstergelerini analiz eder.",
    detail: "Karar kalıpları, davranış örüntüleri ve süre analizi birleştirilerek yetkinlik modeline eşleştirilir. AI destekli yorumlama ile derinlemesine analiz yapılır.",
    image: game2,
  },
  {
    icon: FileText, title: "Rapor", color: "lavender",
    text: "Rol uyumu, güçlü alanlar ve gelişim potansiyeli net biçimde sunulur.",
    detail: "Yetkinlik bazlı, açık ve yorumlanabilir raporlar üretilir. İşe alım ve gelişim kararlarını destekleyen net içgörüler, mülakat soruları ve gelişim önerileri sunulur.",
    image: game3,
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  coral: { bg: "bg-coral/10", text: "text-coral" },
  sky: { bg: "bg-sky/10", text: "text-sky" },
  lavender: { bg: "bg-lavender/10", text: "text-lavender" },
};

const AUTOPLAY_DURATION = 6000;

const processTabs = [
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

const techFeatures = [
  { icon: Brain, title: "Karar Kalıbı Analizi", text: "Karar anındaki davranış verilerini analiz ederek yetkinlik göstergeleri ile eşleştirir.", color: "sky" },
  { icon: BarChart3, title: "Davranış Göstergesi Eşleştirme", text: "Bilinçli cevaplar değil, gerçek refleksler ölçülür ve sınıflandırılır.", color: "coral" },
  { icon: Users, title: "Rol Bazlı Normlama", text: "Sonuçlar, pozisyon ve sektör normlarıyla karşılaştırılarak skorlanır.", color: "lavender" },
  { icon: Smartphone, title: "AI Destekli Yorumlama", text: "Yapay zeka ile derinlemesine yetkinlik analizi ve öneriler üretilir.", color: "tangerine" },
];

const techColorMap: Record<string, { bg: string; text: string; border: string }> = {
  sky: { bg: "bg-sky/10", text: "text-sky", border: "hover:border-sky/30" },
  coral: { bg: "bg-coral/10", text: "text-coral", border: "hover:border-coral/30" },
  lavender: { bg: "bg-lavender/10", text: "text-lavender", border: "hover:border-lavender/30" },
  tangerine: { bg: "bg-tangerine/10", text: "text-tangerine", border: "hover:border-tangerine/30" },
};

const Andron = () => {
  const openContactForm = useOpenContactFormDialog();
  const [activeProcess, setActiveProcess] = useState(0);
  const [isProcessPlaying, setIsProcessPlaying] = useState(true);
  const [processProgress, setProcessProgress] = useState(0);
  const processTab = processTabs[activeProcess];

  const goToNextProcess = useCallback(() => {
    setActiveProcess((prev) => (prev + 1) % processTabs.length);
    setProcessProgress(0);
  }, []);

  const goToProcess = (index: number) => {
    setActiveProcess(index);
    setProcessProgress(0);
  };

  useEffect(() => {
    if (!isProcessPlaying) return;
    const interval = setInterval(() => {
      setProcessProgress((prev) => {
        if (prev >= 100) {
          goToNextProcess();
          return 0;
        }
        return prev + (100 / (AUTOPLAY_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isProcessPlaying, goToNextProcess]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-hero-gradient pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-4xl md:text-5xl font-bold text-white mb-6"
            >
              ANDRON Nasıl Çalışır?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              ANDRON, rol bazlı senaryolar üzerinden adayların karar davranışlarını analiz eden oyunlaştırılmış bir değerlendirme platformudur.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 3-Step Detail */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="space-y-16">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const c = colorMap[step.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={cn(
                    "grid grid-cols-1 lg:grid-cols-2 gap-10 items-center",
                    i % 2 === 1 && "lg:flex-row-reverse"
                  )}
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", c.bg)}>
                        <Icon className={cn("h-5 w-5", c.text)} />
                      </div>
                      <span className={cn("text-xs font-bold tracking-widest uppercase", c.text)}>Adım {i + 1}</span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">{step.title}</h2>
                    <p className="text-muted-foreground mb-3">{step.text}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed font-light">{step.detail}</p>
                  </div>
                  <div className={cn("relative aspect-video rounded-2xl overflow-hidden border border-border shadow-sm", i % 2 === 1 ? "lg:order-1" : "")}>
                    <Image
                      src={step.image}
                      alt={`ANDRON - ${step.title}`}
                      fill
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Process */}
      <section className="py-20 md:py-28 bg-section-cool">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Karmaşık süreçleri <span className="text-coral">sadeleştiren</span> bir akış.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-light text-lg">
              İK profesyoneli ve aday — iki farklı yolculuk, tek bir platform.
            </p>
          </motion.div>

          <div className="relative mb-12">
            <div className="flex items-center justify-between gap-0">
              {processTabs.map((tabItem, i) => {
                const Icon = tabItem.ikIcon;
                const isActive = i === activeProcess;
                const isPast = i < activeProcess;

                return (
                  <button
                    key={tabItem.num}
                    onClick={() => goToProcess(i)}
                    className="flex-1 group relative"
                  >
                    <div className="h-1 w-full bg-border rounded-full overflow-hidden mb-4">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isPast ? "bg-coral w-full" : "",
                          isActive ? "bg-coral" : "",
                          !isActive && !isPast ? "w-0" : ""
                        )}
                        style={isActive ? { width: `${processProgress}%`, transition: "width 50ms linear" } : undefined}
                      />
                    </div>

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
                          "font-display text-xs font-semibold transition-colors hidden sm:block",
                          isActive ? "text-coral" : isPast ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {tabItem.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="absolute -top-1 right-0">
              <button
                onClick={() => setIsProcessPlaying(!isProcessPlaying)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={isProcessPlaying ? "Durdur" : "Oynat"}
              >
                {isProcessPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`process-title-${activeProcess}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 text-coral font-display font-semibold text-sm mb-3">
                Adım {processTab.num} / {processTabs.length}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {processTab.label}
              </h2>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeProcess}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col">
                <span className="font-display font-bold text-lg tracking-wide text-foreground mb-5 block">
                  İK Profesyoneli
                </span>
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm mb-5 aspect-video">
                  <motion.img
                    key={`ik-${activeProcess}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    src={typeof processTab.ikImage === "string" ? processTab.ikImage : processTab.ikImage.src}
                    alt={`${processTab.label} - İK Profesyoneli`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <processTab.ikIcon className="h-4 w-4 text-coral" />
                  </div>
                  <p className="text-foreground font-light leading-relaxed text-[15px]">{processTab.ikText}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col">
                <span className="font-display font-bold text-lg tracking-wide text-foreground mb-5 block">
                  Aday / Çalışan
                </span>
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm mb-5 aspect-video">
                  <motion.img
                    key={`candidate-${activeProcess}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    src={typeof processTab.candidateImage === "string" ? processTab.candidateImage : processTab.candidateImage.src}
                    alt={`${processTab.label} - Aday / Çalışan`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <processTab.candidateIcon className="h-4 w-4 text-sky" />
                  </div>
                  <p className="text-foreground font-light leading-relaxed text-[15px]">{processTab.candidateText}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Karar Davranışı Analizi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light">
              ANDRON, karar anındaki davranış verilerini analiz ederek yetkinlik göstergeleri ile eşleştirir.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techFeatures.map((f, i) => {
              const Icon = f.icon;
              const c = techColorMap[f.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn("p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all", c.border)}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", c.bg)}>
                    <Icon className={cn("h-6 w-6", c.text)} />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground font-light">{f.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-hero-gradient">
        <div className="container text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">ANDRON&apos;u Deneyimleyin</h2>
          <p className="text-white/60 mb-8 font-light">
            Kurumsal teklif için bilgilerinizi bırakın; kısa sürede size dönelim.
          </p>
          <Button
            type="button"
            size="lg"
            className="bg-coral text-white hover:bg-coral/90 rounded-full"
            onClick={() => openContactForm()}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Görüşme Planla <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Andron;
