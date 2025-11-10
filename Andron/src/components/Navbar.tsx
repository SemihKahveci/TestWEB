"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const menuItems = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about-us" },
  { name: "Blog", href: "/blog" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
];

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAboutUs = pathname === "/about-us";
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [adminPanelUrl, setAdminPanelUrl] = useState<string>('/login');

  // Admin paneli URL'ini client-side'da belirle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Localhost ise development URL'i kullan
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setAdminPanelUrl('http://localhost:5173');
      }
      // Production'da /login (admin paneli login sayfası)
    }
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (language: (typeof languages)[0]) => {
    setSelectedLanguage(language);
    setLanguageDropdownOpen(false);
    // Burada dil dəyişikliyi məntiqini əlavə edə bilərsiniz
  };

  return (
    <nav
      className={`w-full flex items-center py-4 px-8 absolute top-0 left-0 z-50 transition-all duration-300 font-sans
        ${isHome || isAboutUs ? "bg-transparent" : "bg-white shadow-md"}
        ${isMobile ? "justify-between" : "justify-center"}
      `}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 z-50">
        <Image
          src="/assets/icons/logo_colored.svg"
          alt="Logo"
          width={48}
          height={48}
          priority
        />
      </Link>
      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center justify-end ml-[35px]">
        <ul className="flex gap-7 items-center">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`text-base px-1 transition-all ${
                  pathname === item.href
                    ? "text-[#2196f3]"
                    : isHome || isAboutUs
                    ? "text-white hover:text-[#2196f3]"
                    : "text-[#222] hover:text-[#2196f3]"
                }`}
                style={{ fontFamily: "var(--font-poppins)" }}
                onClick={
                  item.name === "Assessment" || item.name === "Science"
                    ? (e) => e.preventDefault()
                    : undefined
                }
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* Desktop Actions */}
      <div
        className="hidden lg:flex items-center gap-6"
        style={{ marginLeft: "48px" }}
      >
        <span
          className={`h-8 w-px ${isHome ? "bg-white/40" : "bg-gray-300"}`}
          style={{ marginRight: "48px" }}
        />
        <a
          href={adminPanelUrl}
          target={adminPanelUrl.startsWith('http') ? '_blank' : undefined}
          rel={adminPanelUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`border ${
            isHome || isAboutUs
              ? "border-white/60 text-white bg-transparent hover:bg-white/10"
              : "border-[#2196f3] text-[#2196f3] bg-transparent hover:bg-blue-50"
          } px-[25px] py-[8px] rounded-md transition text-base font-semibold tracking-wide`}
          style={{
            boxShadow: isHome ? "none" : "0 1px 2px rgba(0,0,0,0.01)",
            fontFamily: "var(--font-poppins)",
          }}
        >
          ADMIN PANELİ
        </a>
        <button
          className={`border ${
            isHome || isAboutUs
              ? "border-white text-white bg-transparent hover:bg-white/10"
              : "border-gray-400 text-[#444] bg-white hover:bg-gray-100"
          } px-[25px] py-[8px] rounded-md transition text-base font-semibold tracking-wide`}
          style={{
            boxShadow: isHome ? "none" : "0 1px 2px rgba(0,0,0,0.01)",
            fontFamily: "var(--font-poppins)",
          }}
        >
          LOG IN
        </button>
        <button
          className={`px-6 py-2 rounded-md transition text-base font-semibold tracking-wide ${
            isHome || isAboutUs
              ? "bg-[#2196f3] text-white hover:bg-[#1976d2]"
              : "bg-[#2196f3] text-white hover:bg-[#1976d2]"
          }`}
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          REQUEST DEMO
        </button>

        {/* Language Dropdown - Desktop */}
        <div className="relative ml-2" ref={languageDropdownRef}>
          <button
            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
            className="flex items-center gap-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image
              src="/assets/icons/earth.svg"
              alt="Language"
              width={28}
              height={28}
              className="cursor-pointer"
            />
            <span
              className={`text-sm font-medium ${
                isHome || isAboutUs ? "text-white" : "text-gray-700"
              }`}
            >
              {selectedLanguage.code.toUpperCase()}
            </span>
          </button>

          {languageDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    selectedLanguage.code === language.code
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Burger Icon */}
      <button
        className="lg:hidden flex flex-col justify-center items-center w-10 h-10 z-50 relative"
        aria-label="Open menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span
          className={`block w-7 h-0.5 rounded bg-black transition-all duration-300 ${
            menuOpen ? "rotate-45 translate-y-2" : ""
          } ${isHome || isAboutUs ? "bg-white" : "bg-[#222]"}`}
        ></span>
        <span
          className={`block w-7 h-0.5 rounded bg-black my-1 transition-all duration-300 ${
            menuOpen ? "opacity-0" : ""
          } ${isHome || isAboutUs ? "bg-white" : "bg-[#222]"}`}
        ></span>
        <span
          className={`block w-7 h-0.5 rounded bg-black transition-all duration-300 ${
            menuOpen ? "-rotate-45 -translate-y-2" : ""
          } ${isHome || isAboutUs ? "bg-white" : "bg-[#222]"}`}
        ></span>
      </button>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-all duration-300 ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } lg:hidden`}
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Image
            src="/assets/icons/logo.svg"
            alt="Logo"
            width={40}
            height={40}
          />
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="text-3xl text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        </div>
        <ul className="flex flex-col gap-2 px-6 py-4">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`block py-2 text-lg font-medium ${
                  pathname === item.href
                    ? "text-[#2196f3] font-bold"
                    : "text-[#222] hover:text-[#2196f3]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 px-6 pb-6 mt-auto">
          <a
            href={adminPanelUrl}
            target={adminPanelUrl.startsWith('http') ? '_blank' : undefined}
            rel={adminPanelUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="border border-[#2196f3] text-[#2196f3] bg-transparent hover:bg-blue-50 px-[25px] py-[10px] rounded-md transition text-base font-semibold tracking-wide text-center"
            onClick={() => setMenuOpen(false)}
          >
            ADMIN PANELİ
          </a>
          <button className="border border-gray-400 text-[#444] bg-white hover:bg-gray-100 px-[25px] py-[10px] rounded-md transition text-base font-semibold tracking-wide">
            LOG IN
          </button>
          <button className="bg-[#2196f3] text-white px-6 py-2 rounded-md hover:bg-[#1976d2] transition text-base font-semibold tracking-wide">
            REQUEST DEMO
          </button>

          {/* Language Dropdown - Mobile */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Dil / Language
              </span>
              <Image
                src="/assets/icons/earth.svg"
                alt="Language"
                width={24}
                height={24}
              />
            </div>
            <div className="space-y-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    selectedLanguage.code === language.code
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
