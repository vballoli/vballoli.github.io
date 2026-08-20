// GET /llms-full.txt: every page and abstract concatenated, so an agent can
// take the whole site in a single fetch.

const { paperRecord, stripFrontMatter } = require("../_lib/agent-data.js");

module.exports = class {
  data() {
    return {
      permalink: "/llms-full.txt",
      eleventyExcludeFromCollections: true
    };
  }

  render({ site, cv, systems, lineage, collections, news, buildDateTime }) {
    const out = [];
    const heading = (text) => out.push("", `## ${text}`, "");

    out.push(
      `# ${site.name}: full site text`,
      "",
      `> ${site.description}`,
      "",
      `Generated ${buildDateTime} from ${site.url}/. Short index: ${site.url}/llms.txt · Structured data: ${site.url}/agents/`,
      ""
    );

    heading("Profile");
    out.push(
      `${site.name} is an ${site.jobTitle} at ${site.affiliation}, advised by Elizabeth Bondi-Kelly.`,
      "",
      cv.focus,
      "",
      `Research areas: ${site.knowsAbout.join(", ")}.`,
      `ORCID: ${site.orcid}. Contact: ${site.email}.`
    );

    heading("Research lineage");
    lineage.threads.forEach((thread) => {
      const chain = thread.levels
        .map((level) =>
          level
            .map((node) => {
              const p = collections.papers.find((x) => x.fileSlug === node.slug);
              return p ? `${p.data.title} (${node.note})` : node.slug;
            })
            .join(" and ")
        )
        .join(" -> ");
      const where = thread.deployment ? ` Deployment: ${thread.deployment}.` : "";
      out.push(`- ${thread.theme}. For ${thread.roots.toLowerCase()}. ${chain}. Stage: ${thread.stage}.${where}`);
    });

    heading("Systems and deployments");
    systems.items.forEach((s) => {
      out.push(
        `### ${s.name}`,
        "",
        `${s.org}, ${s.years}. Status: ${s.status}.`,
        "",
        s.role,
        "",
        s.outcome || s.impact,
        "",
        `Areas: ${s.stack.join(", ")}.`,
        `Links: ${s.links.map((l) => `${l.label} ${l.href}`).join(" · ")}`,
        ""
      );
    });

    heading("Publications");
    collections.papers.forEach((paper) => {
      const p = paperRecord(paper, site);
      out.push(
        `### ${p.title}`,
        "",
        `${[p.venue.acronym, p.year].filter(Boolean).join(" ")}${p.venue.track ? ` (${p.venue.track})` : ""}. ${p.venue.name || ""}`.trim(),
        "",
        `Authors: ${p.authors.map((a) => a.name).join(", ")}.`,
        p.doi ? `DOI: ${p.doi}.` : null,
        p.arxivId ? `arXiv: ${p.arxivId}.` : null,
        p.distinctions.length ? `Distinctions: ${p.distinctions.join(", ")}.` : null,
        "",
        p.abstract,
        "",
        `Canonical page: ${p.url}`,
        ""
      );
    });

    heading("Topics");
    collections.topics.forEach((t) => {
      out.push(`### ${t.label}`, "", t.blurb, "", `${t.papers.length} papers: ${site.url}/topics/${t.slug}/`, "");
    });

    heading("News");
    news.forEach((item) => {
      const text = String(item.html)
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      out.push(`- ${item.date}: ${text}`);
    });

    heading("Curriculum vitae");
    out.push("### Education", "");
    cv.education.forEach((e) =>
      out.push(`- ${e.institution} (${e.period}): ${e.qualification}.${e.detail ? " " + e.detail : ""}`)
    );
    out.push("", "### Research experience", "");
    cv.experience.forEach((e) => out.push(`- ${e.organisation}, ${e.role} (${e.period}): ${e.detail}`));
    out.push("", "### Working papers", "");
    cv.workingPapers.forEach((w) => out.push(`- ${w.title}. ${w.authors}`));
    out.push("", "### Awards and honours", "");
    cv.awards.forEach((a) => out.push(`- ${a.year}: ${a.text}`));
    out.push("", "### Service", "");
    cv.service.forEach((s) => out.push(`- ${s.label}: ${s.detail}`));

    return out.filter((line) => line !== null).join("\n") + "\n";
  }
};
