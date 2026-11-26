import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/pro", "/work", "/process", "/docs", "/docs/how-we-make-films", "/docs/halal", "/docs/pond-ai", "/docs/credits", "/docs/terms", "/docs/privacy"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date() }));
}
