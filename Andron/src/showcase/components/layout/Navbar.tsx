 "use client";

import { useState, useEffect } from "react";
import { Menu, X, LogIn, Calendar } from "lucide-react";
import { Button } from "@/showcase/components/ui/button";
import { cn } from "@/showcase/lib/utils";
import logoBlack from "@/showcase/assets/logo-black-horizontal.png";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const navLinks = [
  { label: "Hakkımızda", hash: "#hakkimizda", route: "/hakkimizda" },
  { label: "ANDRON", hash: "#andron-nedir", route: "/andron" },
  { label: "Nasıl Çalışır?", hash: "#nasil-calisir", route: "/nasil-calisir" },
  { label: "Yetkinlikler", hash: "#yetkinlikler", route: "/yetkinlikler" },
  { label: "Raporlama", hash: "#raporlama", route: "/raporlama" },
  { label: "Fiyatlandırma", hash: "#fiyatlandirma", route: "/fiyatlandirma" },
  { label: "Güvenlik", hash: "#guvenlik", route: "/guvenlik" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileOpen(false);
    if (isHome) {
      const el = document.querySelector(link.hash);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(link.route);
    }
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-card/90 backdrop-blur-xl shadow-sm border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-14 md:h-20">
        <button onClick={handleLogoClick} className="flex items-center">
          <Image
            src={logoBlack}
            alt="ANDRON"
            className={cn("h-16 md:h-20 w-auto transition-all", !scrolled && "invert brightness-200")}
          />
        </button>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => handleNavClick(link)}
              className={cn(
                "text-sm font-normal transition-colors",
                scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/60 hover:text-white",
                !isHome && pathname === link.route && "text-coral"
              )}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="https://androngame.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300",
              "bg-sky text-white hover:bg-sky/85 shadow-md hover:shadow-lg hover:shadow-sky/25"
            )}
          >
            <LogIn className="w-4 h-4" />
            Panel Girişi
          </a>
          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="bg-coral text-white hover:bg-coral/90 rounded-full">
              <Calendar className="w-4 h-4 mr-1" />
              Görüşme Planla
            </Button>
          </a>
        </div>

        <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen
            ? <X className={cn("h-5 w-5", scrolled ? "text-foreground" : "text-white")} />
            : <Menu className={cn("h-5 w-5", scrolled ? "text-foreground" : "text-white")} />
          }
        </button>
      </div>

      {/* Mobile menu — full screen overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-card/98 backdrop-blur-xl z-40">
          <nav className="container py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.route}
                onClick={() => handleNavClick(link)}
                className="text-base text-foreground hover:text-coral py-3 text-left border-b border-border/50 font-light transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-6">
              <a
                href="https://androngame.com/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-sky text-white hover:bg-sky/85 shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                Panel Girişi
              </a>
              <a
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-coral text-white hover:bg-coral/90 shadow-md transition-all"
              >
                <Calendar className="w-4 h-4" />
                Görüşme Planla
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

