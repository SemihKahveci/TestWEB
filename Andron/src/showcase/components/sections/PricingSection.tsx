import { useState } from "react";
import { Button } from "@/showcase/components/ui/button";
import { Slider } from "@/showcase/components/ui/slider";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import ContactFormDialog from "@/showcase/components/ContactFormDialog";

const PricingSection = () => {
  const [assessments, setAssessments] = useState([100]);
  const [contactOpen, setContactOpen] = useState(false);
  const count = assessments[0];

  const pricePerUnit = count <= 500 ? 5.0 : count <= 1000 ? 4.75 : count <= 2000 ? 4.5 : 4.5;
  const totalPrice = count * pricePerUnit;
  const savingsPercent = count <= 500 ? 0 : count <= 1000 ? 5 : 10;
  const isEnterprise = count >= 2001;

  const features = [
    "Yetkinlik Bazlı Raporlama",
    "Kişiselleştirilmiş Gelişim Planı",
    "Mülakat Soruları",
    "Dashboard Erişimi",
    "Tüm Cihazlarda Çalışır",
    "6 Ay Geçerli Sonuçlar",
  ];

  const formatCurrency = (val: number) =>
    val.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <section id="fiyatlandirma" className="overflow-hidden">
      {/* Header */}
      <div className="py-20 md:py-28 bg-hero-gradient">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
              Yanlış işe alımın bedeli çok daha ağır.
            </h2>
            <p className="text-lg font-light text-white/70">
              Sadece ihtiyacın kadar öde. Kurulum ücreti yok, gizli ücret yok.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Calculator Card */}
      <div className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
            className="max-w-4xl mx-auto rounded-3xl bg-card border border-border shadow-lg p-8 md:p-12"
          >
            {/* Inline question */}
            <div className="text-center mb-10">
              <p className="font-display text-xl md:text-2xl font-semibold text-foreground">
                Kaç assessment&apos;a ihtiyacın var?
              </p>
            </div>

            {/* Inline count display */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-muted-foreground font-light text-lg">İhtiyacım olan</span>
              <span className="font-display text-4xl md:text-5xl font-extrabold text-coral">
                {count >= 2500 ? "2.500+" : count.toLocaleString("tr-TR")}
              </span>
              <span className="text-muted-foreground font-light text-lg">Assessment</span>
            </div>

            {/* Slider */}
            <div className="mb-12 relative max-w-2xl mx-auto">
              <Slider
                value={assessments}
                onValueChange={setAssessments}
                min={1}
                max={2500}
                step={1}
                className="w-full pricing-slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 font-light">
                <span>1</span>
                <span>2.500+</span>
              </div>
            </div>

            {/* 3 Stats — hidden when enterprise */}
            {!isEnterprise && (
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border mb-10">
                <div className="text-center py-4 md:py-0">
                  <p className="text-sm text-muted-foreground mb-2 font-light">Assessment Başına Fiyat</p>
                  <p className="font-display font-bold text-3xl md:text-4xl text-foreground">
                    ${pricePerUnit.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="text-center py-4 md:py-0">
                  <p className="text-sm text-muted-foreground mb-2 font-light">Tasarrufun</p>
                  <p className={`font-display font-bold text-3xl md:text-4xl ${savingsPercent > 0 ? "text-gradient" : "text-muted-foreground/40"}`}>
                    {savingsPercent > 0 ? `${savingsPercent}%` : "—"}
                  </p>
                </div>
                <div className="text-center py-4 md:py-0">
                  <p className="text-sm text-muted-foreground mb-2 font-light">Toplam Tutar</p>
                  <p className="font-display font-bold text-3xl md:text-4xl text-foreground">
                    ${formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            {isEnterprise && (
              <div className="block max-w-md mx-auto">
                <Button
                  onClick={() => setContactOpen(true)}
                  className="w-full h-14 text-base font-semibold rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Kurumsal Teklif Al
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-4 font-light">
              Fiyatlara KDV dahil değildir.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 md:py-20 bg-hero-gradient">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-display font-semibold text-center mb-10 text-white text-2xl">
              Her pakette bunlar dahil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-5 py-4 bg-white/5 border border-white/10"
                >
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-sky" />
                  <span className="font-medium text-white text-[15px]">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <ContactFormDialog open={contactOpen} onOpenChange={setContactOpen} />
    </section>
  );
};

export default PricingSection;
