import { User } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Stajyer seviyesinde dahi problem çözme ve önceliklendirme davranışlarını doğal biçimde görünür kıldı.",
    name: "Çılga Çil Ersöz",
    title: "İşe Alım Yöneticisi",
    company: "Ak Gıda / İçim Süt",
  },
  {
    quote: "Ekiplerin karar alma ve iş birliği dinamiklerini daha doğru analiz etmemizi sağladı.",
    name: "Mehmet Vurucu",
    title: "İK ve İdari İşler Grup Müdürü",
    company: "Peyman",
  },
  {
    quote: "Teknik adayların bilgi ötesindeki düşünme ve problem çözme yaklaşımlarını anlamlı ve ölçülebilir biçimde görünür kılıyor.",
    name: "Anıl Töral",
    title: "CEO",
    company: "Avaitech",
  },
];

const TestimonialsSection = () => {
  return (
    <section>
      {/* Header on light background */}
      <div className="py-16 md:py-20 bg-muted">
        <div className="container max-w-6xl">
          <div className="flex justify-center mb-10">
            <div className="w-[30%] h-[2px] bg-coral" />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center font-display font-700 text-foreground text-[28px] mb-3"
          >
            Onlar deneyimledi, onlar anlatsın.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-muted-foreground text-base"
          >
            4 sektör, 2.500+ kullanıcı, tek platform.
          </motion.p>
        </div>
      </div>

      {/* Cards on dark background */}
      <div className="py-16 md:py-20 bg-hero-gradient">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl p-8 flex flex-col bg-white/5 border border-white/10 hover:border-coral/50 transition-colors duration-300"
              >
                <span className="block font-display leading-none mb-4 text-coral text-[48px]">"</span>
                <p className="italic leading-relaxed mb-6 flex-1 text-white text-[15px]">{t.quote}</p>
                <div className="mt-auto">
                  <div className="h-px mb-5 bg-white/15" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-coral">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      <p className="text-white/50 text-[13px]">{t.title} · {t.company}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
