import { XCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const rows = [
  "Gerçek davranış ölçümü",
  "Ezberlenemez içerik",
  "15-20 dakika",
  "Kişiselleştirilmiş rapor",
  "Global normlarla uyum",
  "Oyunlaştırılmış deneyim",
  "Yapay zeka destekli analiz",
];

const AboutComparison = () => {
  return (
    <section className="py-24 md:py-32 bg-hero-gradient">
      <div className="container max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-[32px] font-bold text-center text-white mb-12"
        >
          Geleneksel assessment&apos;tan farkımız ne?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left py-3 px-4 font-medium text-white/50">Özellik</th>
                <th className="text-center py-3 px-4 font-medium text-coral">Geleneksel</th>
                <th className="text-center py-3 px-4 font-medium text-sky">ANDRON</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-4 text-white/50">{row}</td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="w-5 h-5 mx-auto text-coral" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-sky" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutComparison;
