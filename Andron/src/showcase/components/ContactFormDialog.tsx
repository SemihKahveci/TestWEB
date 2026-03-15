import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/showcase/components/ui/dialog";
import { Button } from "@/showcase/components/ui/button";
import { Input } from "@/showcase/components/ui/input";
import { Textarea } from "@/showcase/components/ui/textarea";
import { Label } from "@/showcase/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/showcase/components/ui/select";
import { ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "aol.com", "icloud.com", "me.com",
  "mac.com", "mail.com", "yandex.com", "protonmail.com", "proton.me",
  "zoho.com", "gmx.com", "gmx.de", "mail.ru", "inbox.com",
];

const GOAL_OPTIONS = [
  "İşe alım süreçlerinde kullanmak istiyorum",
  "Mevcut çalışanlarımın yetkinliklerini ölçmek istiyorum",
  "Çalışanlarımın yıllık gelişimini takip etmek istiyorum",
  "İK süreçlerimi dijitalleştirmek istiyorum",
];

const ASSESSMENT_OPTIONS = [
  "2.001 – 3.000",
  "3.001 – 5.000",
  "5.001 – 10.000",
  "10.001 – 25.000",
  "25.000+",
];

const SOURCE_OPTIONS = [
  "Google Arama",
  "LinkedIn",
  "Tavsiye / Referans",
  "Sosyal Medya",
  "Etkinlik / Konferans",
  "Diğer",
];

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactFormDialog = ({ open, onOpenChange }: ContactFormDialogProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    assessmentCount: "",
    goal: "",
    source: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "email") setEmailError("");
  };

  const validateEmail = (email: string): boolean => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      setEmailError("Lütfen kurumsal e-posta adresinizi kullanın.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(form.email)) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/offer-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gönderim başarısız oldu.");
      }

      setSubmitted(true);
      toast.success("Talebiniz başarıyla iletildi!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSubmitted(false);
      setEmailError("");
      setForm({ name: "", email: "", company: "", position: "", assessmentCount: "", goal: "", source: "", message: "" });
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: "#22c55e" }} />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2" style={{ color: "#222222" }}>
              Teşekkürler!
            </h3>
            <p className="text-muted-foreground font-light mb-6">
              Ekibimiz en kısa sürede sizinle iletişime geçecek.
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="rounded-full px-8"
              style={{ backgroundColor: "#222222", color: "#ffffff" }}
            >
              Kapat
            </Button>
          </div>
        ) : (
          <>
            <div className="px-8 pt-8 pb-2">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold" style={{ color: "#222222" }}>
                  Kurumsal Teklif Al
                </DialogTitle>
                <DialogDescription className="text-muted-foreground font-light mt-1">
                  Bilgilerinizi bırakın, ekibimiz size özel bir teklif hazırlasın.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
              {/* Ad Soyad & Kurumsal E-posta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Ad Soyad *</Label>
                  <Input
                    id="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Kurumsal E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="ad@sirketiniz.com"
                    className={`rounded-lg ${emailError ? "border-destructive" : ""}`}
                  />
                  {emailError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{emailError}</p>
                  )}
                </div>
              </div>

              {/* Şirket & Pozisyon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium">Şirket Adı *</Label>
                  <Input
                    id="company"
                    required
                    maxLength={150}
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="Şirketinizin adı"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">Pozisyon *</Label>
                  <Input
                    id="position"
                    required
                    maxLength={100}
                    value={form.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    placeholder="Ör: İK Müdürü"
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Assessment Adedi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kaç Assessment&apos;a İhtiyacınız Var? *</Label>
                <Select
                  required
                  value={form.assessmentCount}
                  onValueChange={(val) => handleChange("assessmentCount", val)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="— Lütfen bir seçenek belirleyin —" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amacınız */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amacınız Nedir? *</Label>
                <Select
                  required
                  value={form.goal}
                  onValueChange={(val) => handleChange("goal", val)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="— Lütfen bir seçenek belirleyin —" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bizi nereden buldunuz */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bizi Nereden Buldunuz?</Label>
                <Select
                  value={form.source}
                  onValueChange={(val) => handleChange("source", val)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="— Lütfen bir seçenek belirleyin —" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mesaj */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">Eklemek İstedikleriniz</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  maxLength={1000}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="İhtiyaçlarınızı kısaca açıklayın..."
                  rows={3}
                  className="rounded-lg resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-full mt-2"
                style={{ backgroundColor: "#222222", color: "#ffffff" }}
              >
                {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
