export function optimizeImage(url: string, width = 800): string {
  if (!url?.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_webp,q_auto,w_${width}/`);
}
