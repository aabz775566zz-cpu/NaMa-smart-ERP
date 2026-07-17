# ERP Smart — Revolutionary Redesign: "The Brief"

*A structural reinvention of the experience. Plan only — no code. Governed by
`docs/ERP_SMART_CONSTITUTION.md`. Colours are settled (Warm Clarity); this
document is about model, layout, typography, motion, and interaction — the
places "revolutionary" actually lives.*

---

## 0. Why every ERP dashboard is dead (including ours today)

Before inventing, diagnose. Every ERP home screen on earth — SAP, Odoo, Zoho,
and our current one — shares the same five diseases:

1. **It's a wall of cards.** "Here is everything; you figure out what matters."
   That is not a design; it is an abdication. A grid has no story, no rhythm, no
   priority. The eye lands nowhere.
2. **It shows the past.** Charts of what already happened. It answers "what
   occurred?" when the owner opens it to ask "what do I do?"
3. **It treats the owner as an analyst.** Dense figures, filters, tables — tools
   for someone studying data. Our user is not studying; they are *running a shop*
   between customers, on a phone.
4. **Navigation is a filing cabinet.** A tree of 50 modules you traverse to reach
   data. The bigger the tree, the more it screams "enterprise software." Our
   sidebar today has ~50 items; ~10 are real. It is the single loudest "this is a
   traditional ERP" signal in the product.
5. **AI is a room you visit.** A chat page in the corner. A confession that the
   intelligence is bolted on, not woven in.

A "better dashboard" fixes none of these. It rearranges the corpse. We are not
doing that.

---

## 1. The thesis — the one idea everything derives from

> **ERP Smart is not a place you look at your business.
> It is a companion that briefs you, and a surface you act on.**

Kill the word "dashboard." The home is not a dashboard. It is **The Brief** — a
calm, daily, human briefing that tells the owner, in ten seconds and in one
sentence, how their business is and what needs them today. Then it gets out of
the way.

The entire product collapses to **three surfaces** — and nothing else:

| Surface | What it is | Inspiration, transcended |
|---|---|---|
| **The Brief** | The home. Today, as a story you read top-to-bottom. | Not Stripe's grid — an *editorial column*. |
| **The Spine (Ask & Act)** | One gesture (⌘K / a tap) to go anywhere, do anything, ask anything. The universal verb surface. | Raycast/Arc/Linear command — but for a shopkeeper, not an engineer. |
| **The Views** | The few *real* work surfaces: Sales, Money, Stock, People. Each a calm focused workspace, not a data grid. | Notion's calm, not an admin table. |

That's the whole architecture. Three surfaces. Everything that doesn't fit one
of them is deleted from the primary experience (see §2).

---

## 2. What we delete (brutal — question every component)

Revolution is subtraction before it is addition. These die:

- **The "dashboard" itself** — the mental model and the word. Replaced by The Brief.
- **The 5-tile KPI strip** (`KpiOverview`). Generic SaaS. Its data survives, reborn as *Signals* woven into the Brief's narrative (§4).
- **`RecentActivityCard`** — already a permanently-empty corpse. Gone from the home for good.
- **`AiAssistantCard`** — a *promo card advertising the AI, inside the product that has the AI.* If AI is a sense (Constitution ch.7), it doesn't need a billboard. Deleted; AI becomes ambient (§7).
- **The 50-item filing-cabinet sidebar.** The primary nav drops to **5–6 real destinations**. The other ~40 "coming soon" modules leave the daily surface entirely (§3).
- **`SetupProgressCard` as a permanent fixture.** Reborn as "First Light," an onboarding that *builds the product as you use it* and then dissolves (§8).
- **The persistent, control-heavy header.** Shrinks to near-nothing: the Ask trigger and the account. Content-first.
- **Card-on-card nesting, boxed everything.** The Brief is mostly *unboxed* — type and space on the page, not a grid of containers. Cards are used only where a thing is genuinely a discrete, tappable object.

If a component survives, it must earn its place by serving one of the three
surfaces. Everything average dies here.

---

## 3. The Spine — navigation reinvented

The filing cabinet is the disease. The cure is two layers: a **quiet rail** for
the handful of things used daily, and a **command spine** for the infinite rest.

### 3a. The Rail — calm, minimal, ~6 destinations

```
┌──────────┐
│  ◐  Today│   ← The Brief (home)
│  ▤  Sales│
│  ₪  Money│   (invoices, payments, debts)
│  ⬚  Stock│   (products, inventory)
│  ☺  People│  (customers)
│          │
│  ─────── │
│  ✦  Ask  │   ← the Spine trigger, always present, Iris-lit
└──────────┘
```

Only *real, shipped* surfaces appear. No "coming soon." No 40-item tree. The rail
is quiet — generous spacing, a single active indicator (a soft Saffron mark), no
visual noise. It is furniture, not a feature.

The ~40 unbuilt modules do **not** live here. They live behind **one** discreet
"Everything" browse view (a calm directory you visit rarely), and — more
importantly — behind the Spine. You don't *navigate* to the rare thing. You *ask*
for it.

### 3b. The Spine — Ask & Act (⌘K, or the center tab on mobile)

The single most important reinvention. One gesture summons a spotlight that is
**navigation + action + AI, unified**:

```
        ╭────────────────────────────────────────────╮
        │  ✦   Ask or do anything…                    │
        ├────────────────────────────────────────────┤
        │   ↳  New sale                                │  ← ACT (verbs)
        │   ↳  Record a payment                        │
        │   ─────────                                  │
        │   ↳  Show overdue invoices                   │  ← NAVIGATE (destinations)
        │   ↳  Go to Stock                             │
        │   ─────────                                  │
        │   ✦  "How much does Ahmed owe me?"           │  ← ASK (AI, answers with real UI)
        ╰────────────────────────────────────────────╯
```

This is why the rail can be tiny: the product feels *infinite* without *looking*
cluttered. A shopkeeper types "sale," a power user types anything. It is
Raycast's power with a greeting a non-technical owner understands ("Ask or do
anything"). The existing Command Center is the seed of this; it grows from
"AI launcher" into the product's spine.

---

## 4. The Brief — the home, in detail

Not a grid. An **editorial column** with rhythm: it reads top to bottom like a
short, calm morning briefing. Generous vertical space. One thing at a time.

### 4a. Desktop layout

```
┌────────┬──────────────────────────────────────────────────────────┐
│  RAIL  │                       THE BRIEF                            │
│        │                                                            │
│ ◐ Today│   Good morning, Ahmed.                    Thu · 18 Jul     │  ← greeting + date, large, warm, human
│ ▤ Sales│                                                            │
│ ₪ Money│   ──────────────────────────────────────────────────      │
│ ⬚ Stock│                                                            │
│ ☺ People│  Business is calm today. One thing needs you.            │  ← THE SENTENCE: today's state in one human line
│        │                                                            │     (rule-composed from real signals; AI-phrased)
│        │                                                            │
│ ─────  │   NEEDS YOU · 1                                            │
│ ✦ Ask  │   ╭──────────────────────────────────────────────────╮    │
│        │   │  ⚠   Ahmed Traders — invoice #1042                 │    │  ← 0–3 real, resolvable items.
│        │   │      3 days overdue · 45,000 YER      [ Remind → ]│    │     each is ONE tap to act. real data only.
│        │   ╰──────────────────────────────────────────────────╯    │
│        │                                                            │
│        │   TODAY SO FAR                                             │
│        │                                                            │
│        │   Revenue            Sales            New customers        │  ← SIGNALS: living figures, not boxed cards
│        │   84,500 YER         12               2                    │     big tabular number
│        │   ▁▂▃▅▆▇   ↑ ahead   ▁▁▂▃▃  steady    ▁▁▁▂   +2            │     breathing sparkline + one-line "so what"
│        │                                                            │
│        │   THE PULSE                                                │
│        │   ┌────────────────────────────────────────────────────┐  │  ← THE one chart. done exceptionally.
│        │   │   revenue · last 30 days                    ╱╲      │  │     calm area line, warm fill,
│        │   │                                      ╱╲╱╲╱╲╱   ╲_   │  │     one hovered point, no chartjunk.
│        │   │   ___________________________╱╲__╱              ╲__ │  │
│        │   └────────────────────────────────────────────────────┘  │
│        │                                                            │
└────────┴──────────────────────────────────────────────────────────┘
```

Read the hierarchy: **sentence → what needs you → how today is going → the
trend.** That is exactly the Constitution's order — *Am I okay? What matters?
What next?* — made into a layout. The owner understands their business before
scrolling.

### 4b. The two states — and the calm one is a *reward*

**When something needs attention:** the "Needs You" block is present, specific,
and each item resolves in one tap (Remind, Restock, Review).

**When nothing needs attention** — the state ERPs never design for — the Brief
becomes a moment of genuine calm:

```
        Good morning, Ahmed.                    Thu · 18 Jul
        ──────────────────────────────────────────────────

              Everything is handled. Nothing needs you.

              ◜  a quiet, breathing mark  ◝

        TODAY SO FAR
        Revenue 84,500 ▁▂▃▅▆   Sales 12 ▁▁▂▃▃   ...
```

"Nothing needs you" is one of the best things software can ever say to a stressed
owner. We frame it as the reward it is — not an empty box, a exhale.

### 4c. Mobile — this is the *primary* screen (phone-first user)

The single-column Brief is already mobile-perfect. The rail becomes a **bottom
tab bar** (thumb-reachable), with **Ask at the center** as the hero action:

```
┌───────────────────────┐
│ Good morning, Ahmed ✦ │
│ Thu · 18 July         │
│───────────────────────│
│ Business is calm.     │
│ One thing needs you.  │
│                       │
│ ╭───────────────────╮ │
│ │⚠ #1042 · 45,000   │ │
│ │  3d overdue       │ │
│ │        [Remind →] │ │
│ ╰───────────────────╯ │
│                       │
│ TODAY SO FAR          │
│ Revenue  84,500       │
│ ▁▂▃▅▆▇  ↑ ahead       │
│ Sales 12  ·  New 2    │
│                       │
│ THE PULSE             │
│ ┌───────────────────┐ │
│ │      ╱╲╱╲╱  ╲__    │ │
│ └───────────────────┘ │
│───────────────────────│
│  ◐    ▤   (✦)   ₪   ⬚ │  ← bottom tabs; Ask is the raised center
└───────────────────────┘
```

### 4d. RTL

The entire Brief mirrors natively (it already uses logical properties). The rail
moves to the right in Arabic; the reading flow becomes right-to-left; sparklines
and the pulse chart flip their time-axis so "now" sits on the leading edge. Arabic
is not a translation of this design — it is an equal rendering of it.

---

## 5. Signals — metrics that are alive, not boxed

Constitution: *never show a number without meaning.* The stat-card dies. Its
replacement is the **Signal** — a living figure, unboxed, woven into the Brief:

```
   Revenue                          ← label, quiet, muted
   84,500 YER                       ← the number: large, bold, tabular (never jitters)
   ▁▂▃▅▆▇                           ← a breathing sparkline (the day's shape)
   ↑ 12% ahead of yesterday         ← the "so what": one line, semantic tone (green ahead / warm behind)
```

Anatomy laws:
- **Tabular numerals, always.** A figure that shifts width as it updates is the tell of amateur work. Ours hold perfectly still (Constitution ch.16 — the stillness of our numbers is part of feeling premium).
- **The sparkline breathes.** Not decoration — it shows the *shape* of today (a slow morning, a busy afternoon) at a glance. It animates in once, calmly, then rests.
- **Every Signal ends in a sentence.** The comparison is the meaning. A number alone is trivia.
- **Signals are unboxed.** They sit on the page as type, in a rhythm — not five bordered cards in a row. The boxing is what makes current dashboards feel like a control panel.

---

## 6. The Pulse — the one chart, done exceptionally

The product has **zero** data visualization today. We do not fix that with ten
charts. We add **one**, and make it the most beautiful chart in any ERP:

```
   revenue · last 30 days                              ▲ 84,500 on Jul 18
   ┌──────────────────────────────────────────────────────────────┐
   │                                                    ╱•╲         │   • a single hovered point,
   │                                          ╱╲   ╱╲╱╲╱    ╲       │     with a calm callout
   │                                    ╱╲╱╲╱   ╲ ╱                 │
   │            ___________╱╲______╱╲╱╲╱          ╲__               │   soft warm area fill under the line
   │  ________╱╲                                                    │   (Saffron at very low opacity)
   └──────────────────────────────────────────────────────────────┘
     Jun 18                          Jul 3                    Jul 18
```

Laws: no gridlines-as-cage, no axis clutter, no legend for one series. A single
calm line, a warm whisper of fill beneath it, one point revealed on hover with a
quiet callout, tabular numbers. It respects reduced-motion (no draw-on animation
for users who ask for less). It is powered by the **real** `/reports` data. One
chart, flawless, beats a wall of charts — and it is the moment that makes someone
say "wait, this is an ERP?"

---

## 7. The AI experience — a sense, not a page

`/dashboard/ai` (the chat page) is demoted to a "history" archive. AI lives in
**two** ambient places instead:

**7a. In the Spine** (§3b) — the primary way to ask. And critically, **AI answers
with the product's own components, never prose**:

```
   You:  who owes me money?

   ✦     3 customers owe you 118,000 YER
         ┌────────────────────────────────────────────┐
         │  Ahmed Traders        45,000 YER    ● 3d    │   ← real, tappable rows —
         │  Sara Market          52,000 YER    ● 1d    │     the SAME components the
         │  Khalid Store         21,000 YER      ok    │     Money view uses. Not a
         └────────────────────────────────────────────┘     paragraph describing a list.
         [ Remind all ]     [ Open in Money → ]
```

The tool results already return structured data (`AIToolCallResult`); today the
frontend throws it away and shows only the prose summary. We render it as native
UI. *This* is what makes AI feel like part of the operating system rather than a
chatbot bolted on — you ask, and the business answers, in the business's own
shapes.

**7b. Inline, contextually** — an "✦ Ask about this" affordance on any record
(an invoice, a customer). It opens the Spine *pre-seeded* with that context
(the `seedContext` plumbing already exists, unused). "Ask about this customer" →
their history, debts, patterns, in native UI. The AI is wherever you are.

The Brief's opening **sentence** (§4a) is itself lightly AI-composed: given the
day's real signals, one calm human line. The intelligence is woven through the
product, never sitting in a corner.

---

## 8. Onboarding — "First Light"

The empty product is the most important screen a new owner ever sees. Kill the
permanent progress card. Replace with **First Light**: the product greets the
owner and *builds itself* as they use it.

```
   Day 0, empty account:

        Welcome, Ahmed. Let's bring your business to light.

        Your Brief is empty because your business is new here.
        Add one thing and watch it come alive.

        ╭─────────────╮  ╭─────────────╮  ╭─────────────╮
        │  ＋ Product  │  │  ＋ Customer │  │  ＋ First    │
        │             │  │             │  │    sale      │
        ╰─────────────╯  ╰─────────────╯  ╰─────────────╯
```

Each first action lights up a part of the Brief with a small, warm moment (the
first sale makes the Pulse draw its first line — a genuine, earned delight, shown
once). As the business fills in, First Light *recedes and dissolves* — it is
scaffolding, not furniture. It never becomes a permanent nag. The owner graduates
from it without noticing, which is the point.

---

## 9. States — every empty, loading, error moment is designed

- **Loading = the shape of the Brief.** Skeletons that are the *silhouette* of the
  briefing (a greeting line, a Needs-You slot, three Signals, the Pulse) — the
  owner recognizes the page before it arrives. Never a spinner in a void.
- **Empty = an invitation or a reward.** New-business empty → First Light (§8).
  Nothing-needs-you empty → the calm reward (§4b). We never fill emptiness with a
  lie (no sample rows, ever).
- **Error = a kind, plain sentence + a way out.** "Couldn't load your revenue —
  check your connection and retry." Never a code, never blame. In a product about
  money, a harsh error is cruel (Constitution ch.19). And a failure in one Signal
  never takes down the whole Brief — each piece degrades alone.

---

## 10. Typography, spacing, hierarchy — the quiet revolution

Colour is settled; *this* is where premium is actually built.

- **Hierarchy through scale + weight + space, not boxes.** The Brief has almost no
  borders. What creates order is a disciplined type scale and generous, rhythmic
  spacing. The greeting is large and light; section labels (`NEEDS YOU`, `TODAY
  SO FAR`) are small, quiet, tracked; the numbers are large and bold. The eye is
  led by contrast, not by container walls.
- **Vertical rhythm is the layout.** A consistent spacing scale (a calm 8-point
  rhythm) between sections gives the column its editorial breathing. Sections are
  separated by *space*, occasionally a hairline — never a card each.
- **Numbers are the signature.** Tabular everywhere. A dedicated, slightly tighter
  treatment for large figures. Money never jitters.
- **Arabic held to the identical standard.** Tajawal tuned to the same rhythm and
  hierarchy as the Latin face. The Brief in Arabic is as beautiful as in English,
  measured line for line.
- **One line length for prose, denser for data.** The sentence and copy stay
  readable (≤ ~70 characters); data can run denser.

---

## 11. Motion — "calm, and alive"

The signature feeling. Two words that seem opposed, reconciled:

- **Calm:** transitions are gentle cross-dissolves, never slides or bounces.
  Navigation between surfaces is a soft ~150ms fade — fast, quiet, weightless.
  High-frequency actions (opening the Spine, switching views) have *near-zero*
  motion; speed is the reward (Constitution ch.6, emil frequency framework).
- **Alive:** a few deliberate living moments. The sparklines breathe in once on
  load. The Pulse draws once, calmly, the first time it's seen in a session. The
  Spine summons like a spotlight (a soft scale-and-fade from the trigger). The
  "nothing needs you" mark breathes slowly. The first sale lights the Pulse.
  These are **rare** (first-of-session, milestone) — never on repeat, never in the
  way. Motion that communicates, never decorates.
- **Every animation respects reduced-motion** with a calm, still equivalent.

The product should feel like it is quietly *breathing* — present, alive, never
demanding. That aliveness, inside total calm, is a feeling no ERP has. It is the
"I've never seen an ERP like this."

---

## 12. What powers this — grounded, no fantasy

Every element above is drawn from data that already exists on the backend
(untouched, per instruction):

| Brief element | Real source |
|---|---|
| The sentence, Needs-You | low-stock (`/inventory/low-stock`), overdue invoices (`/invoices?status=ISSUED` + due date), setup state |
| Signals (revenue/sales/customers) | `/reports/dashboard` |
| The Pulse | `/reports` timeseries |
| Ask & Act (AI) | existing `/ai/chat` + `AIToolCallResult`, rendered as native UI |
| Views (Sales/Money/Stock/People) | existing sales/invoices/inventory/customers endpoints |

No fake data. No new backend. No business-logic change. The revolution is entirely
in the experience layer.

---

## 13. How we'd build it (path, not code — for a later approval)

Sequenced so each step ships something whole and beautiful, never a shell:

1. **The Brief, v1** — replace the dashboard home with the editorial column:
   the sentence, Needs-You (from the already-built AttentionList signals),
   Signals (reborn from KPI data), a calm empty/loading state. *Highest impact,
   no new deps.*
2. **The Pulse** — the one chart (a lightweight, themeable chart lib), powered by
   real `/reports` data.
3. **The Rail + Spine** — collapse the 50-item sidebar to the 6-destination rail;
   grow the Command Center into the Ask & Act spine.
4. **AI answers as native UI** — render `AIToolCallResult` as real components in
   the Spine; add "Ask about this" seeding.
5. **First Light** — the onboarding that builds and dissolves.
6. **Motion pass** — the breathing, the spotlight, the Pulse draw, reduced-motion.
7. **Views** — redesign Sales/Money/Stock/People as calm workspaces (a later arc).

Each phase is verifiable, RTL- and dark-complete, and honors "we never ship a
shell."

---

## The one-line pitch

**An ERP that greets you, tells you how your business is in one sentence, shows
you the single thing that needs you, and lets you ask it anything — then gets out
of your way. Calm, and alive. Nobody has seen an ERP like this, because nobody
built one that behaves like a companion instead of a filing cabinet.**

*Plan only. No code written. Awaiting your direction on whether to build The
Brief (Phase 1) first, or refine the vision further.*
