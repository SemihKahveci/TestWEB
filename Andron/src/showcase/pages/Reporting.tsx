import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { FileText, BarChart3, MessageSquare, TrendingUp, Download, ArrowRight } from "lucide-react";
import { Button } from "@/showcase/components/ui/button";
import { motion } from "framer-motion";

const reportComponents = [
  { icon: BarChart3, title: "Yetkinlik Çıktıları", text: "Adayın yetkinlik bazlı performans dağılımı. Her yetkinlik için detaylı skor ve norm karşılaştırması.", color: "sky" },
  { icon: TrendingUp, title: "Güçlü Alanlar ve Gelişim Alanları", text: "Öne çıkan yetkinliklerin net görünümü. Adayın güçlü ve gelişime açık alanları ayrıntılı sunulur.", color: "coral" },
  { icon: MessageSquare, title: "Mülakat Soruları", text: "Yetkinliğe özel önerilen doğrulama soruları. Değerlendirme sonuçlarını mülakatla desteklemek için hazırlanmış sorular.", color: "tangerine" },
  { icon: FileText, title: "Gelişim Planları", text: "Kişiselleştirilmiş gelişim yönlendirmeleri. Adayın gelişim potansiyeline göre özelleştirilmiş aksiyonlar.", color: "lavender" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  sky: { bg: "bg-sky/10", text: "text-sky" },
  coral: { bg: "bg-coral/10", text: "text-coral" },
  tangerine: { bg: "bg-tangerine/10", text: "text-tangerine" },
  lavender: { bg: "bg-lavender/10", text: "text-lavender" },
};

const Reporting = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-hero-gradient pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Skor değil, içgörü.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              ANDRON raporu, karar kalıplarını görünür kılar ve işe alım ile gelişim süreçlerini destekleyen net öneriler sunar.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-bold text-center text-foreground mb-16"
          >
            Rapor Bileşenleri
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {reportComponents.map((comp, i) => {
              const Icon = comp.icon;
              const c = colorMap[comp.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.bg}`}>
                    <Icon className={`h-6 w-6 ${c.text}`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{comp.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">{comp.text}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Sample PDF CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col items-center p-8 rounded-2xl border border-border bg-muted/50">
              <Download className="h-10 w-10 text-coral mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Örnek Raporu İndir</h3>
              <p className="text-sm text-muted-foreground mb-4 font-light">ANDRON değerlendirme raporunun örnek çıktısını inceleyin.</p>
              <Button asChild className="bg-coral text-white hover:bg-coral/90">
                <a href="/api/download/sample-report">
                  PDF İndir <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reporting;
