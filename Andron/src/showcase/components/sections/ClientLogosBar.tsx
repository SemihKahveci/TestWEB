import { motion } from "framer-motion";
import clientLogos from "@/showcase/assets/client-logos.png";

const ClientLogosBar = () => {
  return (
    <section className="py-12 md:py-16 bg-muted/50 overflow-hidden">
      <div className="container mb-6">
        <p className="text-center text-xs font-display font-medium text-muted-foreground tracking-widest uppercase">
          Bize güvenen firmalar
        </p>
      </div>
      <div className="relative w-full">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-muted/50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-muted/50 to-transparent pointer-events-none" />

        <motion.div
          className="flex items-center gap-0 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex-shrink-0 px-8">
              <img
                src={clientLogos.src}
                alt="Müşteri logoları"
                className="h-10 md:h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ClientLogosBar;

