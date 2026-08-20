/* Read-only WebMCP tools for /agents/.
 *
 * WebMCP is a W3C draft (webmachinelearning/webmcp) still behind a flag in
 * Chrome. The surface has moved between navigator.modelContext and
 * document.modelContext during drafting, so both are probed and the whole file
 * is a no-op where neither exists.
 *
 * These tools are registered only on this page. The rest of the site does not
 * load them, so nothing changes for human visitors.
 */
(function () {
  'use strict';

  var mc =
    (typeof navigator !== 'undefined' && navigator.modelContext) ||
    (typeof document !== 'undefined' && document.modelContext) ||
    null;

  var supported = !!(mc && typeof mc.registerTool === 'function');
  var badge = document.getElementById('webmcp-status');

  if (badge) {
    badge.textContent = supported
      ? 'WebMCP detected: 5 read-only tools registered on this page.'
      : 'WebMCP not available in this browser. The JSON endpoints below work everywhere.';
    badge.dataset.state = supported ? 'on' : 'off';
  }

  if (!supported) return;

  var cache = {};

  function load(name) {
    if (cache[name]) return cache[name];
    cache[name] = fetch('/agents/' + name + '.json').then(function (r) {
      if (!r.ok) throw new Error('Could not load ' + name + '.json');
      return r.json();
    });
    return cache[name];
  }

  function reply(value) {
    return {
      content: [
        { type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }
      ]
    };
  }

  function summarise(p) {
    return {
      id: p.id,
      title: p.title,
      year: p.year,
      venue: [p.venue.acronym, p.venue.track].filter(Boolean).join(', '),
      authors: p.authors.map(function (a) { return a.name; }),
      doi: p.doi,
      arxivId: p.arxivId,
      topics: p.topics,
      url: p.url
    };
  }

  var tools = [
    {
      name: 'list_publications',
      description:
        'List the publications of Vaibhav Balloli, newest first. Optionally filter by ' +
        'topic id (llms, evals, healthcare, vision, social-impact) or by year.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic id to filter by.' },
          year: { type: 'string', description: 'Four-digit publication year to filter by.' }
        }
      },
      execute: function (args) {
        args = args || {};
        return load('papers').then(function (data) {
          var list = data.papers.filter(function (p) {
            if (args.topic && p.topics.indexOf(args.topic) === -1) return false;
            if (args.year && String(p.year) !== String(args.year)) return false;
            return true;
          });
          return reply({ count: list.length, publications: list.map(summarise) });
        });
      }
    },

    {
      name: 'get_publication',
      description:
        'Fetch one publication in full: abstract, authors, venue, DOI, arXiv id, ' +
        'BibTeX, links, and which paper it builds on. Use an id from list_publications.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Publication id, e.g. "reliance".' } },
        required: ['id']
      },
      execute: function (args) {
        return load('papers').then(function (data) {
          var hit = data.papers.filter(function (p) { return p.id === (args && args.id); })[0];
          if (!hit) {
            return reply(
              'No publication with id "' + (args && args.id) + '". Available ids: ' +
              data.papers.map(function (p) { return p.id; }).join(', ') + '.'
            );
          }
          return reply(hit);
        });
      }
    },

    {
      name: 'search_publications',
      description:
        'Free-text search across publication titles, authors, abstracts, venues, and topics. ' +
        'All query words must match.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Words to search for.' } },
        required: ['query']
      },
      execute: function (args) {
        var words = String((args && args.query) || '').toLowerCase().split(/\s+/).filter(Boolean);
        return load('papers').then(function (data) {
          if (!words.length) return reply({ count: 0, matches: [] });
          var hits = data.papers.filter(function (p) {
            var hay = [
              p.title,
              p.abstract,
              p.venue.acronym,
              p.venue.name,
              p.topics.join(' '),
              p.authors.map(function (a) { return a.name; }).join(' ')
            ].join(' ').toLowerCase();
            return words.every(function (w) { return hay.indexOf(w) !== -1; });
          });
          return reply({ query: args.query, count: hits.length, matches: hits.map(summarise) });
        });
      }
    },

    {
      name: 'list_topics',
      description: 'List the research topics on this site with descriptions and paper counts.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        return load('profile').then(function (data) { return reply(data.topics); });
      }
    },

    {
      name: 'get_profile',
      description:
        'Fetch the site owner’s profile: role, affiliation, advisor, persistent ' +
        'identifiers (ORCID, DBLP, Semantic Scholar), education, research experience, ' +
        'and deployed systems.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        return load('profile').then(function (data) {
          return reply({
            person: data.person,
            identifiers: data.identifiers,
            profiles: data.profiles,
            education: data.education,
            experience: data.experience,
            systems: data.systems
          });
        });
      }
    }
  ];

  tools.forEach(function (tool) {
    try {
      mc.registerTool(tool);
    } catch (err) {
      // A tool of this name may already be registered; nothing to recover.
    }
  });
})();
