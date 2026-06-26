---
order: 7
featured: true
title: "Chanakya: Learning Runtime Decisions for Adaptive Real-Time Perception"
topics: [vision]
thumb: /tn/images/chanakya.png
authors:
  - { name: "Anurag Ghosh" }
  - { name: "Vaibhav Balloli", me: true }
  - { name: "Akshay Nambi" }
  - { name: "Aditya Singh" }
  - { name: "Tanuja Ganu" }
venues:
  - { acronym: "NeurIPS", year: "2023" }
links:
  - { label: "Paper", href: "https://openreview.net/pdf?id=VpCjozUOM2" }
  - { label: "Code", href: "https://github.com/microsoft/Chanakya" }
  - { label: "Project", href: "https://aka.ms/chanakya" }
bibtex: |
  @inproceedings{ghosh2023chanakya,
    title     = {Chanakya: Learning Runtime Decisions for Adaptive Real-Time Perception},
    author    = {Ghosh, Anurag and Balloli, Vaibhav and Nambi, Akshay and Singh, Aditya and Ganu, Tanuja},
    booktitle = {Advances in Neural Information Processing Systems (NeurIPS)},
    year      = {2023}
  }
---
A learned approximate-execution framework for streaming perception. Chanakya jointly considers scene content and system contention to pick run-time decisions (resolution, model, compute) that balance accuracy and latency, beating static and dynamic baselines on both server GPUs and edge devices.
