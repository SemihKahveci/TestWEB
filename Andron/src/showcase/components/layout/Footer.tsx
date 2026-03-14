import { content } from "@/showcase/lib/content";
import logoBlack from "@/showcase/assets/logo-black-horizontal.png";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img src={logoBlack.src} alt="ANDRON" className="h-8 md:h-10 w-auto" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xs font-light">
              Yetkinliği karar anında yaşatarak ölçen yeni nesil oyunlaştırılmış değerlendirme platformu.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-display font-600 text-sm mb-1 md:mb-2 text-foreground">Hızlı Bağlantılar</h4>
            {content.nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-display font-600 text-sm mb-1 md:mb-2 text-foreground">Yasal</h4>
            {content.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-4 md:pt-6 border-t border-border text-center">
          <p className="text-xs md:text-sm text-muted-foreground/60 font-light">{content.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
