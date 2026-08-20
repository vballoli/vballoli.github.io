const fs = require("fs");
const path = require("path");
const topicMeta = require("./src/_data/topicMeta.json");

module.exports = function (eleventyConfig) {
  // --- Static assets (kept at project root, copied verbatim) ---
  eleventyConfig.addPassthroughCopy({
    tn: "tn",
    fonts: "fonts",
    files: "files",
    uploads: "uploads",
    lottie: "lottie",
    "news.md": "news.md",
    ".nojekyll": ".nojekyll",
    "favicon.svg": "favicon.svg",
    "favicon-32.png": "favicon-32.png",
    "favicon-16.png": "favicon-16.png",
    "apple-touch-icon.png": "apple-touch-icon.png"
  });

  // --- Source-tree assets ---
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/main.js");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy({ "src/agents/tools.js": "agents/tools.js" });

  // Build timestamp for structured data and homepage lastmod.
  const buildDateTime = new Date().toISOString();
  eleventyConfig.addGlobalData("buildDate", () => buildDateTime.split("T")[0]);
  eleventyConfig.addGlobalData("buildDateTime", () => buildDateTime);

  // --- Filters ---

  // Intrinsic PNG dimensions, read from the IHDR chunk at build time, so every
  // thumbnail can declare width/height and stop shifting layout as it loads.
  const imageSizeCache = new Map();
  eleventyConfig.addFilter("imageSize", (src) => {
    if (!src || !src.endsWith(".png")) return null;
    if (imageSizeCache.has(src)) return imageSizeCache.get(src);
    let size = null;
    try {
      const fd = fs.openSync(path.join(__dirname, src.replace(/^\//, "")), "r");
      const head = Buffer.alloc(24);
      fs.readSync(fd, head, 0, 24, 0);
      fs.closeSync(fd);
      if (head.toString("ascii", 1, 4) === "PNG") {
        size = { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
      }
    } catch {
      size = null;
    }
    imageSizeCache.set(src, size);
    return size;
  });


  // Per-page dates for the sitemap, rather than one uniform build timestamp.
  eleventyConfig.addFilter("isoDate", (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? buildDateTime.split("T")[0]
      : date.toISOString().split("T")[0];
  });

  // Lineage lookups. Nunjucks `{% set %}` inside a loop does not escape the
  // loop's scope, so these run as filters instead.
  eleventyConfig.addFilter("findPaper", (papers, slug) =>
    slug ? (papers || []).find((p) => p.fileSlug === slug) || null : null
  );
  eleventyConfig.addFilter("childrenOf", (papers, slug) =>
    (papers || []).filter((p) => p.data.parent === slug)
  );

  // A thread as wide as its widest level, so a forked thread gets the room its
  // two branches need instead of being squeezed into an equal third.
  eleventyConfig.addFilter("threadSpans", (threads) => {
    const spans = (threads || []).map((thread) =>
      Math.max(1, ...(thread.levels || []).map((level) => level.length))
    );
    return { spans, total: spans.reduce((a, b) => a + b, 0) };
  });

  // --- Collections ---

  // Papers ordered by the `order` front-matter key (highest = most recent).
  eleventyConfig.addCollection("papers", (collectionApi) =>
    collectionApi
      .getFilteredByTag("papers")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  // One entry per topic tag, for the /topics/<slug>/ hub pages.
  eleventyConfig.addCollection("topics", (collectionApi) => {
    const byTopic = new Map();

    collectionApi
      .getFilteredByTag("papers")
      .sort((a, b) => (b.data.order || 0) - (a.data.order || 0))
      .forEach((paper) => {
        (paper.data.topics || []).forEach((slug) => {
          if (!byTopic.has(slug)) byTopic.set(slug, []);
          byTopic.get(slug).push(paper);
        });
      });

    return [...byTopic.entries()]
      .map(([slug, papers]) => ({
        slug,
        papers,
        label: (topicMeta[slug] && topicMeta[slug].label) || slug,
        blurb: (topicMeta[slug] && topicMeta[slug].blurb) || ""
      }))
      .sort((a, b) => b.papers.length - a.papers.length || a.slug.localeCompare(b.slug));
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "11ty.js"]
  };
};
