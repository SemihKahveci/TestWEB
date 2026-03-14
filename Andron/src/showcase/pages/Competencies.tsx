import Navbar from "@/showcase/components/layout/Navbar";
import Footer from "@/showcase/components/layout/Footer";
import { motion } from "framer-motion";
import { BookOpen, Users, Rocket, Lightbulb, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/showcase/lib/utils";

const categories = [
  {
    icon: BookOpen,
    title: "Öğrenme ve Dayanıklılık",
    color: { bg: "bg-sky/10", text: "text-sky" },
    competencies: [
      { name: "Uyumluluk", desc: "Değişen koşullara hızlı ve esnek biçimde uyum sağlama becerisi." },
      { name: "Dayanıklılık", desc: "Zorluklar karşısında dirençli kalma ve toparlanma kapasitesi." },
      { name: "Öğrenme Çevikliği", desc: "Yeni bilgi ve becerileri hızla edinme ve uygulama yetkinliği." },
    ],
  },
  {
    icon: Users,
    title: "İnsan ve İş Birliği",
    color: { bg: "bg-coral/10", text: "text-coral" },
    competencies: [
      { name: "İnsanları Etkileme", desc: "Diğerlerini ikna etme ve yönlendirme becerisi." },
      { name: "Güven Veren İş Birliği", desc: "Güvene dayalı, sağlıklı profesyonel ilişkiler kurma yetkinliği." },
      { name: "Duygusal Zeka", desc: "Duyguları tanıma, anlama ve yönetme kapasitesi." },
      { name: "Müşteri Odaklılık", desc: "İç ve dış müşteri ihtiyaçlarını önceliklendirme becerisi." },
    ],
  },
  {
    icon: Rocket,
    title: "Gelecek Yetkinlikleri",
    color: { bg: "bg-lavender/10", text: "text-lavender" },
    competencies: [
      { name: "Paradoks Çözme ve Karar Alma", desc: "Karmaşık ve çelişkili durumlar arasında etkili karar verme." },
      { name: "Eleştirel ve Sistemsel Düşünce", desc: "Bütünsel bakış açısıyla analiz etme ve sonuca ulaşma." },
      { name: "Yeni Dünya Okuryazarlığı", desc: "Dijital çağın gerektirdiği bilgi ve beceri setine hakimiyet." },
    ],
  },
  {
    icon: Lightbulb,
    title: "Yaratıcılık ve Derinlik",
    color: { bg: "bg-tangerine/10", text: "text-tangerine" },
    competencies: [
      { name: "Yaratıcılık", desc: "Özgün fikirler üretme ve alternatif çözümler geliştirme." },
      { name: "Tasarım Kabiliyeti", desc: "Problem çözmeye yapısal ve yaratıcı yaklaşım." },
      { name: "Düşünsel Derinlik", desc: "Konuları derinlemesine analiz etme ve çok katmanlı düşünme." },
    ],
  },
];

const Competencies = () => {
  const [openCat, setOpenCat] = useState<number | null>(0);

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
              Yetkinlik Mimarisi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              ANDRON'un yetkinlik çerçevesi, bilişsel, sosyal ve stratejik boyutları birlikte ele alacak şekilde tasarlanmıştır. 4 kategori altında 12 temel yetkinlik ölçülür.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-4xl">
          <div className="space-y-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              const isOpen = openCat === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenCat(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cat.color.bg)}>
                        <Icon className={cn("h-6 w-6", cat.color.text)} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground">{cat.title}</h3>
                        <p className="text-sm text-muted-foreground">{cat.competencies.length} yetkinlik</p>
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-border">
                      <div className="grid gap-4 mt-4">
                        {cat.competencies.map((comp, j) => (
                          <div key={j} className="p-4 rounded-xl bg-muted/50">
                            <h4 className="font-semibold text-sm text-foreground mb-1">{comp.name}</h4>
                            <p className="text-sm text-muted-foreground">{comp.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-20 text-center"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Nasıl Ölçüyoruz?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light">
              Karar anındaki davranış verileri toplanır. Bu veriler yetkinlik göstergeleri ile eşleştirilir ve rol bazlı normlarla karşılaştırılarak skorlanır.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Competencies;
