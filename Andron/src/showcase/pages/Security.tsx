import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { Shield, Globe, Lock, Cloud, KeyRound, Server, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const securityDetails = [
  { icon: Lock, title: "Veri İletiminde Şifreleme", text: "Tüm veri iletimi TLS protokolü ile korunur. Uçtan uca şifreleme ile veriler güvenli biçimde aktarılır.", color: "sky" },
  { icon: Server, title: "Veri Depolama Güvenliği", text: "Veriler güvenli bulut altyapısında, şifrelenmiş biçimde saklanır. Düzenli yedekleme ve felaket kurtarma prosedürleri uygulanır.", color: "coral" },
  { icon: KeyRound, title: "Erişim Kontrolü", text: "Rol bazlı erişim ve yetkilendirme uygulanır. Çok faktörlü kimlik doğrulama (2FA) desteklenir.", color: "lavender" },
  { icon: Shield, title: "KVKK Uyumluluğu", text: "Kişisel verilerin korunmasına ilişkin KVKK mevzuatına tam uyumluluk sağlanır.", color: "tangerine" },
  { icon: Globe, title: "GDPR Uyumluluğu", text: "Avrupa Birliği Genel Veri Koruma Tüzüğü standartlarına uygun süreçler yürütülür.", color: "sky" },
  { icon: Cloud, title: "Güvenli Bulut Altyapısı", text: "%99.9 platform uptime garantisi. Yüksek erişilebilirlik ve ölçeklenebilir altyapı.", color: "coral" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  sky: { bg: "bg-sky/10", text: "text-sky" },
  coral: { bg: "bg-coral/10", text: "text-coral" },
  lavender: { bg: "bg-lavender/10", text: "text-lavender" },
  tangerine: { bg: "bg-tangerine/10", text: "text-tangerine" },
};

const certifications = [
  "2-Factor Authentication",
  "GDPR Compliant",
  "KVKK Uyumlu",
  "Detailed Privacy Policy",
  "%99.9 Platform Uptime",
  "Fully Encrypted",
];

const Security = () => {
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
              Güvenlik ve Veri Koruma
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              ANDRON, veri güvenliğini ürün tasarımının merkezine koyar. Kurumsal düzeyde güvenlik standartları ile verileriniz korunur.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {securityDetails.map((item, i) => {
              const Icon = item.icon;
              const c = colorMap[item.color];
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
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">{item.text}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <h2 className="font-display text-2xl font-bold text-center text-foreground mb-8">Sertifikalar & Standartlar</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <CheckCircle2 className="h-4 w-4 text-sky shrink-0" />
                  <span className="text-sm text-foreground font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
