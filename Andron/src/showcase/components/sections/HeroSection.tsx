import { Play, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { content } from "@/showcase/lib/content";
import { motion } from "framer-motion";
import { useState } from "react";

const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const VIDEO_URL: string = "https://www.youtube.com/embed/JLz9SgT8ZZ8";

  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center bg-hero-gradient overflow-hidden">
      {/* Animated decorative blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--coral) / 0.08), transparent)" }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -left-20 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--sky) / 0.1), transparent)" }}
          animate={{ scale: [1, 1.2, 1], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[200px] md:w-[300px] h-[200px] md:h-[300px] rounded-full hidden sm:block"
          style={{ background: "radial-gradient(circle, hsl(var(--lavender) / 0.08), transparent)" }}
          animate={{ scale: [1, 1.1, 1], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative z-10 py-16 md:py-28">
        {/* Text content - centered */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6 md:mb-8"
          >
            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5 text-coral" />
            <span className="text-[10px] md:text-xs font-medium text-white/80 tracking-wide">Yeni Nesil Değerlendirme Platformu</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="font-display text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-4 md:mb-6 tracking-tight px-2"
          >
            Gerçek yetkinlik,{" "}
            <span className="text-gradient">karar anında</span>{" "}
            ortaya çıkar.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="text-base md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-light px-4"
          >
            {content.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8 px-4"
          >
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-full text-sm md:text-base font-semibold bg-coral text-white hover:bg-coral/90 shadow-lg hover:shadow-xl hover:shadow-coral/25 transition-all duration-300"
            >
              <Calendar className="w-4 md:w-5 h-4 md:h-5" />
              Ücretsiz Keşif Görüşmesi Ayarla
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Video Trailer Area */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-coral/20 via-lavender/20 to-sky/20 blur-xl opacity-60" />
            
            <div className="relative aspect-video w-full">
              {isPlaying && VIDEO_URL ? (
                VIDEO_URL.includes("youtube") || VIDEO_URL.includes("vimeo") ? (
                  <iframe
                    src={`${VIDEO_URL}?autoplay=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={VIDEO_URL}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    controls
                  />
                )
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-md group cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-coral/90 backdrop-blur-sm flex items-center justify-center shadow-lg mb-4 md:mb-6"
                    style={{ boxShadow: "0 0 60px hsl(var(--coral) / 0.4)" }}
                  >
                    <Play className="w-6 h-6 md:w-10 md:h-10 text-white fill-white ml-1" />
                  </motion.div>
                  
                  <span className="text-white/90 text-sm md:text-lg font-medium tracking-wide">
                    {content.hero.secondary}
                  </span>
                  <span className="text-white/40 text-xs md:text-sm mt-1">2:30 dk</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
