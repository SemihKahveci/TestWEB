import { User } from "lucide-react";
import { motion } from "framer-motion";

const team = [
  { name: "Cengiz Tınmaz", role: "Co-Founder & CEO", text: "17+ yıl İnsan Kaynakları · 800+ saat koçluk" },
  { name: "Serdar Kahveci", role: "Co-Founder & CPO", text: "12+ yıl süreç yönetimi · Borusan, BMC, THY" },
  { name: "Ece Tınmaz", role: "CGO", text: "5+ yıl İK yönetimi · 5+ yıl değerlendirme deneyimi" },
  { name: "Fugi Games", role: "Co-Founder & CTO", text: "Full Stack yazılım ekibi" },
];

const advisors = [
  { name: "Ozan Kuşçu", role: "Kurucu Ortak & Stratejik Danışman" },
  { name: "Nilüfer Dündar Yılmaz", role: "Stratejik Danışman" },
  { name: "Esra Sezgin Karabağ", role: "Stratejik Danışman" },
];

const AboutTeam = () => {
  return (
    <section className="py-24 md:py-32 bg-muted">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl font-bold text-center mb-16 text-foreground"
        >
          Ekibimiz
        </motion.h2>

        {/* Core team */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="w-[120px] h-[120px] rounded-full bg-card flex items-center justify-center mx-auto mb-4 border-2 border-transparent group-hover:border-coral transition-colors duration-300 shadow-sm">
                <User className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h4 className="font-display font-bold text-base text-foreground">{member.name}</h4>
              <p className="text-sm font-medium mt-0.5 text-coral">{member.role}</p>
              <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">{member.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-border max-w-xs mx-auto mb-12" />

        {/* Advisors */}
        <h3 className="font-display text-xl text-center mb-8 text-muted-foreground">
          Danışma Kurulu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {advisors.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-3 shadow-sm">
                <User className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h4 className="font-display font-semibold text-sm text-foreground">{a.name}</h4>
              <p className="text-xs mt-0.5 text-coral">{a.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutTeam;
