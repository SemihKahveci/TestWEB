import { Target } from "lucide-react";
import { motion } from "framer-motion";

const AboutMissionVision = () => {
  return (
    <section className="py-24 md:py-32 bg-muted">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl p-8 shadow-sm border-t-4 border-t-coral"
        >
          <Target className="w-8 h-8 mb-4 text-coral" />
          <h3 className="font-display text-xl font-bold mb-3 text-foreground">
            Misyonumuz
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Oyunlaştırmanın, yapay zekanın ve gerçek zamanlı tutum analizinin gücünü birleştirerek şirketlere ve adaylara yepyeni bir yetkinlik keşif deneyimi sunmak. Doğru kişiyi doğru pozisyona eşleştirmek, işe alım süreçlerini kolaylaştırmak.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutMissionVision;
