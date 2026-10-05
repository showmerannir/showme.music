# shoWMe Tour Video: Brief for Claude Code

You are helping Ran (founder of shoWMe, not a developer) produce a 2 to 3 minute product tour video for beta testers, using HyperFrames. This is a TEST run on the current build of the app, not the final V3. Speed and learning matter more than perfection.

Ran does not write code. Explain each step in one or two plain sentences, tell him exactly what to click or type, and never assume he knows terminal commands.

---

## 0. Setup (do this first)

1. Check Node.js is installed (`node -v`). If not, guide Ran to install the LTS version from nodejs.org.
2. Install the HyperFrames skills:
   `npx skills add heygen-com/hyperframes --full-depth --yes`
3. Read the `hyperframes` entry skill, then `hyperframes-core`, `hyperframes-cli` and `hyperframes-media` before writing anything.
4. Create this project folder structure and tell Ran where it is on his computer:

```
showme-tour/
  BRIEF.md            (this file)
  recordings/         (Ran drops his screen recordings here)
  assets/             (logo, optional music, optional voiceover)
  video/              (the HyperFrames project you build)
```

5. Run `npx hyperframes init` inside `video/`.

---

## 1. Inputs from Ran

Ask Ran to put these files in place. Do not start rendering until at least 3 recordings exist; for any missing clip, use a placeholder card (dark background, scene title, "Recording coming") so the full timeline still renders.

**Screen recordings** in `recordings/`, one clip per scene, any length (you trim them):

| File name | What it shows |
| --- | --- |
| 01-dashboard.mov | Operator dashboard, slow scroll |
| 02-calendar.mov | Calendar, holds/confirmed/unavailable, create availability link (venue, then room) |
| 03-request.mov | A booking request, double-booking warning, Accept, event opens as Draft |
| 04-deal.mov | Deals tab, guarantee vs door, deposit, send; performer browser signs; event Confirmed |
| 05-event.mov | Event tabs: Details, Schedule, Riders, Team/Crew invite, Messages |
| 06-budget.mov | Budget Planner: tickets, a cost field, a deduction, break-even chart |
| 07-settlement.mov | Settlement: Financials from budget, recalculate, per-party statement; performer view; Finalize, Payout |
| 08-close.mov | Back to dashboard (short) |

Any common format is fine (.mov, .mp4). If a file has a different name, ask Ran which scene it is.

**Assets** in `assets/` (all optional for the test):
- `logo.svg` or `logo.png`: the shoWMe logo. If missing, use the text "shoWMe" in Instrument Serif.
- `music.mp3`: a background track (Ran is a musician and may use his own music). If missing, render without music.
- `voiceover.wav` or `.m4a`: Ran reading the script. If missing, generate a draft voiceover with the free local TTS option in `hyperframes-media` (Kokoro), so no paid account is needed. Tell Ran the AI voice is a placeholder and his own voice is better for the final.

---

## 2. Format

- 1920 x 1080, 30 fps, MP4.
- Total length 2:20 to 2:40.
- Render a DRAFT quality first (`npx hyperframes render --quality draft`), show Ran, then a final render after his feedback.
- Burned-in captions of the voiceover, bottom center, readable on a phone.
- A small chapter title in the top left of each scene (Calendar, Request, Deal, Event, Budget, Settlement).

---

## 3. Brand (use exactly, do not invent a style)

Dark mode first.

- Background: #0A0604. Surfaces: #110A07, #18100C. Raised: #221812. Lines: #2E2118.
- Text: #F5EDE2 primary; muted #B8A99B.
- Primary accent coral #EE5746 (dark #D63D2C, light #FF7A68).
- Secondary accent amber #FFC266 (#F4A046, #FFD98A).
- Success green #6FC97A.
- Role colors if useful: operator coral #EE5746, venue blue #6FA8E0, performer purple #B58BE0, agent green #6FC97A.
- Fonts (Google Fonts): Instrument Serif for titles, Inter Tight for captions and UI text, JetBrains Mono for any figures.
- Motion: calm and confident. Gentle zooms into the part of the screen being talked about, soft cross-fades between scenes. No flashy transitions.
- Place screen recordings inside a rounded frame with a subtle shadow on the dark background, slightly inset, so they look like a polished product shot.

---

## 4. Scenes and voiceover

Trim each recording to fit its slot. Where the voiceover mentions a specific element (a warning, a button, a chart), zoom toward it.

| # | Time | Clip | Voiceover |
| --- | --- | --- | --- |
| Intro | 0:00 to 0:03 | Logo card | (no voice) shoWMe logo, then the line "One show, every side." |
| 1 | 0:03 to 0:15 | 01-dashboard | "Every show has a venue, an act, a crew, and often an agent. Usually that means spreadsheets, endless email threads and one awkward talk about money. Here's one show, from first request to final payout, in shoWMe." |
| 2 | 0:15 to 0:33 | 02-calendar | "It starts in your calendar. Holds, confirmed shows and blocked nights, per room. Share an availability link, and artists and agents only see the dates that are really free." |
| 3 | 0:33 to 0:53 | 03-request | "A request comes in. shoWMe warns you if the date clashes. Accept it, and the event is created as a draft, with the performer already invited." |
| 4 | 0:53 to 1:18 | 04-deal | "Set the deal: here a guarantee against 70% of the door, with a deposit. Send it. On the performer's side, they review the exact same terms and sign. Both signatures in, the show is confirmed and the terms are locked." |
| 5 | 1:18 to 1:38 | 05-event | "Now everyone works on the same event. The schedule, riders and messages live in one place. Invite your crew and choose what they see: they get the schedule and their tasks, not your numbers." |
| 6 | 1:38 to 1:58 | 06-budget | "The budget planner is your forecast. Ticket revenue, costs, and who carries what. The break-even line shows exactly how many tickets you need." |
| 7 | 1:58 to 2:23 | 07-settlement | "After the show, settlement starts from your budget. Enter the actuals and shoWMe works out what every party is owed. Each side sees only their own statement. The performer approves, you finalize, and the payout is clear. No chasing, no disputes." |
| 8 | 2:23 to 2:33 | 08-close | "Your turn: create your first event and invite one collaborator. Inviting is free. Tell us what you think, it shapes what we build next." |
| End | 2:33 to 2:38 | End card | Logo, "shoWMe. The operative layer for live events." and a feedback line (ask Ran which channel: in-app, email or WhatsApp group). |

If the real voiceover runs longer or shorter, adjust scene lengths to the voice, not the other way around.

---

## 5. Language rules (strict)

- Never use an em dash anywhere (captions, titles, cards). Use a comma, colon or full stop.
- Never use the word "gig". Always "show" or "event".
- Call shoWMe "the operative layer for live events". Never "OS" or "operating system".
- Write the name as "shoWMe" (lowercase s, capital W and M).

---

## 6. Working with Ran

- After the first draft render, open the video for Ran and ask for feedback scene by scene.
- Keep a short `NOTES.md` in the project with what was changed in each round.
- If something fails (render errors, missing browser), run `npx hyperframes doctor` and explain the fix in plain words before doing it.
- This is a test of the workflow. At the end, write 5 lines in `NOTES.md`: what worked, what was hard, and what to change for the real V3 video.
