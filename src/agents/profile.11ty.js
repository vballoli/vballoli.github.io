// GET /agents/profile.json: identity, affiliations, and the systems record.

module.exports = class {
  data() {
    return {
      permalink: "/agents/profile.json",
      eleventyExcludeFromCollections: true
    };
  }

  render({ site, cv, systems, collections, buildDateTime }) {
    return JSON.stringify(
      {
        generated: buildDateTime,
        source: site.url + "/agents/",
        person: {
          name: site.author,
          role: site.jobTitle,
          affiliation: site.affiliation,
          advisor: "Elizabeth Bondi-Kelly",
          email: site.email,
          url: site.url + "/",
          researchAreas: site.knowsAbout,
          summary: cv.focus
        },
        identifiers: {
          orcid: site.orcid,
          dblp: "348/6962",
          semanticScholar: "1564592237"
        },
        profiles: site.sameAs,
        education: cv.education.map((e) => ({
          institution: e.institution,
          qualification: e.qualification,
          period: e.period
        })),
        experience: cv.experience.map((e) => ({
          organisation: e.organisation,
          role: e.role,
          period: e.period,
          summary: e.detail
        })),
        systems: systems.items.map((s) => ({
          name: s.name,
          status: s.status,
          organisation: s.org,
          period: s.years,
          contribution: s.role,
          outcome: s.impact,
          areas: s.stack,
          topics: s.topics,
          paper: s.paper ? site.url + "/papers/" + s.paper + "/" : null,
          links: s.links.map((l) => ({ label: l.label, url: l.href }))
        })),
        topics: collections.topics.map((t) => ({
          id: t.slug,
          label: t.label,
          description: t.blurb,
          paperCount: t.papers.length,
          url: site.url + "/topics/" + t.slug + "/"
        })),
        workingPapers: cv.workingPapers,
        service: cv.service
      },
      null,
      2
    );
  }
};
