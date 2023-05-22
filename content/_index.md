---
# Leave the homepage title empty to use the site title
title: Vaibhav Balloli
date: 2022-10-24
type: landing

sections:
  - block: v1/about
    id: about
    author: admin
    content:
      username: admin
      author: admin
    Params:
      author: admin
      # Choose a user profile to display (a folder name within `content/authors/`)
      # Override your bio text from `authors/admin/_index.md`?
      text:
  - block: markdown
    content:
      title: News
      subtitle: 
      # Path to the logo images within the `assets/media/` folder
      text: |2-
        * May 2023: Breaking Language Barriers with a LEAP: Learning Strategies for Polyglot LLMs pre-print
        * September 2022: EnCortex: A General, Extensible and Scalable Framework for Decision Management in New-age Energy Systems under review.
        * August 2022: Chanakya: Learning Tradeoffs for Adaptive Streaming Perception under review
        * July 2022: Extending stint at Microsoft Research as [Research Fellow](https://www.microsoft.com/en-us/research/academic-program/research-fellows-program-at-microsoft-research-india/).
        * July 2021: Joining Microsoft Research as [SCAI Research Fellow](https://www.microsoft.com/en-us/research/collaboration/scai/).
    design:
      columns: '1'
  - block: experience
    content:
      title: Experience
      # Date format for experience
      #   Refer to https://wowchemy.com/docs/customization/#date-format
      date_format: Jan 2006
      # Experiences.
      #   Add/remove as many `experience` items below as you like.
      #   Required fields are `title`, `company`, and `date_start`.
      #   Leave `date_end` empty if it's your current employer.
      #   Begin multi-line descriptions with YAML's `|2-` multi-line prefix.
      items:
        - title: Ph.D. Student
          company: University of Michigan
          company_url: ''
          company_logo: org-uofm
          location: Ann Arbor, MI
          date_start: '2023-08-28'
          date_end: ''
          description: |2-
            Graduate student at the CSE Department at [Realize Lab](https://sites.google.com/view/realize-lab/home?authuser=0).
              
        - title: Research Fellow
          company: Microsoft Research
          company_url: ''
          company_logo: org-mc
          location: Bengaluru
          date_start: '2021-06-28'
          date_end: '2023-06-28'
          description: |2-
              Projects:

              * [HAMS](https://www.microsoft.com/en-us/research/project/hams/) - Automated License Testing (AI for Social Good)
              * [Vasudha](https://www.microsoft.com/en-us/research/project/vasudha/) - `EnCortex` package that provides optimization and decision making for improving sustainability of energy producers. (Currently integrated as a product at Microsoft)
              * VeLLM - Improving multilingual capabilities  of Black-box LLMs and subsequently building ShikshaGPT.
    design:
      columns: '2'
  - block: portfolio
    id: projects
    content:
      title: Projects
      filters:
        folders:
          - project
      # Default filter index (e.g. 0 corresponds to the first `filter_button` instance below).
      default_button_index: 0
      # Filter toolbar (optional).
      # Add or remove as many filters (`filter_button` instances) as you like.
      # To show all items, set `tag` to "*".
      # To filter by a specific tag, set `tag` to an existing tag name.
      # To remove the toolbar, delete the entire `filter_button` block.
      buttons:
        - name: All
          tag: '*'
        - name: Deep Learning
          tag: Deep Learning
        - name: Reinforcement Learning
          tag: Reinforcement Learning
        - name: Others
          tag: other
    design:
      # Choose how many columns the section has. Valid values: '1' or '2'.
      columns: '2'
      view: showcase
      # For Showcase view, flip alternate rows?
      flip_alt_rows: true
  - block: collection
    id: featured
    content:
      title: Featured Publications
      filters:
        folders:
          - publication
        featured_only: true
    design:
      columns: '2'
      view: card
  - block: collection
    content:
      title: Recent Publications
      text: |-
        {{% callout note %}}
        Quickly discover relevant content by [filtering publications](./publication/).
        {{% /callout %}}
      filters:
        folders:
          - publication
        exclude_featured: false
    design:
      columns: '2'
      view: citation
  - block: contact
    id: contact
    content:
      title: Contact
      subtitle:
      text: |-
        You can always reach me through email or twitter.
      # Contact (add or remove contact options as necessary)
      email: balloli.vb@gmail.com
      contact_links:
        - icon: twitter
          icon_pack: fab
          name: DM Me
          link: 'https://twitter.com/v_balloli'
      # Automatically link email and phone or display as text?
      autolink: true
    design:
      columns: '2'
---
