# Iteration log

## Gap table — Introducing Pond vs these films

Stills every half second from `pond-for-ai-agents.mp4` (38.7s) and `pond-bot-launch.mp4`, set next to Northstar, Lumen, and Relay. Scene changes in Introducing Pond land at about 2.7s, 4.8s, 12.2s, 14.9s, 28.7s, and 37.0s.

| | Pond | Us, before this pass | Fix |
|---|---|---|---|
| Cuts | 2–8 seconds. The long card scene never sits still. | Scenes held 6–10 seconds with a camera that only moved on the cut. | Zoom-through on every cut (scale 1.10 to 1, 680 ms). Then a slow push, about 0.7% a second, so no frame is frozen. |
| Type | Words bigger than the frame, one letter at a time, often cropped. | A sentence in a pill or a note, one word at a time. | Names and the closing URL are per letter (45 ms). Body lines are still per word, and each word rises 18 px. |
| Layers | Several things move at once: type, cards, glow. | One layer, then a stop. | Grid at 0.62 of the camera, glow at 0.32, specks drifting, free cards drifting a few pixels. 2D only. |
| Transitions | Match from a huge word into a field of cards, or into a full-bleed gradient. | A vertical slide. | The slide stays, and the frame punches in on the cut. |
| UI | A ring of a dozen product cards, or a dense screen. | Three cards, or a plain step list. | Lumen is eight cards. Relay’s board is six cards, wires, a moving dot, and a cursor that lands on Live. |
| Colour | White, then a full-bleed gradient, then white again. One hue. | Mostly flat grey. The gradient had a dark seam down the middle. | Smooth radial gradient. Grid and a soft glow show through the light scenes. |
| Close | A large word and a short URL. | A small grey name. | 84 px name, the URL in letters, a short rule. |

What we still do not copy: cards tilted in space, photos of people, real company logos we do not have, and numbers presented as a customer’s results. Avatars stay initials. One “Sample product” badge.

## Pass 1 — shared camera and the two weak scenes

Encoded the table in `packages/engine/src/motion.js`, `docs/motion-craft.md`, and the film runtime. Lumen’s three corner cards became eight. Relay’s plain nodes became a board with wires and a traveler that keeps moving after the path.

Stills at the glass scene showed a hard vertical seam. Relay’s title sat under the badge. Several cards were mostly empty white.

Scores against Introducing Pond: Northstar 8, Lumen 7.5, Relay 7.5.

## Pass 2 — seam, badge, empty cards

The glass scene is one radial gradient. The board starts below the badge. Light scenes no longer paint an opaque grey over the grid. Stat numbers sit large in the card instead of in a corner. Person cards gained a line and a meter.

Scores: Northstar 8.5, Lumen 8.5, Relay 8.

## Pass 3 — initials and copy-paste logs

“The snag” was marked TH, because the two letters were taken from “The”. Every Relay card said “9:02 Opened”. The mark is now SN, and each card has its own times.

Score: Relay stays 8. The board is no longer a repeated stamp. It is still a grid, not Pond’s loose ring of cards.

## Pass 4 — end card

The closing name was 26 px and grey. It is 84 px ink, with the URL under it and a short rule. The Relay cursor was short of the Live pill. It now finishes on the pill, and the click is on that beat.

Scores unchanged: 8.5 / 8.5 / 8. The end card is no longer the weak frame.

## Pass 5 — full films

All three samples rendered to mp4 with effects only, mixed near −22. Stills pulled from those files match the frames above. Further layout tweaks were getting small.

Honest scores next to Introducing Pond: **Northstar 8.5, Lumen 8.5, Relay 8.**

None of those five passes was a 9. The named gap was cropped type and a loose ring of cards.

## Pass 6 — cropped type and a card ring

A word larger than the frame now slides behind the headline and scales up on the sound hit. The headline stays sharp. Lumen’s cards left the grid for a ring: smaller blurred cards behind, one sharp card in front. The layout comes from a hash of the brief, so two briefs do not share a frame.

Stills: the big word was right, and the headline was readable. The front card was cut off the bottom edge. Relay’s cursor still aimed at the old corner, so it missed Live.

Scores: Northstar 8.5, Lumen 8, Relay 8.

## Pass 7 — the front card stays on screen

The front card is pinned inside the frame. Relay’s cursor aims at whichever card is Go live, and the count finishes at “6 closed”.

Stills: Approve is on screen. The cursor sits on Live. One back card still showed only “Rahman”, the rest of the name tucked under the front card.

Scores: Northstar 8.5, Lumen 8.5, Relay 8.5.

## Pass 8 — no sliced names

A back card that would sit under the front card is pushed out, so the name stays whole. Ari Rahman is a full card. Approve still reads.

Score did not move. Northstar 8.5, Lumen 8.5, Relay 8.5.

## Pass 9 — stop

Another pass over the same frames. The ring, the cropped word, and the Relay close are doing the job they were built for. Tightening the overlap further would turn the ring back into a grid. That is not a gain.

Scores stay 8.5, 8.5, 8.5. Two passes with no movement, so this stops.

Still not a 9. Pond’s cards are busier, and its type is sometimes the whole frame with no second line under it. Ours keep a readable headline on top of the big word, and the front card is a real control (Approve, or Live) rather than a poster. A paid film should still be finished by a person.

## Critique pass — copy, colour, type size

The stills were read as about 7: pale, empty, and one broken line.

### Round 1

“You get Brand-matched” is now rejected by a test. Benefit lines are verb-led and at most six words (“Match the brand”, “Share one board”). The title scenes moved onto a deep brand field. Relay’s six small cards became one large card the film pushes through. The sample pill only shows for the first and last 1.5 seconds.

The lower half of the Northstar title was still empty. Lumen’s name sat on top of a card. Relay’s card was one line in a white void.

Scores against this critique: Northstar 7.5, Lumen 7.5, Relay 7.5.

### Round 2

The Northstar card sits on the right, opposite the name. Lumen’s name has the left side to itself. Relay’s card lists every step in large type, and the cursor lands on the button.

Scores: Northstar 8, Lumen 8, Relay 8.

### Round 3

Two Lumen cards were stacked on the same title. They are separated. Relay’s board had sat still for about ten seconds after the click. The queue now walks a highlight down the rows, and the closing card reveals a line at a time. A frame check every 0.8 seconds found no frozen stretch.

Scores stayed 8. The pictures are fuller, not a different film.

### Round 4

The big background word on the Northstar title was gone before the card arrived, so the top went blank. It now keeps sliding until the card is up.

Score stays 8, 8, 8. What is still weak: the product screen is still a white dashboard, and a few cards are plainer than a Pond card. Not a 9.

## Last round — motion, not slides

### Round 1

Relay’s list was 18px because a later rule overrode the 30px, inside a card that was mostly empty. The card is now a step list with checks, a progress bar, and a button, and the type is 32px. The title card is a small product: an inbox row, a toggle, and a chart that grows. The background word is a gradient with a thin stroke, at low opacity. Northstar’s sidebar is brand-coloured, the chart draws in, and the camera pushes into a highlighted row. Each film has a colour wipe on a cut. A checker samples every film at 2fps and fails if text is under 22px or a card’s content fills under 45%.

Scores: Northstar 8, Lumen 8, Relay 8.

### Round 2

The Relay button was still floating in white space. The card is shorter, so the button sits with the list. The checker passes.

Score did not move. 8, 8, 8.

### Round 3

All three films rendered. The stills match those frames. Still not a 9. The wipe is a simple colour pass, and the pictures are still built from the same parts. A paid film should still be finished by a person.
