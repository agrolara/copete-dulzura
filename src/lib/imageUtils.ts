/**
 * Utilidad universal para formatear URLs de imágenes, incluyendo enlaces de Google Drive,
 * Google Search Images, Dropbox y URLs directas para Copete & Dulzura.
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // 1. Detección y extracción de links de Google Image Search
  if (trimmed.includes('google.com/imgres') || trimmed.includes('google.cl/imgres')) {
    try {
      const urlObj = new URL(trimmed);
      const realImg = urlObj.searchParams.get('imgurl');
      if (realImg) {
        trimmed = decodeURIComponent(realImg);
      }
    } catch {
      // Continuar con trimmed
    }
  }

  // 2. Detección de redirecciones de Google
  if (trimmed.includes('google.com/url') || trimmed.includes('google.cl/url')) {
    try {
      const urlObj = new URL(trimmed);
      const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
      if (realUrl && (realUrl.startsWith('http://') || realUrl.startsWith('https://'))) {
        trimmed = decodeURIComponent(realUrl);
      }
    } catch {
      // Continuar
    }
  }

  // 3. Detección y conversión de enlaces de Google Drive
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  // 4. Detección y conversión de enlaces de Dropbox (dl=0 -> raw=1)
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return trimmed;
}

export function getImageFallbacks(url: string | undefined | null): string[] {
  if (!url || typeof url !== 'string') return [];
  const trimmed = url.trim();
  const fallbacks: string[] = [];

  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const id = fileIdMatch[1];
      fallbacks.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
      fallbacks.push(`https://lh3.googleusercontent.com/d/${id}`);
      fallbacks.push(`https://drive.google.com/uc?export=view&id=${id}`);
    }
  }

  return fallbacks;
}
