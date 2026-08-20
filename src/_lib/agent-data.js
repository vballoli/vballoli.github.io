// One canonical record per paper, shared by every machine-readable surface
// (/agents/papers.json, /llms-full.txt, and the .md alternates) so they can
// never disagree with each other or with the HTML pages.

const meta = require("./paper-meta.js");

function stripFrontMatter(raw) {
  return String(raw || "").replace(/^---[\s\S]*?^---\s*/m, "").trim();
}

// Eleventy exposes the untemplated source in slightly different places
// depending on how the item is reached.
function rawBody(paper) {
  return stripFrontMatter(
    paper.rawInput || (paper.data.page && paper.data.page.rawInput) || ""
  );
}

function paperRecord(paper, site) {
  const d = paper.data;
  const pm = d.paperMeta || {};
  const venue = (d.venues && d.venues[0]) || {};

  return {
    id: paper.fileSlug,
    title: d.title,
    url: site.url + paper.url,
    year: venue.year || null,
    venue: {
      acronym: venue.acronym || null,
      name: pm.venueFullName || null,
      track: venue.kind || null
    },
    authors: (d.authors || []).map((a) => ({
      name: String(a.name || "").replace(/\*+$/, "").trim(),
      isSiteOwner: Boolean(a.me),
      coFirstAuthor: /\*$/.test(String(a.name || ""))
    })),
    doi: pm.doi || null,
    arxivId: pm.arxivId || null,
    pdf: pm.pdfUrl || null,
    abstract: rawBody(paper),
    topics: d.topics || [],
    distinctions: (d.badges || []).map((b) => b.label),
    buildsOn: d.parent ? site.url + "/papers/" + d.parent + "/" : null,
    links: (d.links || []).map((l) => ({ label: l.label, url: l.href })),
    markdown: site.url + "/papers/" + paper.fileSlug + ".md",
    bibtex: (d.bibtex || "").trim() || null
  };
}

module.exports = { paperRecord, rawBody, stripFrontMatter, meta };
