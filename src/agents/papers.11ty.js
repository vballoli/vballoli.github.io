// GET /agents/papers.json: the full publication record as structured data.

const { paperRecord } = require("../_lib/agent-data.js");

module.exports = class {
  data() {
    return {
      permalink: "/agents/papers.json",
      eleventyExcludeFromCollections: true
    };
  }

  render({ collections, site, buildDateTime }) {
    const papers = collections.papers.map((p) => paperRecord(p, site));
    return JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        generated: buildDateTime,
        source: site.url + "/agents/",
        licence: "Metadata is free to reuse with attribution. Paper texts remain under their publishers' terms.",
        author: { name: site.author, orcid: site.orcid, url: site.url + "/" },
        count: papers.length,
        order: "reverse chronological",
        papers
      },
      null,
      2
    );
  }
};
