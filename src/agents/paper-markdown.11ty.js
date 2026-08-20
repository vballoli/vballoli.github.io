// GET /papers/{id}.md: a plain-markdown twin of each paper page, per the
// llms.txt convention for markdown alternates.

const { paperRecord } = require("../_lib/agent-data.js");

function toMarkdown(p) {
  const lines = [`# ${p.title}`, ""];

  const venue = [p.venue.acronym, p.year].filter(Boolean).join(" ");
  if (venue) lines.push(`**${venue}**${p.venue.track ? ` (${p.venue.track})` : ""}`, "");
  if (p.venue.name) lines.push(`*${p.venue.name}*`, "");

  lines.push(
    p.authors
      .map((a) => (a.isSiteOwner ? `**${a.name}**` : a.name) + (a.coFirstAuthor ? "\\*" : ""))
      .join(", "),
    ""
  );

  if (p.distinctions.length) lines.push(`Distinctions: ${p.distinctions.join(", ")}`, "");

  lines.push("## Summary", "", p.abstract, "");

  const ids = [];
  if (p.doi) ids.push(`- DOI: [${p.doi}](https://doi.org/${p.doi})`);
  if (p.arxivId) ids.push(`- arXiv: [${p.arxivId}](https://arxiv.org/abs/${p.arxivId})`);
  if (p.pdf) ids.push(`- PDF: ${p.pdf}`);
  if (ids.length) lines.push("## Identifiers", "", ...ids, "");

  if (p.links.length) {
    lines.push("## Links", "", ...p.links.map((l) => `- ${l.label}: ${l.url}`), "");
  }

  if (p.topics.length) lines.push("## Topics", "", p.topics.join(", "), "");
  if (p.buildsOn) lines.push("## Builds on", "", p.buildsOn, "");
  if (p.bibtex) lines.push("## Citation", "", "```bibtex", p.bibtex, "```", "");

  lines.push("---", "", `Canonical HTML page: ${p.url}`);
  return lines.join("\n");
}

module.exports = class {
  data() {
    return {
      pagination: {
        data: "collections.papers",
        size: 1,
        alias: "paper",
        addAllPagesToCollections: false
      },
      permalink: (data) => `/papers/${data.paper.fileSlug}.md`,
      eleventyExcludeFromCollections: true
    };
  }

  render({ paper, site }) {
    return toMarkdown(paperRecord(paper, site));
  }
};
