import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.valorantpicker.com/",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.valorantpicker.com/squad",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.valorantpicker.com/about",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
