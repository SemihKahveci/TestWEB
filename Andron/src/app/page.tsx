"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getImagePath } from "@/utils/imagePath";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import About from "@/components/About";
import GetStarted from "@/components/GetStarted";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/calendar-custom.css";
import React from "react";
import Mockups from "@/components/Mockups";
import KeenLogoSlider from "@/components/KeenLogoSlider";

function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  handler: () => void
) {
  useEffect(() => {
    function listener(event: MouseEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

function BookMeetingDrawer({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState<Date>(new Date(2025, 1, 18));
  const [selectedTime, setSelectedTime] = useState("14:30");
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isMouseOverDrawer, setIsMouseOverDrawer] = useState(false);

  // Kursorun komponent üzərində olub-olmadığını izləmək
  useEffect(() => {
    const handleMouseEnter = () => setIsMouseOverDrawer(true);
    const handleMouseLeave = () => setIsMouseOverDrawer(false);

    const drawerElement = drawerRef.current;
    if (drawerElement) {
      drawerElement.addEventListener("mouseenter", handleMouseEnter);
      drawerElement.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (drawerElement) {
        drawerElement.removeEventListener("mouseenter", handleMouseEnter);
        drawerElement.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // Wheel hadisəsini idarə etmək
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isMouseOverDrawer) {
        // Kursor drawer üzərindədirsə, səhifənin scrollunu ləğv et
        event.preventDefault();
        // Drawer-in öz scrollunu icazə ver
        if (drawerRef.current) {
          drawerRef.current.scrollTop += event.deltaY;
        }
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [isMouseOverDrawer]);

  // Səhifənin əsas scrollunu kilidləmək
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useOnClickOutside(drawerRef as React.RefObject<HTMLDivElement>, onClose);

  // Saatler ve disable/selected durumu
  const times = [
    { t: "9:30", d: true },
    { t: "10:30", d: false },
    { t: "11:30", d: false },
    { t: "12:30", d: false },
    { t: "13:30", d: false },
    { t: "14:30", d: false },
    { t: "15:30", d: false },
    { t: "16:30", d: false },
    { t: "18:30", d: false },
  ];

  // Calendar tileClassName ile günleri özelleştir
  function tileClassName({ date: d, view }: { date: Date; view: string }) {
    if (view === "month" && d.getDate() === 18 && d.getMonth() === 1) {
      return "!bg-blue-500 !text-white !font-bold";
    }
    return "";
  }

  return (
    <div
      ref={drawerRef}
      className="relative flex md:flex-row flex-col w-full md:max-w-[700px] max-w-sm mx-auto bg-white rounded-none md:rounded-l-2xl shadow-2xl border border-gray-200 h-screen max-h-screen overflow-y-auto"
      style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
    >
      {/* X ikonu - drawer-in ən üstündə */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 md:top-4 md:right-4 text-3xl text-gray-400 hover:text-red-500 z-20"
        aria-label="Close"
      >
        ×
      </button>
      {/* Sol: Calendar ve saat */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-[260px]">
        <div className="mb-2 text-lg font-bold text-black">
          Tarih ve Saat Seçiniz
        </div>
        <div className="text-xs text-gray-500 mb-2">+GMT</div>
        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 mb-6 focus:outline-none">
          <option>(GMT +3:00 ) Türkiye Saati</option>
        </select>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-black">Şubat 2025</span>
            <div className="flex gap-2">
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition">
                <svg width="16" height="16" fill="none">
                  <path
                    d="M10 4l-4 4 4 4"
                    stroke="#222"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition">
                <svg width="16" height="16" fill="none">
                  <path
                    d="M6 12l4-4-4-4"
                    stroke="#222"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* Calendar */}
          <Calendar
            locale="tr-TR"
            value={date}
            onChange={(d) => {
              if (Array.isArray(d)) {
                setDate(d[0] ?? date);
              } else if (d) {
                setDate(d);
              } else {
                setDate(date);
              }
            }}
            tileClassName={tileClassName}
            prev2Label={null}
            next2Label={null}
            minDetail="month"
            className="!border-0 !w-full custom-calendar calendar-black-text"
            calendarType="iso8601"
          />
        </div>
        <div className="font-bold text-left mb-2 mt-2 text-black">
          {date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {times.map(({ t, d }) => (
            <button
              key={t}
              disabled={d}
              onClick={() => setSelectedTime(t)}
              className={`rounded-lg px-0 py-2 border text-base font-semibold transition w-full
                ${
                  d
                    ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                    : selectedTime === t
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-blue-200 hover:bg-blue-50"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {/* Sağ: Görsel ve info */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-center items-center relative min-w-[260px]">
        <div className="w-full flex justify-center mb-2">
          <Image
            src={getImagePath("/assets/images/book-a-call.svg")}
            alt="Book a Call"
            width={220}
            height={180}
            className="mb-2"
          />
        </div>
        <div className="font-bold text-2xl mb-4 text-black text-left w-full">
          Book a Call
        </div>
        <ul className="mb-6 space-y-3 text-gray-700 text-sm w-full text-left">
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
              <Image
                src={getImagePath("/assets/icons/calendar.svg")}
                alt="calendar"
                width={18}
                height={18}
              />
            </span>
            <span>
              Lorem Ipsum has been the industry&apos;s standard dummy text ever
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
              <Image
                src={getImagePath("/assets/icons/camera.svg")}
                alt="camera"
                width={18}
                height={18}
              />
            </span>
            <span>
              Lorem Ipsum has been the industry&apos;s standard dummy text ever
            </span>
          </li>
        </ul>
        <div
          className="w-full rounded-xl py-[21px] px-[18px] flex flex-col items-start mb-6"
          style={{
            borderRadius: "15px",
            background: "rgba(206, 235, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 text-gray-700">
            <Image
              src={getImagePath("/assets/icons/calendar.svg")}
              alt="calendar"
              width={18}
              height={18}
            />
            <span className="font-semibold text-sm text-black">
              {date.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                weekday: "long",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-[21px] text-gray-700">
            <Image
              src={getImagePath("/assets/icons/clock.svg")}
              alt="clock"
              width={18}
              height={18}
            />
            <span className="font-semibold text-sm text-black">
              {selectedTime}
            </span>
          </div>
          <span className="text-xs text-[#000] mt-[21px] text-left font-[400] leading-[19px] font-inter">
            Lorem Ipsum has been the industry&apos;s standard dummy text ever
          </span>
        </div>
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg text-base transition mt-2">
          Şimdi Oluştur
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(25);
  const [helpOpen, setHelpOpen] = useState(true);

  // Drawer açıq olduqda body scrollunu kilidləmək
  useEffect(() => {
    if (meetingOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [meetingOpen]);

  return (
    <main className="w-full font-sans">
      {/* Header */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center"
        id="header"
      >
        {/* Header background */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={getImagePath("/assets/images/header-new-bg.png")}
            alt="Header Background"
            fill
            className="object-cover w-full h-full"
            priority
          />

          {/* Yer kürəsi */}
          <Image
            src={getImagePath("/assets/images/earth.png")}
            alt="Earth"
            width={296}
            height={271}
            className="object-cover w-[150px] h-[150px] md:w-[296px] md:h-[271px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-10"
            priority
          />

          {/* Halqa və planetlər */}
          <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-20">
            {/* Halqa */}
            <div
              className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border"
              style={{
                borderColor: "rgba(93, 124, 192, 1)",
                borderWidth: "1px",
                animation: "rotate 20s linear infinite",
              }}
            />

            {/* Planet 1 */}
            <div
              className="absolute w-[40px] h-[40px] md:w-[63px] md:h-[64px] rounded-full planet-orbit-1"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Image
                src={getImagePath("/assets/images/planets/planet-1.png")}
                alt="Planet 1"
                width={63}
                height={64}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Planet 2 */}
            <div
              className="absolute w-[30px] h-[30px] md:w-[50px] md:h-[50px] rounded-full planet-orbit-2"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Image
                src={getImagePath("/assets/images/planets/planet-2.png")}
                alt="Planet 2"
                width={51}
                height={51}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Planet 3 */}
            <div
              className="absolute w-[30px] h-[30px] md:w-[50px] md:h-[50px] rounded-full planet-orbit-3"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Image
                src={getImagePath("/assets/images/planets/planet-3.png")}
                alt="Planet 3"
                width={51}
                height={51}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
        {/* Sağda, ortada sabit BOOK A MEETING butonu */}
        <AnimatePresence>
          {/* Panel və button birlikdə */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: meetingOpen ? 0 : "calc(100%)" }}
            transition={{ type: "tween", duration: 0.45 }}
            className="fixed top-0 right-0 h-full max-w-[700px] w-auto z-[10999] flex"
          >
            {/* Vertical button */}
            <button
              className="absolute -left-[40px] top-[20%] bg-[#4E9C00] text-white text-md font-medium p-3 rounded-l shadow-lg tracking-wide transition flex items-center justify-center"
              style={{
                writingMode: "sideways-lr",
                letterSpacing: "0.05em",
                lineHeight: "1.2",
              }}
              onClick={() => setMeetingOpen(!meetingOpen)}
              aria-label="Book a Meeting"
            >
              BOOK A MEETING
            </button>

            {/* Panel */}
            <div
              className="bg-white rounded-l-2xl shadow-2xl flex flex-col md:flex-row border border-gray-200 w-auto"
              style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
            >
              <BookMeetingDrawer onClose={() => setMeetingOpen(false)} />
            </div>
          </motion.div>
        </AnimatePresence>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-white font-extrabold text-2xl md:text-[42px] leading-[130%] mb-4 text-center px-4 md:px-0"
        >
          Turn Skill Into Adventure
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[#D8D8D8] text-[18px] mx-auto font-medium leading-[140%]"
        >
          Engaging gamified assessments to identify talent {" "}
          <br /> while providing an enjoyable experience.
        </motion.p>

        {/* Mərkəzdə böyük play button */}
        <Link href="/about-us">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative z-30 my-[40px] bg-[#0b4bac] rounded-full flex items-center justify-center w-[60px] h-[60px] p-[13px] cursor-pointer hover:scale-110 transition-transform"
          >
            <Image
              src={getImagePath("/assets/images/play.png")}
              alt="Play"
              width={20}
              height={20}
            />
          </motion.div>
        </Link>

        {/* Alt hissədə iki button */}
        <div className="flex justify-center gap-6">
          <Link href="/contact">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="border border-white text-white text-[16px] w-[186px] h-[45px] font-semibold px-6 py-2 rounded shadow transition hover:bg-white hover:text-[#0099FF]"
            >
              Start Free Trailer
            </motion.button>
          </Link>

          {/* <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-[#0B4CAC] text-white w-[138px] text-[16px] h-[45px] font-semibold px-6 py-2 rounded shadow transition hover:bg-blue-600"
          >
            Play Demo
          </motion.button> */}
        </div>
      </section>
      {/* Referanslar bölməsi */}
      <section
        id="referanslar"
        className="bg-white w-full py-12 text-center mt-[60px]"
      >
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-[24px] font-bold mb-2 text-[#222] tracking-wide"
        >
          REFERANSLAR
        </motion.h2>
        <div className="w-40 h-1 bg-[#0099FF] mx-auto mb-8 rounded" />
        <KeenLogoSlider />
      </section>
      {/* About us bölməsi */}
      <About />
      {/* Mockups bölməsi */}
      <Mockups />
      <div className="relative">
        {/* Yeni bölmə: Lorem Ipsum və Kartlar */}
        <section className="bg-white w-full py-16 text-center">
          <motion.h2
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-2xl md:text-[45px] font-extrabold mb-4 text-[#14181F] leading-[130%]"
          >
            Your Tool to Organize <br />
            All Your Business & Daily Life
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-[#525E6F] text-sm font-[500] max-w-2xl mx-auto mb-12 leading-[140%]"
          >
            Final tool to work with your team, store everything in one place,{" "}
            <br /> and organize projects the way you want.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 max-w-7xl mx-auto justify-center z-10">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
                viewport={{ once: true }}
                className="bg-white shadow-lg p-6 w-full max-w-[300px] h-[348px] flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-[#0099FF]/30 mx-auto"
                style={{ padding: "23px 28px", gap: "10px" }}
              >
                <div className="w-[100px] h-[100px] flex items-center justify-center mb-4">
                  <Image
                    src={
                      [
                        "/assets/images/game.png",
                        "/assets/images/magicpen.png",
                        "/assets/images/medal.png",
                        "/assets/images/cup.png",
                      ][i]
                    }
                    alt="Icon"
                    width={70}
                    height={70}
                    className="shrink-0"
                  />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-[#0099FF]">
                  Lorem Ipsum
                </h3>
                <p className="text-[#000] text-[14px] font-[300]">
                  Lorem ipsum dolor sit amet consectetur enim Lorem ipsum dolor
                  sit amet consectetur enim.
                </p>
              </motion.div>
            ))}
          </div>
        </section>
        {/* Yeni bölmə: On-Cloud, Safer, Faster Kartlar */}
        <section className="relative w-full py-16 text-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 -z-10">
            <Image
              src={getImagePath("/assets/images/features-bg.png")}
              alt="Features Background"
              fill
              className="object-cover w-full h-full"
            />
          </div>
          <motion.h2
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-[24px] font-bold text-[#fff] uppercase"
          >
            FEATURES
          </motion.h2>
          <div className="w-40 h-1 bg-[#0099FF] mx-auto mb-6 rounded" />
          <motion.h3
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-2xl md:text-[45px] font-semibold text-[#fff]"
          >
            Lorem Ipsum Text
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-[#fff] text-[15px] max-w-2xl mx-auto mb-12 text-md font-[400]"
          >
            Lorem ipsum dolor sit amet consectetur enim .Lorem ipsum dolor sit
            amet consectetur enim .Lorem ipsum dolor sit amet consectetur enim .
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 max-w-7xl mx-auto z-100 relative">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
                viewport={{ once: true }}
                className="p-1"
              >
                <Image
                  src={
                    [
                      "/assets/images/cards/On-cloud.png",
                      "/assets/images/cards/Safer.png",
                      "/assets/images/cards/Faster-Red.png",
                      "/assets/images/cards/Faster.png",
                    ][i]
                  }
                  alt="Card Image"
                  width={348}
                  height={348}
                  className="w-full h-auto object-cover rounded-xl"
                />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Blog bölməsi */}
      <section className="w-full py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-[24px] leading-[24px] font-bold text-[#000] mb-[10px]"
        >
          BLOG
        </motion.h2>
        <div className="w-40 h-[4px] bg-[#0099FF] mx-auto mb-4 rounded" />
        <div className="flex flex-wrap justify-center gap-6 px-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-sm font-inter px-6 pb-8 pt-6"
              style={{
                boxShadow:
                  "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              }}
            >
              <Image
                src={
                  [
                    "/assets/images/blog_1.png",
                    "/assets/images/blog_2.png",
                    "/assets/images/blog_3.png",
                  ][i]
                }
                alt={`Blog Image ${i + 1}`}
                width={400}
                height={250}
                className="w-full h-48 object-cover mb-8"
              />
              <div className="text-left">
                <div className="text-[#1465FA] text-sm font-semibold mb-2">
                  {["Design", "Product", "Software Engineering"][i]}
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-bold text-[#222]">
                    Lorem Ipsum
                  </h4>
                  <Image
                    src={getImagePath("/assets/images/arrow-up-right.svg")}
                    alt="Arrow"
                    width={16}
                    height={16}
                  />
                </div>
                <p className="text-[#444] text-md mt-2 font-[400] leading-[24px]">
                  Lorem Ipsum has been the industry&apos;s standard dummy text
                  ever since the 1500s, Lorem Ipsum is simply dummy text of the
                  printing and typesetting industry.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.button
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="bg-[#0099FF] hover:bg-[#0099FF] text-[16px] text-white font-semibold px-[25px] rounded-md transition mt-12 w-[192px] h-[45px]"
          style={{
            border: "1px solid #4E00A1",
            // borderImage: "linear-gradient(to right, #0E45C8, #4E00A1) 1",
            boxShadow: "0 0 16.6px 0 #1183D0",
          }}
        >
          START FREE TRAIL
        </motion.button>
      </section>
      {/* Pricing bölməsi */}
      <section
        className="relative w-full py-16 text-white text-center overflow-hidden"
        style={{
          background:
            "url(/assets/images/pricing_bg.png) no-repeat center center / cover",
          backgroundColor: "#0B4CAC",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-[24px] font-bold mb-2 text-white"
        >
          PRICING
        </motion.h2>
        <div className="w-40 h-1 bg-white mx-auto mb-6 rounded" />
        <motion.h2
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-2xl md:text-[45px] font-extrabold text-[#fff] leading-[130%]"
        >
          Your Tool to Organize
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-[#fff] text-sm font-[500] max-w-2xl mx-auto mb-12 leading-[140%]"
        >
          Final tool to work with your team, store everything in one place,{" "}
          <br /> and organize projects the way you want.
        </motion.p>
        <div className="flex flex-row flex-wrap justify-center items-start md:items-center gap-4 md:gap-16 mb-12">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
              viewport={{ once: true }}
              className="flex items-center gap-4 md:gap-8"
            >
              <Image
                src={getImagePath("/assets/icons/icon-check-green.svg")}
                alt="Check"
                width={20}
                height={20}
                className="text-[#1465FA]"
              />
              <span className="text-sm font-medium">
                {
                  [
                    "Free 15-day trial",
                    "Unlimited Team Members",
                    "Cancel Anytime",
                  ][i]
                }
              </span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-auto p-8 text-[#222] mb-[110px]"
        >
          <div className="flex justify-around items-end mb-8">
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 * (i + 1) }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center px-3 md:px-8"
                >
                  <div className="text-base md:text-md mb-6">Lorem Ipsum</div>
                  <div className="text-2xl md:text-[32px] font-extrabold">
                    XX
                  </div>
                </motion.div>
                {/* Dikey ayraç, yalnız 0 və 1-ci blokdan sonra */}
                {i < 2 && (
                  <div className="h-8 md:h-12 w-0.5 bg-gray-400 mx-2 md:mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="25"
            value={sliderValue}
            onChange={(e) => setSliderValue(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2196f3 0%, #2196f3 ${sliderValue}%, #d1d5db ${sliderValue}%, #d1d5db 100%)`,
              height: "8px",
              borderRadius: "4px",
            }}
          />
          <p className="text-[#667085] text-sm mt-6 mb-4 font-[400] leading-[24px]">
            Lorem Ipsum has been the industry&apos;s standard dummy
          </p>
          <motion.button
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-[#0099FF] hover:bg-[#0099FF] text-white font-semibold px-8 py-3 rounded-md shadow transition"
          >
            START FREE TRAIL
          </motion.button>
        </motion.div>
      </section>
      {/* Contact bölməsi */}
      <ContactForm />

      {/* Get Started bölməsi */}
      <GetStarted />

      {/* FAQ bölməsi */}
      <FAQ
        items={faqData}
        title="FAQ"
        subtitle="Find answers to common questions about our platform"
      />

{/*       {helpOpen && (
        <div className="fixed bottom-5 right-5 md:bottom-8 md:right-18 z-[110] w-[231px] bg-white rounded-[10px] shadow-2xl border border-gray-100 flex flex-col items-center p-[10px] gap-[10px]">
          <button
            onClick={() => setHelpOpen(false)}
            className="absolute top-2 right-2 text-xl text-gray-400 hover:text-red-500"
          >
            ×
          </button>
          <div className="flex flex-col items-center gap-[3px]">
            <Image
              src={getImagePath("/assets/images/need_help.svg")}
              alt="Need Help"
              width={167}
              height={126}
            />
            <div className="font-bold text-lg text-[#222] text-center">
              Need Help
            </div>
            <div className="text-gray-500 text-[12px] text-center">
              Lorem ipsum dolorem non deserunt ullamco est sit aliqua
            </div>
          </div>
          <button className="bg-[#2B64E3] hover:bg-[#1d4ed8] w-[171px] text-white text-[12px] py-2 font-medium rounded-[10px] transition">
            Book A Call
          </button>
          <button
            className="text-[#2B64E3] hover:underline text-sm font-medium p-[10px]"
            onClick={() => setHelpOpen(false)}
          >
            Cancel
          </button>
        </div>
      )} */}
    </main>
  );
}

const faqData = [
  {
    question: "Can I use Spline for free?",
    answer:
      "Yes, totally! The Basic plan is free. You can have unlimited personal files and file viewers. Maximum 1 team project can be created with 2 team files and 2 editors. You also have access to the Spline Library and can publish your scenes with a Spline logo.",
  },
  {
    question: "Why should I upgrade to Super or Super Team?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "What payment methods can I use?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "How does team billing work?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "How can I cancel my subscription?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Can I change from monthly to yearly?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "How can I ask other questions about pricing?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Interested in Spline for Education?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];
