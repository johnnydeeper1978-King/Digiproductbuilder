import { useEffect } from "react";

/**
 * Lightweight per-page SEO. Sets document title + meta description without a
 * third-party dependency. Swap for a fuller solution (e.g. react-helmet-async)
 * if/when SSR or richer metadata is needed.
 */
export function Seo({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const full = `${title} · 369 Degrees`;
    const prev = document.title;
    document.title = full;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    return () => {
      document.title = prev;
      if (description && meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, [title, description]);

  return null;
}
