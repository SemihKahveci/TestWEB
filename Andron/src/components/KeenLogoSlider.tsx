"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

const logos = [
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 1" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 2" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 3" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 4" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 5" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 6" },
  { src: "/assets/images/sample-logo.png", name: "Sample Logo 7" },
];

export default function KeenLogoSlider() {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 7, spacing: 20 },
    mode: "free-snap",
    drag: true,
    breakpoints: {
      "(max-width: 768px)": {
        slides: { perView: 3, spacing: 15 },
      },
      "(max-width: 1024px)": {
        slides: { perView: 5, spacing: 18 },
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
              width={160}
              height={30}
              className="object-contain w-[160px] h-[30px] opacity-70 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
