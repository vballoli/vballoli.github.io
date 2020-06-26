---
title: 'Decentralised Chat'
date: 2018-11-03
permalink: /posts/decentralised-chat/
tags:
  - project
  - cryptography
---

A decentralised work in progress.

A couple of months ago while binge watching YouTube, I came across a very interesting TechCrunch interview with [Vitalik Buterin](https://www.youtube.com/watch?v=WSN5BaCzsbo) (do watch it, it's worth the time), co-founder of Ethereum which got me curious about the Ethereum and crytpocurrencies in general. After digging a little into Ethereum, I found [Solidity](https://github.com/ethereum/solidity). Solidity is a statically typed language developed by the same people who've developed Ethereum, a turing complete blockchain, essentially meaning any problem can be solved assuming infinite memory, which was lacking in Bitcoin. Impressive!

Coincidentally, I enrolled in BITS F463 Cryptography course as a disciplinary elective which had an evaluated project component. So, I decided to use solidity and build an app. That's how the idea of decentralised chat started. You can find the project on github:

`https://github.com/vballoli/decentralised-chat`

I decided to use Node.js since it was easy to work with and I found many resources and documentation in nodejs than any other framework. My first commit was a simple smart contract having only one functionality : sending a message using Truffle. Although it was only a few lines of code, it took me quite a while to understand it given there are very few beginner-friendly resources on the web about building DApps in solidity. This was going pretty well until I took a brief break for this project since I had many other assignments, projects and tests to complete and prepare for, leaving me exhausted at the end of the day and this project unattended.

The second commit was rushed since my midterm report submission was closing by and I had very little progress. This commit was mostly Javascript code for writing test for the smart contract, the chat UI and contract calls using bootstrap and Web3 frameworks. The concept of Web3 simply amazes me, although I still don't understand it completely. After working for 6 hours straight with programming languages in which I'm a complete beginner, the results were very satisfying. Using the combination of Truffle, Ganache, MetaMask - which I'd coin the term the Solidity-Dev-Trio, I built a simple, working chat room. I'll update about my progress on this later, given I have my mid term submission tomorrow. I hope I find time for adding more functionality to this, given it has a very crappy UI. Do try it out by forking the repository and if you like it, star it!
