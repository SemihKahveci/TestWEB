 "use client";

import { Settings, Mail, Clock, BarChart3, FileText, Gift, Gamepad2, CheckCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/showcase/components/ui/tooltip";

const steps = [
  {
    num: 1,
    ikIcon: Settings,
    ikText: "Süreci tasarla, yetkinlikleri seç",
    ikTooltip: "Pozisyona özel yetkinlik seti oluştur, değerlendirme sürecini dakikalar içinde kur.",
    candidateIcon: Gift,
    candidateText: "Davetiyeni al",
    candidateTooltip: "Gelen kutuna düşen bir davetiye — sıradan değil, bir göreve çağrı.",
  },
  {
    num: 2,
    ikIcon: Mail,
    ikText: "Adayları tek tıkla davet et",
    ikTooltip: "Toplu veya tekli davet gönder, süreci dashboard'dan takip et.",
    candidateIcon: Gamepad2,
    candidateText: "Göreve başla",
    candidateTooltip: "Kodu gir, dünyaya adım at. Değerlendirme burada başlıyor.",
  },
  {
    num: 3,
    ikIcon: Clock,
    ikText: "Bekle — sistem senin için çalışıyor",
    ikTooltip: "Sen beklerken ANDRON çalışıyor — her karar sessizce ölçülüyor.",
    candidateIcon: Gamepad2,
    candidateText: "Senaryoları yaşa",
    candidateTooltip: "Sorular değil senaryolar. Baskı değil akış. 15-20 dakika.",
  },
  {
    num: 4,
    ikIcon: BarChart3,
    ikText: "Analizleri dashboard'dan incele",
    ikTooltip: "Gerçek zamanlı dashboard — kim nerede, nasıl ilerledi.",
    candidateIcon: CheckCircle,
    candidateText: "Tamamla",
    candidateTooltip: "Bitirdin. Sistem senin reflekslerini analiz ediyor.",
  },
  {
    num: 5,
    ikIcon: FileText,
    ikText: "Raporla, kararını ver",
    ikTooltip: "Yetkinlik bazlı rapor, mülakat soruları ve gelişim önerileri hazır.",
    candidateIcon: Eye,
    candidateText: "İçgörülerini keşfet",
    candidateTooltip: "Güçlü yönlerin, gelişim alanların — sana özel bir ayna.",
  },
];

const HowItWorksSection = () => {
  const router = useRouter();

  return (
    <section id="nasil-calisir" className="py-16 md:py-32 bg-muted/50 overflow-hidden">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-2xl md:text-4xl font-bold text-center mb-3 md:mb-4 text-foreground tracking-tight"
        >
          İki taraf, <span className="text-coral">tek deneyim.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground mb-10 md:mb-16 max-w-xl mx-auto font-light text-sm md:text-base"
        >
          ANDRON, İK profesyonelinin sürecini sadeleştirirken adayın deneyimini unutulmaz kılıyor.
        </motion.p>

        {/* Column Headers — hidden on mobile */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-4 mb-8 max-w-4xl mx-auto">
          <div className="text-right">
            <span className="font-display font-semibold text-sm tracking-wide text-foreground">İK Profesyoneli</span>
          </div>
          <div className="w-px" />
          <div className="text-left">
            <span className="font-display font-semibold text-sm tracking-wide text-foreground">Aday / Çalışan</span>
          </div>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center line — desktop only */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

          <div className="flex flex-col gap-4 md:gap-6">
            {steps.map((step, i) => {
              const IkIcon = step.ikIcon;
              const CandidateIcon = step.candidateIcon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 justify-end p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow cursor-default">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{step.ikText}</p>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                            <IkIcon className="h-4 w-4 text-coral" />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        {step.ikTooltip}
                      </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center font-display font-bold text-sm z-10 shadow-md">
                        {step.num}
                      </div>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow cursor-default">
                          <div className="w-9 h-9 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0">
                            <CandidateIcon className="h-4 w-4 text-sky" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{step.candidateText}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        {step.candidateTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Mobile layout — stacked cards with step number */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center font-display font-bold text-xs flex-shrink-0">
                        {step.num}
                      </div>
                      <span className="font-display font-semibold text-xs text-muted-foreground">Adım {step.num}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-11">
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                        <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IkIcon className="h-3.5 w-3.5 text-coral" />
                        </div>
                        <p className="text-xs font-medium text-foreground leading-tight">{step.ikText}</p>
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                        <div className="w-7 h-7 rounded-lg bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CandidateIcon className="h-3.5 w-3.5 text-sky" />
                        </div>
                        <p className="text-xs font-medium text-foreground leading-tight">{step.candidateText}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 md:mt-14"
        >
          <button
            onClick={() => router.push("/nasil-calisir")}
            className="inline-flex items-center gap-2 text-coral hover:text-coral/80 font-display font-semibold text-sm transition-colors"
          >
            Tüm süreci detaylı gör ->
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

