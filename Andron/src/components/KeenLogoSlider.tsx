"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { getImagePath } from "@/utils/imagePath";

const logos = [
  { src: getImagePath("/assets/images/Peyman.png"), name: "Peyman" },
  { src: getImagePath("/assets/images/KNSOtomotiv.png"), name: "KNSOtomotiv" },
  { src: getImagePath("/assets/images/agilePartners.png"), name: "agilePartners" },
  { src: getImagePath("/assets/images/narEgitim.jpg"), name: "narEgitim" },
];

export default function KeenLogoSlider() {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 4, spacing: 30 },
    mode: "free-snap",
    drag: true,
    breakpoints: {
      "(max-width: 768px)": {
        slides: { perView: 2, spacing: 20 },
      },
      "(max-width: 1024px)": {
        slides: { perView: 3, spacing: 25 },
      },
    },
    created(slider) {
      slider.moveToIdx(0);
    },
  });

  // Avtomatik kayma üçün
  useEffect(() => {
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 3000);
    return () => clearInterval(interval);
  }, [instanceRef]);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4">
      <style jsx>{`
        .keen-slider {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .keen-slider__slide {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }
      `}</style>
      <div ref={sliderRef} className="keen-slider">
        {logos.map((logo, i) => (
          <div
            className="keen-slider__slide"
            key={i}
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={480}
              height={120}
              className="object-contain max-w-[480px] max-h-[120px] w-full h-auto opacity-70 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
