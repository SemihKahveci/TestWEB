 "use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/showcase/components/ui/button";
import { Input } from "@/showcase/components/ui/input";
import { Label } from "@/showcase/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import logoWhite from "@/showcase/assets/logo-white-horizontal.png";

const PanelLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "https://panel.andron.com";
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => router.push("/")} className="inline-block mb-6">
            <img src={logoWhite.src} alt="ANDRON" className="h-12 w-auto mx-auto" />
          </button>
          <p className="text-xs text-white/40 tracking-widest uppercase">Panel Girişi</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Hoş Geldiniz</h1>
          <p className="text-sm text-muted-foreground mb-6">ANDRON paneline erişmek için giriş yapın.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-coral text-white hover:bg-coral/90 h-11">
              Giriş Yap
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Hesabınız yok mu?{" "}
            <Link href="/" className="text-coral hover:underline">Demo Talep Et</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanelLogin;
