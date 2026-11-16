# StudySpace, hi-fi prototype

**Live:** https://isaacwalsham.github.io/studyspace/

CMP-6039A Human Computer Interaction, coursework 002, group G17.
A web app that helps UEA students find a free study space that suits how they work, and book group rooms.

## How to run it
Open the live link, or double-click `index.html`. There is nothing to install and no build step.
Sign in with any email ending in `@uea.ac.uk` and any password. **This is a prototype**, so:
- no real account is made, and no email or password is checked
- everything is saved only in your own browser (localStorage)
- busyness, rooms and taken slots are made-up data, and walking is simulated

Settings → About → **Reset all app data** starts again from the sign-in screen.

## What works
- **Find:** Filters and Sort sit side by side, the filters that are on show as chips underneath, and results are listed below. A big interactive map fills the rest of the screen: drag, scroll or pinch to zoom, and use the zoom buttons. Building names appear as you zoom in. The page never scrolls, only the results list does
- **Space details:** tapping a pin or a result slides a card up over the map and highlights the pin. It shows busyness, every feature as an icon and a word, the match score and how it's worked out, and a quieter alternative when the space is busy
- **Directions:** a simulated walk along the route on the same map. It warns you if the space fills up on the way, and asks how busy it is when you arrive
- **Book a Room:** uses the full width of the screen. Pick the number of people and the day along the top, then filter and sort with the same toolbar as Find. Rooms show as cards with their match score and a strip of the day's free times. Picking a room slides the cards to the left and opens a panel on the right with its details and times, where you can book it (on phones the panel slides in over the screen). Confirming shows a summary modal, and Undo is available afterwards
- **My Bookings:** upcoming bookings with directions and cancel (with undo), plus past bookings with "Book again"
- **Live busyness:** report how busy a space is (with a confirmation, undo and change), or ask for an update (a simulated reply arrives)
- **Settings:** profile picture (initials or an icon, in any colour), display name, accent colour, light/dark/auto theme, simulated location or a chosen starting point (walk times update), larger text, high contrast, reduce motion, filling-up alerts, about, and reset
- **Design system** (Settings → About → Design system, or `#/design`): every shared button, chip, tag, card, modal, menu, toast and banner, working, with when to use each one

**Writing style:** titles, buttons and labels use title case ("Book a Room"). Sentences, like descriptions and messages, use sentence case.

**Seed data:** 18 open study spaces and 12 bookable rooms, each placed on its real building using OpenStreetMap outlines. Busyness, seats and taken times are made up. Taken times are "seeded" from the room and date, so they stay the same every time you look.

## How "Best match" works
It has two steps, so it's easy to explain:
1. **Filter:** a best match must have **everything** you asked for, be within your walking limit, and be usable (not full, or for a room, have a free time that day). Everything else goes under "Other spaces" with what it's missing.
2. **Rank:** best matches are sorted by a **match score out of 100**, made of three parts, each scored from 0 to 1:

| Open spaces | Weight | Rooms | Weight |
|---|---|---|---|
| Free seats (1 − busyness) | 50 | Free times left that day | 50 |
| Short walk (1 − walk ÷ 15 min) | 30 | Short walk (1 − walk ÷ 15 min) | 30 |
| Up-to-date info (1 − minutes since update ÷ 30) | 20 | Right size (group ÷ capacity) | 20 |

For example, a space that's 20% busy, 6 minutes away and updated 3 minutes ago scores 0.8 × 50 + 0.6 × 30 + 0.9 × 20 = **76**. Each space's card has a "How is this worked out?" section showing its own breakdown. The code is `scoreParts` in `js/helpers.js`.

## Changes from our Lab 7 think-aloud test
| Issue found | What we changed |
|---|---|
| Filters not clearly labelled, and it was hard to tell which were on | Filters and Sort buttons side by side. The Filters button shows a count, and every filter that's on shows as a chip underneath, which you can tap to remove. Clear all has an undo |
| Best match showed rooms that didn't meet the filters | Best matches must meet **every** filter. Others are listed separately with what they're missing |
| Bookable rooms mixed with open spaces, and rooms too small still shown | A separate Book a room tab. The group size comes first, rooms that are too small are hidden, and a note says how many. Rooms show as square pins on the map |
| The busyness popup closed straight away, so people were unsure it worked | A confirmation step with Undo, Change my answer and Done |
| Undo after booking disappeared after 8 seconds (heuristic evaluation) | Undo stays until it's closed, and bookings can be cancelled any time |
| Icons only explained on hover, which touch screens can't do (heuristic evaluation) | Every icon has a text label |

## Files
| File | What it does |
|---|---|
| `index.html` | The page shell: top bar, tabs, toast, banner, modal |
| `css/style.css` | All styling: colour tokens first (accent, dark mode, high contrast), then shared components, then each screen |
| `js/data.js` | Made-up spaces, rooms, filters, places and choices |
| `js/store.js` | Saves and loads the user's data in localStorage |
| `js/helpers.js` | Icons, walk times, busyness, matching, the match score, booking days and times |
| `js/components.js` | Shared building blocks: buttons, chips, tags, the filter and sort toolbar, modals, menus, toasts, banners |
| `js/map.js` | Draws the campus map and makes it drag, zoom and respond to taps |
| `js/screens/*.js` | One file per screen: start, find, book, bookings, settings, design |
| | `app.js` also has `flipCards`, which makes cards slide to their new places when the layout changes |
| `js/app.js` | Picks the screen from the address (e.g. `#/find/lib2`) and holds every button action |
| `js/map-data.js` | Campus shapes from OpenStreetMap (© OpenStreetMap contributors, ODbL) |

Plain HTML, CSS and JavaScript with no libraries.

## AI use
Built with help from Claude (Anthropic), working from our own personas, requirements, mid-fi prototype and Lab 7 findings. Declared in the video and the reflective reports.
