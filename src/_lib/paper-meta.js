// Shared helpers for deriving publication metadata from paper front matter.
//
// Papers declare links, venues, and BibTeX; everything else (arXiv id, DOI,
// plain-text abstract, citation tags) is derived from those rather than
// duplicated by hand, so the two can never drift apart.

const ARXIV_RE = /arxiv\.org\/abs\/([^\s/?#]+)/i;
const DOI_RE = /doi\.org\/(10\.[^\s?#]+)/i;

function links(data) {
  return Array.isArray(data.links) ? data.links : [];
}

function findLink(data, re) {
  for (const link of links(data)) {
    const match = String(link.href || "").match(re);
    if (match) return match[1];
  }
  return null;
}

const arxivId = (data) => findLink(data, ARXIV_RE);
const doi = (data) => data.doi || findLink(data, DOI_RE);

function linkByLabel(data, label) {
  const hit = links(data).find(
    (l) => String(l.label || "").toLowerCase() === label.toLowerCase()
  );
  return hit ? hit.href : null;
}

// Canonical records of *this* work only. `sameAs` asserts identity, so code
// repositories, talks, and a project page shared with a parent paper all have
// to stay out of it, or two distinct articles read as one entity.
const IDENTITY_LABEL = /^(paper|pdf|proceedings|arxiv)$/i;

function sameAs(data) {
  const id = arxivId(data);
  const doiValue = doi(data);
  const out = [];
  if (id) out.push(`https://arxiv.org/abs/${id}`);
  if (doiValue) out.push(`https://doi.org/${doiValue}`);
  links(data).forEach((l) => {
    if (IDENTITY_LABEL.test(String(l.label || "")) && /^https?:\/\//.test(l.href || "")) {
      out.push(l.href);
    }
  });
  return out.filter((href, i) => out.indexOf(href) === i);
}

// A stable PDF URL, when one exists. arXiv's /pdf/ form works; ACM's is
// paywalled, so it is deliberately not offered here. Otherwise fall back to a
// link that actually returns a PDF body: a Drive or publisher *viewer* page
// serves HTML, so it must not become citation_pdf_url.
const DIRECT_PDF = /(\.pdf($|\?)|openreview\.net\/pdf\?|aclanthology\.org\/.+\.pdf)/i;

function pdfUrl(data) {
  const id = arxivId(data);
  if (id) return `https://arxiv.org/pdf/${id}`;
  const hit = links(data).find((l) => DIRECT_PDF.test(l.href || ""));
  return hit ? hit.href : null;
}

function primaryVenue(data) {
  return Array.isArray(data.venues) && data.venues.length ? data.venues[0] : null;
}

// "IJCAI 2024" / "KDD 2026": the short label used in titles and breadcrumbs.
function venueLabel(data) {
  const venue = primaryVenue(data);
  if (!venue) return "";
  return [venue.acronym, venue.year].filter(Boolean).join(" ");
}

// The full conference name, pulled out of the BibTeX `booktitle` so the two can
// never drift apart. Falls back to the acronym when there is no BibTeX.
function venueFullName(data) {
  const match = String(data.bibtex || "").match(/booktitle\s*=\s*\{(.+?)\}\s*,?\s*\n/s);
  if (match) return match[1].replace(/[{}]/g, "").trim();
  const venue = primaryVenue(data);
  return venue ? venue.acronym : "";
}

function authorNames(data) {
  return (Array.isArray(data.authors) ? data.authors : []).map((a) =>
    // Co-first-author markers are presentational; citation metadata wants the
    // bare name.
    String(a.name || "").replace(/\*+$/, "").trim()
  );
}

// Markdown body -> a single plain-text line usable as a meta description.
function plainSummary(raw, limit = 300) {
  const text = String(raw || "")
    .replace(/^---[\s\S]*?^---\s*/m, "")   // strip front matter
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> label
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return cut.slice(0, cut.lastIndexOf(" ")).trim() + "…";
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Highwire Press citation tags: the conventional way a page declares which
// published work it corresponds to.
function citationMeta(data) {
  const tags = [];
  const push = (name, content) => {
    if (content) tags.push(`<meta name="${name}" content="${escapeAttr(content)}">`);
  };

  push("citation_title", data.title);
  authorNames(data).forEach((name) => push("citation_author", name));

  const venue = primaryVenue(data);
  if (venue && venue.year) push("citation_publication_date", venue.year);
  push("citation_conference_title", venueFullName(data));
  push("citation_doi", doi(data));
  const id = arxivId(data);
  if (id) {
    push("citation_arxiv_id", id);
    push("citation_abstract_html_url", `https://arxiv.org/abs/${id}`);
  }
  push("citation_pdf_url", pdfUrl(data));

  return tags.join("\n  ");
}

module.exports = {
  arxivId,
  doi,
  linkByLabel,
  sameAs,
  pdfUrl,
  primaryVenue,
  venueLabel,
  venueFullName,
  authorNames,
  plainSummary,
  citationMeta
};
