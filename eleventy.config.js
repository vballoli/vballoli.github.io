module.exports = function (eleventyConfig) {
  // --- Static assets (kept at project root, copied verbatim) ---
  eleventyConfig.addPassthroughCopy({
    tn: "tn",
    fonts: "fonts",
    files: "files",
    uploads: "uploads",
    lottie: "lottie",
    "news.md": "news.md",
    ".nojekyll": ".nojekyll"
  });

  // --- Source-tree assets ---
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/main.js");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Build timestamp for structured data, sitemap, and lastmod values.
  // ProfilePage.dateModified needs a full datetime, while sitemap.lastmod stays date-only.
  const buildDateTime = new Date().toISOString();
  eleventyConfig.addGlobalData("buildDate", () =>
    buildDateTime.split("T")[0]
  );
  eleventyConfig.addGlobalData("buildDateTime", () => buildDateTime);

  // Papers collection: gather every markdown file tagged "papers"
  // (see src/papers/papers.json) and order by the `order` front-matter key.
  eleventyConfig.addCollection("papers", (collectionApi) =>
    collectionApi
      .getFilteredByTag("papers")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"]
  };
};
