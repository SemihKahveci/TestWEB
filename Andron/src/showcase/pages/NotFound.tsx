 "use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Aradığınız sayfa bulunamadı.</p>
        <Link href="/" className="text-coral hover:text-coral/80 font-medium transition-colors">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
