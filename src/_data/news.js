// Build-time news pipeline.
//
// news.md is a flat file of `## YYYY-MM-DD` blocks separated by `---`. It used
// to be fetched and parsed in the browser, which meant none of it reached the
// served HTML. Parsing it here puts every item in the markup and drops the
// marked.js CDN script.

const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-04-20" -> "Apr 20, 2026"; anything unparseable passes through as-is.
function formatDate(iso) {
  const parts = String(iso).split("-");
  if (parts.length !== 3) return iso;
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return iso;
  return `${MONTHS[monthIndex]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

// External links in news copy need rel="noopener" the same way the templates do.
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const href = tokens[idx].attrGet("href") || "";
  if (/^https?:\/\//.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
  }
  return self.renderToken(tokens, idx, options);
};

module.exports = function () {
  const file = path.join(__dirname, "..", "..", "news.md");
  if (!fs.existsSync(file)) return [];

  return fs
    .readFileSync(file, "utf8")
    .split(/^\s*---\s*$/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const heading = lines[0] && lines[0].match(/^##\s+(.+?)\s*$/);
      const date = heading ? heading[1].trim() : "";
      const body = (heading ? lines.slice(1) : lines).join("\n").trim();
      return {
        date,
        dateFormatted: formatDate(date),
        // Inline items are single sentences; render them without a <p> wrapper
        // so the existing .news__content styles keep applying unchanged.
        html: md.render(body).trim()
      };
    })
    .filter((item) => item.html)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
};
