import Image from "next/image";
import { motion } from "framer-motion";
import { getImagePath } from "@/utils/imagePath";

export default function Mockups() {
  return (
    <section
      className="relative w-full py-15 md:py-25 text-center overflow-hidden"
      style={{
        backgroundImage: `url('${process.env.NODE_ENV === 'production' ? '/home' : ''}/assets/images/mockup/mockups-bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Stars background */}
      {/* <div className="absolute top-[94px] left-[127px] z-1">
        <Image
          src="/assets/images/stars.svg"
          alt="Stars Background"
          width={381}
          height={215}
          className="object-cover"
        />
      </div> */}

      {/* Main heading */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-0 relative z-10 max-w-[3400px] mx-auto text-center px-4"
      >
        Scenes From The Game
      </motion.h2>

      {/* Devices container */}
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
          {/* iPhone Mockup - Left */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative z-102 lg:left-50 order-2 lg:order-1"
          >
            <div className="relative">
              <Image
                src={getImagePath("/assets/images/mockup/iphone.png")}
                alt="iPhone Mockup"
                width={156}
                height={305}
                className="w-[120px] h-[235px] md:w-[140px] md:h-[275px] lg:w-[156px] lg:h-[305px] object-cover"
              />
              {/* iPhone screen content - positioned inside the screen area */}
              <div className="absolute top-[8%] left-[8%] right-[8%] bottom-[8%]">
                <Image
                  src={getImagePath("/assets/images/mockup/iphone-bg.png")}
                  alt="iPhone Screen Content"
                  fill
                  className="object-cover rounded-[12px]"
                />
              </div>
            </div>
          </motion.div>

          {/* MacBook Mockup - Center */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="relative z-101 lg:left-20 order-1 lg:order-2"
          >
            <div className="relative">
              <Image
                src={getImagePath("/assets/images/mockup/macbook.png")}
                alt="MacBook Mockup"
                width={800}
                height={600}
                className="w-auto h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] xl:h-[500px] object-cover"
              />
              {/* MacBook screen content - positioned inside the screen area */}
              <div className="absolute top-[6%] left-[12%] right-[12%] bottom-[25%] md:top-[8%] md:left-[11%] md:right-[11%] md:bottom-[10%] xl:top-[8%] xl:left-[10%] xl:right-[10%] xl:bottom-[10%]">
                <Image
                  src={getImagePath("/assets/images/mockup/macbook-bg.png")}
                  alt="MacBook Screen Content"
                  fill
                  className="object-cover rounded-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* iPad Mockup - Right */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="relative z-102 lg:right-30 lg:-top-30 order-3"
          >
            <div className="relative">
              <Image
                src={getImagePath("/assets/images/mockup/ipad.png")}
                alt="iPad Mockup"
                width={400}
                height={600}
                className="w-auto h-[220px] sm:h-[280px] md:h-[320px] lg:h-[350px] xl:h-[450px] object-cover"
              />
              {/* iPad screen content - positioned inside the screen area */}
              <div className="absolute top-[7%] left-[6%] right-[6%] bottom-[7%]">
                <Image
                  src={getImagePath("/assets/images/mockup/ipad-bg.png")}
                  alt="iPad Screen Content"
                  fill
                  className="object-cover rounded-[10px]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom white section */}
      <div
        className="bg-white absolute bottom-[-1px] left-0 right-0 h-[150px] sm:h-[200px] md:h-[280px] lg:h-[350px] xl:h-[440px] z-100 flex items-end pb-1 sm:pb-3 md:pb-4 justify-center"
        style={{
          clipPath: "polygon(50% 40%, 0% 100%, 100% 100%)",
        }}
      >
      </div>
    </section>
  );
}
