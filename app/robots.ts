import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/terms"],
        disallow: [
          "/api/",
          "/billing",
          "/cases",
          "/dashboard",
          "/onboarding",
          "/settings",
        ],
      },
    ],
  };
}
