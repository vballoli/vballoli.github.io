// GET /agents/index.json: the entry point. One fetch that tells an agent what
// exists here, what shape it is, and what it may do with it.

module.exports = class {
  data() {
    return {
      permalink: "/agents/index.json",
      eleventyExcludeFromCollections: true
    };
  }

  render({ site, collections, buildDateTime }) {
    const u = (path) => site.url + path;

    return JSON.stringify(
      {
        name: site.author + ": machine-readable site index",
        description:
          "Static, read-only research site for " + site.author + ", " + site.jobTitle +
          " at " + site.affiliation + ". This manifest lists every machine-readable " +
          "representation of the site's content.",
        homepage: u("/"),
        documentation: u("/agents/"),
        generated: buildDateTime,
        contact: "mailto:" + site.email,

        kind: "content",
        interactive: false,
        note:
          "This is a personal research site, not an agent service. It exposes no " +
          "callable service endpoints, accepts no writes, and requires no " +
          "authentication. There is deliberately no A2A agent card at " +
          "/.well-known/agent-card.json, because nothing here acts as an agent.",

        usage: {
          crawling: "Permitted. See " + u("/robots.txt") + "; all major AI crawlers are allowed.",
          attribution:
            "Cite the underlying publication (DOI or arXiv id in /agents/papers.json), " +
            "not this website, when referring to research findings.",
          metadataLicence: "Free to reuse with attribution.",
          contentLicence: "Paper texts remain under their publishers' terms."
        },

        resources: [
          {
            id: "summary",
            url: u("/llms.txt"),
            mediaType: "text/markdown",
            description: "Short orientation index, per the llms.txt convention. Start here if context is limited."
          },
          {
            id: "full-text",
            url: u("/llms-full.txt"),
            mediaType: "text/markdown",
            description: "Every page and paper abstract concatenated into one document. One fetch, whole site."
          },
          {
            id: "papers",
            url: u("/agents/papers.json"),
            mediaType: "application/json",
            description: "All " + collections.papers.length + " publications with DOI, arXiv id, authors, venue, abstract, topics, and lineage.",
            fields: ["id", "title", "url", "year", "venue", "authors", "doi", "arxivId", "pdf", "abstract", "topics", "distinctions", "buildsOn", "links", "markdown", "bibtex"]
          },
          {
            id: "profile",
            url: u("/agents/profile.json"),
            mediaType: "application/json",
            description: "Identity, persistent identifiers, education, research experience, deployed systems, and topics."
          },
          {
            id: "sitemap",
            url: u("/sitemap.xml"),
            mediaType: "application/xml",
            description: "Every canonical URL with a last-modified date."
          },
          {
            id: "structured-data",
            url: u("/"),
            mediaType: "application/ld+json",
            description:
              "Every HTML page embeds schema.org JSON-LD: Person and WebSite site-wide, plus " +
              "ScholarlyArticle on each paper page, CollectionPage on each topic hub, and " +
              "ProfilePage on the homepage and CV. All nodes reference @id " + u("/#person") + "."
          }
        ],

        markdownAlternates: {
          pattern: u("/papers/{id}.md"),
          description:
            "Every paper page has a plain-markdown twin, discoverable from the HTML via " +
            "<link rel=\"alternate\" type=\"text/markdown\">. Substitute the paper `id` from /agents/papers.json.",
          examples: collections.papers.slice(0, 3).map((p) => u("/papers/" + p.fileSlug + ".md"))
        },

        tools: {
          protocol: "WebMCP (W3C draft, navigator.modelContext)",
          registeredOn: u("/agents/"),
          scope: "read-only",
          note:
            "Tools are registered only on /agents/ so the rest of the site stays unchanged " +
            "for human visitors. They are feature-detected and are a no-op in browsers " +
            "without WebMCP support.",
          available: [
            { name: "list_publications", description: "List all publications, newest first, optionally filtered by topic or year." },
            { name: "get_publication", description: "Fetch one publication in full by its id." },
            { name: "search_publications", description: "Free-text search across titles, authors, abstracts, venues, and topics." },
            { name: "list_topics", description: "List research topics with descriptions and paper counts." },
            { name: "get_profile", description: "Fetch identity, affiliations, identifiers, and deployed systems." }
          ]
        },

        topics: collections.topics.map((t) => ({
          id: t.slug,
          label: t.label,
          url: u("/topics/" + t.slug + "/"),
          paperCount: t.papers.length
        }))
      },
      null,
      2
    );
  }
};
