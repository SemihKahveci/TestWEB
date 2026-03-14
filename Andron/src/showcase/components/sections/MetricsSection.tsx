import { motion } from "framer-motion";
import { content } from "@/showcase/lib/content";
import { useEffect, useState, useRef } from "react";

const AnimatedNumber = ({ value, isVisible }: { value: string; isVisible: boolean }) => {
  const [display, setDisplay] = useState("0");
  const numericPart = value.replace(/[^0-9.]/g, "");
  const suffix = value.endsWith("+") ? "+" : value.endsWith("%") && !value.startsWith("%") ? "%" : "";
  const displayPrefix = value.startsWith("%") ? "%" : "";

  useEffect(() => {
    if (!isVisible) return;
    const target = parseFloat(numericPart);
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        clearInterval(timer);
        setDisplay(value);
        return;
      }
      const formatted = target >= 100 ? Math.floor(current).toLocaleString() : Math.floor(current).toString();
      setDisplay(displayPrefix + formatted + suffix);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, value, numericPart, suffix, displayPrefix]);

  return <span>{isVisible ? display : "0"}</span>;
};

const MetricsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setIsVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-32 bg-hero-gradient text-white overflow-hidden" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="font-display text-2xl md:text-4xl font-700 mb-3 tracking-tight">
            Ölçülebilir{" "}
            <span className="text-gradient">Sonuçlar</span>
          </h2>
          <p className="text-white/50 font-light text-sm md:text-base">{content.metrics.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10 md:mb-16">
          {content.metrics.stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15, type: "spring" }}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-6xl font-800 text-gradient mb-1 md:mb-2">
                <AnimatedNumber value={stat.value} isVisible={isVisible} />
              </div>
              <p className="text-white/50 text-xs md:text-sm font-light">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {content.metrics.benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <div className="font-display text-lg md:text-2xl font-700 text-coral mb-0.5 md:mb-1">{b.value}</div>
              <p className="text-[10px] md:text-xs text-white/40 font-light leading-tight">{b.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
