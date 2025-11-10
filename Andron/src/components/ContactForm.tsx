"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

const ContactForm = ({ isContactPage = false }) => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showKVKKModal, setShowKVKKModal] = useState(false);

  return (
    <section className="bg-gray-50 w-full py-16 text-center">
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(33, 37, 41, 0.55)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl max-w-5xl w-full max-h-[80vh] shadow-2xl flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="p-6 pb-4">
              <h2 className="text-[32px] leading-[96px] font-bold text-center text-black">
                GİZLİLİK POLİTİKASI
              </h2>
              <div className="w-50 h-1 bg-blue-500 mx-auto"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 pb-4 relative">
              <div className="text-left space-y-6">
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    What is Lorem Ipsum?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry&apos;s
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    It was popularised in the 1960s with the release of Letraset
                    sheets containing Lorem Ipsum passages, and more recently
                    with desktop publishing software like Aldus PageMaker
                    including versions of Lorem Ipsum.
                  </p>
                </div>
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    Where does it come from?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Contrary to popular belief, Lorem Ipsum is not simply random
                    text. It has roots in a piece of classical Latin literature
                    from 45 BC, making it over 2000 years old. Richard
                    McClintock, a Latin professor at Hampden-Sydney College in
                    Virginia, looked up one of the more obscure Latin words,
                    consectetur, from a Lorem Ipsum passage, and going through
                    the cites of the word in classical literature, discovered
                    the undoubtable source.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of &quot;de
                    Finibus Bonorum et Malorum (The Extremes of Good and Evil)
                    by Cicero, written in 45 BC. This book is a treatise on the
                    theory of ethics, very popular during the Renaissance. The
                    first line of Lorem Ipsum, &quot;Lorem ipsum dolor sit amet..&quot;,
                    comes from a line in section 1.10.32.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    The standard chunk of Lorem Ipsum used since the 1500s is
                    reproduced below for those interested. Sections 1.10.32 and
                    1.10.33 from &quot;de Finibus Bonorum et Malorum&quot; by Cicero are
                    also reproduced in their exact original form, accompanied by
                    English versions from the 1914 translation by H. Rackham.
                  </p>
                </div>
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    How to use Lorem Ipsum?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which don&apos;t
                    look even slightly believable. If you are going to use a
                    passage of Lorem Ipsum, you need to be sure there isn&apos;t
                    anything embarrassing hidden in the middle of text.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    All the Lorem Ipsum generators on the Internet tend to
                    repeat predefined chunks as necessary, making this the first
                    true generator on the Internet. It uses a dictionary of over
                    200 Latin words, combined with a handful of model sentence
                    structures, to generate Lorem Ipsum which looks reasonable.
                    The generated Lorem Ipsum is therefore always free from
                    repetition, injected humour, or non-characteristic words
                    etc.
                  </p>
                </div>
              </div>

              {/* Aşağı hissədən kölgə, yalnız kontent scroll oluna biləndə görünsün */}
              <div
                className="pointer-events-none"
                style={{
                  position: "sticky",
                  left: 0,
                  right: 0,
                  bottom: -20,
                  height: "50px",
                  zIndex: 10,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.10) 60%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 pt-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-[196px] h-[45px] border border-[#0099FF] text-[#0099FF] bg-white rounded-md hover:bg-blue-50 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  GERİ
                </button>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-[196px] h-[45px] bg-[#0099FF] text-white rounded-md hover:bg-blue-600 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  OKUDUM, ANLADIM
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* KVKK Modal */}
      {showKVKKModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(33, 37, 41, 0.55)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl max-w-5xl w-full max-h-[80vh] shadow-2xl flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="p-6 pb-4">
              <h2 className="text-[32px] leading-[96px] font-bold text-center text-black">
                KİŞİSEL VERİLERİN KORUMA KANUNU
              </h2>
              <div className="w-50 h-1 bg-blue-500 mx-auto"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 pb-4 relative">
              <div className="text-left space-y-6 relative z-0">
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    What is Lorem Ipsum?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry&apos;s
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    It was popularised in the 1960s with the release of Letraset
                    sheets containing Lorem Ipsum passages, and more recently
                    with desktop publishing software like Aldus PageMaker
                    including versions of Lorem Ipsum.
                  </p>
                </div>
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    Where does it come from?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Contrary to popular belief, Lorem Ipsum is not simply random
                    text. It has roots in a piece of classical Latin literature
                    from 45 BC, making it over 2000 years old. Richard
                    McClintock, a Latin professor at Hampden-Sydney College in
                    Virginia, looked up one of the more obscure Latin words,
                    consectetur, from a Lorem Ipsum passage, and going through
                    the cites of the word in classical literature, discovered
                    the undoubtable source.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of &quot;de
                    Finibus Bonorum et Malorum (The Extremes of Good and Evil)
                    by Cicero, written in 45 BC. This book is a treatise on the
                    theory of ethics, very popular during the Renaissance. The
                    first line of Lorem Ipsum, &quot;Lorem ipsum dolor sit amet..&quot;,
                    comes from a line in section 1.10.32.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    The standard chunk of Lorem Ipsum used since the 1500s is
                    reproduced below for those interested. Sections 1.10.32 and
                    1.10.33 from &quot;de Finibus Bonorum et Malorum&quot; by Cicero are
                    also reproduced in their exact original form, accompanied by
                    English versions from the 1914 translation by H. Rackham.
                  </p>
                </div>
                <div>
                  <h2
                    className="text-[18px] font-bold mb-4"
                    style={{ color: "#000000" }}
                  >
                    How to use Lorem Ipsum?
                  </h2>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which don&apos;t
                    look even slightly believable. If you are going to use a
                    passage of Lorem Ipsum, you need to be sure there isn&apos;t
                    anything embarrassing hidden in the middle of text.
                  </p>
                  <p
                    className="text-[18px] leading-relaxed"
                    style={{ color: "#525E6F" }}
                  >
                    All the Lorem Ipsum generators on the Internet tend to
                    repeat predefined chunks as necessary, making this the first
                    true generator on the Internet. It uses a dictionary of over
                    200 Latin words, combined with a handful of model sentence
                    structures, to generate Lorem Ipsum which looks reasonable.
                    The generated Lorem Ipsum is therefore always free from
                    repetition, injected humour, or non-characteristic words
                    etc.
                  </p>
                </div>
              </div>
              {/* Aşağı hissədən kölgə, yalnız kontent scroll oluna biləndə görünsün */}
              <div
                className="pointer-events-none"
                style={{
                  position: "sticky",
                  left: 0,
                  right: 0,
                  bottom: -20,
                  height: "50px",
                  zIndex: 10,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.10) 60%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 pt-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowKVKKModal(false)}
                  className="w-[196px] h-[45px] border border-[#0099FF] text-[#0099FF] bg-white rounded-md hover:bg-blue-50 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  GERİ
                </button>
                <button
                  onClick={() => setShowKVKKModal(false)}
                  className="w-[196px] h-[45px] bg-[#0099FF] text-white rounded-md hover:bg-blue-600 transition-colors font-bold text-base"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  OKUDUM, ANLADIM
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
        className="text-[32px] font-bold mb-2 text-[#222]"
      >
        CONTACT
      </motion.h2>
      <div className="w-40 h-[4px] bg-[#0099FF] mx-auto mb-6 rounded" />
      <motion.h3
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-[64px] font-extrabold text-[#222]"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgb(0, 153, 255), rgb(0, 153, 255, 0.5))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Get in touch
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-[#000]  mx-auto mb-12 px-4 font-[500] font-inter text-[14px]"
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </motion.p>
      <div
        className="flex flex-col md:flex-row rounded-[20px] border-[2px] border-solid border-black/[0.05] p-12 pb-20 justify-center gap-12 items-stretch m-auto max-w-6xl"
        style={{
          backdropFilter: "blur(380px)",
          background: "#E8F6FF",
        }}
      >
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="w-full max-w-md text-left flex flex-col justify-between shrink-0 grow-1"
          id="contact-form"
        >
          <div className="mb-4">
            <label
              htmlFor="topic"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Hangi Konuda Yardımcı Olabiliriz?
            </label>
            <div className="relative">
              <select
                id="topic"
                className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              >
                <option>Lorem ipsum</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="reason"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Bize Neden Ulaşmak İstiyorsunuz?
            </label>
            <input
              type="text"
              id="reason"
              placeholder="Lorem ipsum"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="company"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Çalışmakta Olduğunuz Firma İsmi
            </label>
            <input
              type="text"
              id="company"
              placeholder="Lorem ipsum"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="where"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Bizi Nerden Duydunuz?
            </label>
            <input
              type="text"
              id="where"
              placeholder="Lorem ipsum"
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Kurumsal Mail Adresiniz
            </label>
            <input
              type="email"
              id="email"
              placeholder="Lütfen kurumsal mail adresi giriniz."
              className="w-full bg-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label
            htmlFor="email"
            className="block text-[#525659] text-sm font-semibold mb-2"
          >
            İletişim Numaranız
          </label>
          <div className="mb-4 flex gap-2">
            <div className="w-1/4">
              <div className="flex items-center h-full gap-1 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <Image
                  src="/assets/images/Turkey_flag.png"
                  alt="Turkey Flag"
                  width={20}
                  height={15}
                />
                <span className="text-[#525659] text-[12px] ml-2">+90</span>
              </div>
            </div>
            <div className="w-3/4">
              <input
                type="text"
                id="phone"
                placeholder="Lütfen iletişim bilgisi giriniz"
                className="w-full outline-none bg-transparent pl-2"
              />
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="message"
              className="block text-[#525659] text-sm font-semibold mb-2"
            >
              Mesajınız
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Lütfen mesajınızı giriniz"
              className="w-full bg-white rounded-md p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="privacy"
                className="text-sm font-medium"
                style={{ color: "rgba(0, 0, 0, 0.65)" }}
              >
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  style={{ color: "#5563FF", textDecoration: "underline" }}
                  className="hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer"
                >
                  Gizlilik
                </button>{" "}
                ve{" "}
                <button
                  type="button"
                  onClick={() => setShowKVKKModal(true)}
                  style={{ color: "#5563FF", textDecoration: "underline" }}
                  className="hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer"
                >
                  KVKK şart
                </button>{" "}
                koşullarını kabul ediyorum.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="newsletter"
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="newsletter"
                className="text-sm font-medium"
                style={{ color: "rgba(0, 0, 0, 0.65)" }}
              >
                Aylık Bültenimizden haberdar olmak istermisiniz?
              </label>
            </div>
          </div>

          <button
            className="text-white font-semibold px-8 py-3 rounded-md shadow transition w-full"
            style={{
              background: "linear-gradient(to right, #1465FA, #0099FF)",
            }}
          >
            Gönder
          </button>
        </motion.div>
        {/* Astronaut Image */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className={`relative w-full max-w-xl h-auto shrink-0 overflow-hidden rounded-xl flex items-center justify-center p-6 hidden md:flex md:mb-[40px] ${
            isContactPage ? "" : ""
          }`}
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }} // zoom in & out
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src="/assets/images/contact_bg copy.png"
              alt="Astronaut"
              fill
              className="rounded-xl object-fill"
            />
          </motion.div>

          <div
            className={`absolute inset-0 ml-10 flex items-end justify-start p-6 pb-8 text-white text-left text-center`}
          >
            <p
              className="text-sm font-inter font-[400] text-[16px]"
              style={{ fontStyle: "normal" }}
            >
              &quot;Lorem Ipsum is simply dummy text of the printing and
              typesetting industry. Lorem Ipsum has been the industry&apos;s
              standard dummy text ever since the 1500s,&quot;
              <br />
              <span className={`font-bold text-center font-inter`}>
                Lorem ipsum
              </span>
            </p>
          </div>
        </motion.div>
      </div>
      {/* Social Media Icons */}
      <div className="flex justify-center gap-6 mt-12">
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src="/assets/icons/facebook.svg"
            alt="Facebook"
            width={12}
            height={12}
          />
        </Link>
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src="/assets/icons/instagram.svg"
            alt="Instagram"
            width={24}
            height={24}
          />
        </Link>
        <Link
          href="#"
          className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <Image
            src="/assets/icons/twitter.svg"
            alt="Twitter"
            width={24}
            height={24}
          />
        </Link>
      </div>
    </section>
  );
};

export default ContactForm;
