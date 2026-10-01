// Case studies: an intervention, its impact and a source. The first eight are
// from the Monsoon Edition deck. The rest were added for v2 and carry
// `verify: true`: check the figures against the source before they go on a slide.

import type { Item } from '../catalog';

export const cases: Item[] = [
  // ─── Kickoff: can design make a difference? ────────────────────────────────
  {
    id: 'airbnb', kind: 'case', phase: 'kickoff', title: 'Airbnb: better photos',
    summary: 'The founders photographed New York listings properly themselves.',
    image: 'cases/airbnb.webp', impact: ['2× New York revenue', '+21% host earnings', '+19% bookings'], source: 'ProductHabits',
    takeaway: 'They went and did the unscalable thing in person, and learned what the data couldn’t show.',
    slides: [49, 50],
  },
  {
    id: 'pepsico', kind: 'case', phase: 'kickoff', title: 'PepsiCo: design as enterprise capability',
    summary: 'Indra Nooyi took design from product to experience to organisation.',
    image: 'cases/pepsico.webp', impact: ['$200M+ from Mtn Dew Kickstart in year 1', 'New product, new users, new growth'],
    source: 'HBR podcast, 2015: PepsiCo CEO Indra Nooyi on design thinking',
    takeaway: 'Design became a leadership capability, not a department.',
    slides: [51, 52],
  },
  {
    id: 'mckinsey', kind: 'case', phase: 'kickoff', title: 'McKinsey Design Index',
    summary: 'Organisations with the strongest design capabilities, compared with industry peers over five years.',
    image: 'cases/mckinsey.webp', impact: ['32 pp higher revenue growth', '56 pp higher total shareholder returns'],
    source: 'McKinsey: The business value of design',
    takeaway: 'The case for leaders who need a number before they give a day to this.',
    slides: [55],
  },
  {
    id: 'shopping-cart', kind: 'case', phase: 'kickoff', title: 'IDEO: the shopping cart in five days',
    summary: 'A TV crew filmed IDEO redesigning the supermarket trolley in five days: fieldwork in shops, a wild brainstorm, rough prototypes and a working cart by Friday.',
    image: 'icons/build.webp',
    impact: ['A working prototype in five days', 'The film that introduced the process to a mass audience'],
    source: 'ABC Nightline, “The Deep Dive” (1999)',
    takeaway: 'Play ten minutes of it in the kickoff. It shows the whole diamond faster than any slide.',
    verify: true,
  },

  // ─── Discover ──────────────────────────────────────────────────────────────
  {
    id: 'paytm', kind: 'case', phase: 'discover', title: 'Paytm: making the payment audible',
    summary: 'Shopkeepers couldn’t watch their phones while serving customers. The Soundbox reads each payment out loud.',
    image: 'cases/paytm.webp', impact: ['5 billion+ payments through Soundbox in FY22', '6.1 million+ merchants paying device subscriptions'],
    source: 'Paytm',
    takeaway: 'Observation, not a survey, found it: shopkeepers’ eyes were on the customer, not the screen.',
    slides: [80, 81],
  },
  {
    id: 'ge-adventure', kind: 'case', phase: 'discover', title: 'GE Healthcare: the MRI as an adventure',
    summary: 'Doug Dietz watched a frightened child cry on her way into the MRI scanner he had designed. The Adventure Series turned scan rooms into pirate ships and jungle camps, with a script for the technicians.',
    image: 'deck/ship-mri.webp',
    impact: ['Far fewer children needing sedation for a scan', 'Patient satisfaction scores up 90%, as Dietz reports'],
    source: 'Doug Dietz, “Transforming healthcare for children and their families”, TEDxSanJoseCA (2012); GE Healthcare',
    takeaway: 'The person who designed the machine had never watched it being used.',
    verify: true,
  },
  {
    id: 'swiffer', kind: 'case', phase: 'discover', title: 'P&G Swiffer: watching people mop',
    summary: 'Designers at Continuum watched people clean their floors at home and noticed they spent almost as much time cleaning the mop as the floor. The answer was a disposable cloth on a stick.',
    image: 'icons/observe.webp',
    impact: ['A new cleaning category, launched in 1999', 'Widely reported as a $500M brand in its first year'],
    source: 'Continuum; Harry West, “Design thinking at P&G” interviews',
    takeaway: 'Nobody complains about cleaning the mop in a survey. You only see it by watching.',
    verify: true,
  },
  {
    id: 'oral-b', kind: 'case', phase: 'discover', title: 'Oral-B: a toothbrush for small fists',
    summary: 'Children’s toothbrushes were small versions of adult ones. Watching kids brush, IDEO saw they hold the brush in their whole fist, so the handle needed to be fat and squishy.',
    image: 'icons/look.webp',
    impact: ['Reported as the best-selling kids’ toothbrush in the world for 18 months'],
    source: 'Tom Kelley, The Art of Innovation (2001)',
    takeaway: 'The obvious assumption (kids are small, so make it small) was the wrong one.',
    verify: true,
  },
  {
    id: 'dabbawalas', kind: 'case', phase: 'discover', title: 'Mumbai’s dabbawalas: a system designed by its users',
    summary: 'Around 5,000 dabbawalas deliver about 200,000 home-cooked lunches a day across Mumbai by train and bicycle, using a code of colours and numbers painted on each tiffin. Many of them don’t read.',
    image: 'icons/tiffin.webp',
    impact: ['About 200,000 tiffins a day', 'An error rate famously reported as about one in 16 million'],
    source: 'Stefan Thomke, “Mumbai’s Models of Service Excellence”, Harvard Business Review (2012); Forbes (1998)',
    takeaway: 'Great service design can be low-tech. Study how work is actually done before you digitise it.',
    verify: true,
  },

  // ─── Define ────────────────────────────────────────────────────────────────
  {
    id: 'cred', kind: 'case', phase: 'define', title: 'CRED: turning a payment into an experience',
    summary: 'Paying a credit card bill was a chore in a bank portal. CRED reframed it as a moment worth rewarding.',
    image: 'cases/cred.webp', impact: ['1 million members within its first year'],
    source: 'CRED blog; Kunal Shah interviews; Economic Times and YourStory coverage',
    takeaway: 'Same task, different frame. The problem was “nobody wants to pay bills”, not “the payment form is slow”.',
    slides: [109, 110],
  },
  {
    id: 'embrace', kind: 'case', phase: 'define', title: 'Embrace: the brief said incubator',
    summary: 'A Stanford team was asked to design a cheaper incubator. In Nepal they found most premature babies were born far from hospitals with no reliable power. They reframed the problem: keep babies warm in a village, without electricity. The result was a sleeping bag with a reheatable wax pouch.',
    image: 'icons/emotion.webp',
    impact: ['Around 1% of the cost of a conventional incubator', 'Reported to have helped hundreds of thousands of babies'],
    source: 'Embrace Innovations; Stanford d.school, Design for Extreme Affordability',
    takeaway: 'The brief named a product. The need was warmth. Define is where you find the difference.',
    verify: true,
  },
  {
    id: 'juicero', kind: 'case', phase: 'define', title: 'Juicero: solving the wrong problem, beautifully',
    summary: 'A Wi-Fi-connected juicer that pressed proprietary juice packs, launched at $699. Reporters found they could squeeze the packs by hand just as well. The company shut down the following year.',
    image: 'icons/food.webp',
    impact: ['About $120M raised from investors', 'Closed in 2017, roughly 16 months after launch'],
    source: 'Bloomberg, “Silicon Valley’s $400 Juicer May Be Feeling the Squeeze” (April 2017)',
    takeaway: 'Pair it with the Define blank: one of the most wasteful things a business can do is solve the wrong problem super efficiently.',
    verify: true,
  },

  // ─── Ideate ────────────────────────────────────────────────────────────────
  {
    id: 'boa', kind: 'case', phase: 'ideate', title: 'Bank of America: Keep the Change',
    summary: 'Round up every debit purchase and move the change into savings. It makes saving effortless.',
    image: 'cases/boa.webp', impact: ['1.8M new savings accounts', '4.3M participants', '~$400M saved collectively'],
    source: 'Programme figures reported by Bank of America',
    takeaway: 'Research showed people rounded up in their heads already. The idea built on a habit instead of fighting it.',
    slides: [145, 146],
  },
  {
    id: 'lucky-iron', kind: 'case', phase: 'ideate', title: 'Lucky Iron Life: supplements as part of cooking',
    summary: 'An iron fish dropped into the cooking pot, instead of pills nobody took.',
    image: 'cases/lucky-iron.webp', impact: ['Reached over one million people globally'], source: 'Lucky Iron Life',
    takeaway: 'Put the solution inside a ritual people already have.',
    slides: [147, 148],
  },
  {
    id: 'aravind', kind: 'case', phase: 'ideate', title: 'Aravind Eye Care: an idea borrowed from McDonald’s',
    summary: 'Dr Govindappa Venkataswamy wanted to end needless blindness in India. He borrowed the assembly line from McDonald’s: standardised steps, specialised roles, very high volume. Paying patients subsidise free ones.',
    image: 'icons/lens.webp',
    impact: ['Millions of eye surgeries since 1976', 'Around half of patients treated free or heavily subsidised'],
    source: 'V. Kasturi Rangan, “The Aravind Eye Hospital, Madurai, India: In Service for Sight”, Harvard Business School case (1993)',
    takeaway: 'Analogous inspiration at its best: a hospital that learned from a burger chain.',
    verify: true,
  },
  {
    id: 'genius-bar', kind: 'case', phase: 'ideate', title: 'Apple’s Genius Bar: borrowed from a hotel',
    summary: 'Planning the first Apple Stores, the team asked people about the best service they’d ever had. Most named a hotel concierge. So the store got a bar staffed by experts instead of a returns counter.',
    image: 'icons/talk.webp',
    impact: ['Became the template for service in Apple’s retail stores'],
    source: 'Walter Isaacson, Steve Jobs (2011); Ron Johnson interviews',
    takeaway: 'The best reference for your experience is often outside your industry. Ask “who already makes people feel this way?”',
    verify: true,
  },

  // ─── Delight ───────────────────────────────────────────────────────────────
  {
    id: 'duolingo', kind: 'case', phase: 'delight', title: 'Duolingo: the streak and the owl',
    summary: 'A count of consecutive days, a cheerful (and sometimes passive-aggressive) owl, and small celebrations. Learning a language is hard; keeping a streak alive is easy.',
    image: 'cases/duolingo.webp',
    impact: ['Duolingo credits streaks as one of its biggest drivers of daily use'],
    source: 'Duolingo blog, posts on streaks and habit design',
    takeaway: 'Delight that builds a habit, not just a smile.',
    verify: true,
  },
  {
    id: 'strava', kind: 'case', phase: 'delight', title: 'Strava: kudos and the year in sport',
    summary: 'A one-tap “kudos” on someone’s run, and an end-of-year summary that turns your own effort into a story worth sharing.',
    image: 'cases/strava.webp',
    impact: ['Social recognition built into the core loop of the product'],
    source: 'Strava',
    takeaway: 'Small social rewards for showing up matter more than big features.',
    verify: true,
  },
  {
    id: 'spotify-wrapped', kind: 'case', phase: 'delight', title: 'Spotify Wrapped: your data as a gift',
    summary: 'Each December, Spotify turns a year of listening into a short, shareable story about you. Users do the marketing by posting it.',
    image: 'icons/present.webp',
    impact: ['One of the most shared brand moments of the year, every year since 2016'],
    source: 'Spotify Newsroom',
    takeaway: 'Data the company already had, given back as something personal. Ask what your customers’ year looked like.',
    verify: true,
  },

  // ─── Prototype & test ──────────────────────────────────────────────────────
  {
    id: 'postit', kind: 'case', phase: 'prototype', title: '3M Post-it: try it, change it, try again',
    summary: 'A “failed” weak adhesive, iterated with real users until it found its use.',
    image: 'cases/postit.webp', impact: ['One of the world’s best-selling office products'],
    source: 'Smithsonian’s Lemelson Center and 3M',
    takeaway: 'The prototype found its purpose by being handed out, not by being perfected in a lab.',
    slides: [180, 181],
  },
  {
    id: 'kaiser', kind: 'case', phase: 'prototype', title: 'Kaiser Permanente: rehearsing the shift change',
    summary: 'Nurses and IDEO watched hospital shift handovers, then role-played a new one: at the bedside, with the patient, using a simple tool to pass on notes. They tested it on a ward before rolling it out.',
    image: 'icons/repeat.webp',
    impact: ['Nurses got to their patients sooner after each handover', 'Built by nurses, so it spread without a mandate'],
    source: 'Tim Brown, “Design Thinking”, Harvard Business Review (June 2008)',
    takeaway: 'Role play is a real prototype. You can test a service before anyone writes code.',
    verify: true,
  },

  // ─── Close: trade-offs ─────────────────────────────────────────────────────
  {
    id: 'tata-nano', kind: 'case', phase: 'close', title: 'Tata Nano: feasible, viable, not desirable',
    summary: 'An engineering triumph: a family car at ₹1 lakh. But it was marketed as “the cheapest car”, and buyers didn’t want to be seen in it. Ratan Tata later called that label a mistake.',
    image: 'icons/journey.webp',
    impact: ['Sales far below the plant’s capacity', 'Production ended in 2018'],
    source: 'Ratan Tata interviews (2013); Economic Times coverage',
    takeaway: 'Desirability includes how a product makes people feel in front of others. DVF needs all three.',
    verify: true,
  },
];
