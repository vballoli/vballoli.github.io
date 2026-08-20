// Directory data for every paper in src/papers/.
//
// Each paper gets its own URL so it can be linked to directly and carry its
// full record: abstract, citation, lineage. The homepage still lists them all;
// these pages are additive.

const meta = require("../_lib/paper-meta.js");

module.exports = {
  tags: "papers",
  layout: "paper.njk",
  permalink: "/papers/{{ page.fileSlug }}/",

  eleventyComputed: {
    // A distinct title and description per paper.
    pageTitle: (data) => {
      const venue = meta.venueLabel(data);
      return `${data.title}${venue ? ` (${venue})` : ""}`;
    },
    metaDescription: (data) =>
      meta.plainSummary(data.page && data.page.rawInput, 155),

    // Link previews use the paper's own figure instead of the site avatar.
    ogImage: (data) => data.thumb || null,
    ogType: () => "article",
    twitterCard: (data) => (data.thumb ? "summary_large_image" : "summary"),

    // Injected into <head> by base.njk. Includes the markdown alternate so the
    // plain-text twin of this page is discoverable from the page itself.
    headExtra: (data) =>
      [
        meta.citationMeta(data),
        `<link rel="alternate" type="text/markdown" href="/papers/${data.page.fileSlug}.md" title="Markdown version">`
      ].join("\n  "),

    // Convenience values the paper layout and JSON-LD both read.
    paperMeta: (data) => ({
      arxivId: meta.arxivId(data),
      doi: meta.doi(data),
      pdfUrl: meta.pdfUrl(data),
      sameAs: meta.sameAs(data),
      venueLabel: meta.venueLabel(data),
      venueFullName: meta.venueFullName(data),
      authorNames: meta.authorNames(data),
      videoUrl: meta.linkByLabel(data, "Talk"),
      summary: meta.plainSummary(data.page && data.page.rawInput, 500)
    })
  }
};
