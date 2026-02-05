/**
 * Production'da basePath ekleyen utility fonksiyonu
 * Next.js Image component'i için asset path'lerini düzeltir
 */
export function getImagePath(path: string): string {
   // Production'da basePath ekle
   if (process.env.NODE_ENV === 'production') {
    // Eğer path zaten /home ile başlıyorsa, değiştirme
    if (path.startsWith('/home')) {
      return path;
    }
    // Path / ile başlıyorsa /home ekle
    if (path.startsWith('/')) {
      return `/home${path}`;
    }
    // Path / ile başlamıyorsa /home/ ekle
    return `/home/${path}`;
  }
  // Development'da olduğu gibi döndür
  return path;
}

