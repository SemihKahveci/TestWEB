import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { Gamepad2, Brain, FileText, ArrowRight, Smartphone, BarChart3, Users, Building2, UserCheck, Calendar } from "lucide-react";
import { Button } from "@/showcase/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/showcase/lib/utils";
import Image from "next/image";

import game1 from "@/showcase/assets/andron-game-1.png";
import game2 from "@/showcase/assets/andron-game-2.png";
import game3 from "@/showcase/assets/andron-game-3.png";

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

const companySteps = [
  "Hesap oluşturun",
  "Pozisyon ve yetkinlikleri tanımlayın",
  "Adaylara davet gönderin",
  "Raporları dashboard üzerinden görüntüleyin",
  "Karar ve gelişim süreçlerini yönetin",
];

const candidateSteps = [
  "Davet bağlantısı ile giriş yapın",
  "15 dakikalık senaryoyu tamamlayın",
  "Karar verin ve deneyimi tamamlayın",
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

      {/* Process Flow */}
      <section className="py-20 md:py-28 bg-section-cool">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-coral" />
                <h3 className="font-display text-xl font-bold text-foreground">Şirketler İçin</h3>
              </div>
              <ol className="space-y-4">
                {companySteps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-coral/10 text-coral text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="h-6 w-6 text-sky" />
                <h3 className="font-display text-xl font-bold text-foreground">Adaylar İçin</h3>
              </div>
              <ol className="space-y-4">
                {candidateSteps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-sky/10 text-sky text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
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
          <p className="text-white/60 mb-8 font-light">Takvimimizden size uygun bir slot seçin — 30 dakika yeter.</p>
          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-coral text-white hover:bg-coral/90 rounded-full">
              <Calendar className="mr-2 h-4 w-4" />
              Görüşme Planla <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Andron;
