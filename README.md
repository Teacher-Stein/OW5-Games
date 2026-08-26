# Our World 5 — Team Games

A classroom game system for one Grade 5 class of about 35 students in four teams,
tracked individually across the whole year. Built for a **1366×768 desktop** plugged
into the classroom TV — every screen fits that resolution with no zooming and no
horizontal scrolling. The one exception is the Student Log, which scrolls down
through 35 rows by design; it is a marking screen, not something you show the class.

**No build step, no dependencies, no server required.** It is plain HTML, CSS and
JavaScript. Open `index.html` or publish the folder with GitHub Pages — both work.

---

## The idea in one paragraph

Students change seats every week, so team scores cannot be the long-term record.
There are two ledgers instead. The **Team Cup** is weekly and resets. The
**Student Log** is permanent: four skill tracks per student, and every 5 ticks in
a track unlocks a **Role Card** — a one-use power that belongs to the *student*,
not the team, and travels with them into whatever team they land in next week.
That is what makes weekly re-shuffling work in your favour rather than against you.

---

## Getting it online

```bash
# in the folder that contains index.html
git init
git add .
git commit -m "Our World 5 team games"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ow5-games.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**

A minute later it is live at `https://YOUR-USERNAME.github.io/ow5-games/`.
Open that on the classroom desktop, press F11 for fullscreen, and it fills the TV.

The `.nojekyll` file in the root is deliberate — it stops GitHub's site builder
from touching the folder.

---

## How a lesson runs

The homeroom teacher sets the seating, not you. So teams here are **scoring
containers**, not rosters — you never assign names to teams.

1. Walk in. The class is already seated in four groups.
2. Each team counts off 1, 2, 3… Set **Seats per team** on the Draw screen to match.
3. Play. When the app calls a number, that seat answers in every team at once.
4. Afterwards, tick students in the **Student Log** — search by name.

### First-time setup

1. **Class** — paste your class list, one name per line. Save. (Only needed for the
   Student Log; games never use it.)
2. **Save & Load** — download a backup. Do this at least once a term.

### Optional: assigned teams

If you ever *do* set the seating yourself, **This Week's Teams → Shuffle** assigns
everyone to a team while avoiding repeat pairings — see below. It is off the normal
path, but it is there.

### Keyboard shortcuts

| Key | Does |
|---|---|
| <kbd>D</kbd> | jump to the draw screen and draw immediately |
| <kbd>Space</kbd> | draw again (on the draw screen) |
| <kbd>1</kbd>–<kbd>4</kbd> | add a point to that team |

---

## Games

### The Thing in the Corridor — `games/corridor/`

Listening-first chase, about 20 minutes, four teams of any size. Twenty doors, four
lanes, and The Thing advancing one door every beat. Right answers move a team two
doors; noise moves The Thing an extra one, towards everyone. Caught teams become
The Chorus and keep playing by whispering wrong answers.

Each beat: read the clue once → everybody writes (timed) → draw a number → reveal
the answer → mark each team → next. <kbd>Space</kbd> advances, <kbd>1</kbd>–<kbd>4</kbd>
toggle a team right or wrong.

The seven special doors (5/11/17 locked, 8/14 dark, 12 mirror, 16 sanctuary) fire
when the beat reaches them, so the whole class experiences the corridor together.

## Why the shuffle is not random

Only relevant if you assign teams yourself. A random shuffle of 35 students into 4
teams keeps pairing the same people by chance. This one counts every pairing that has
already happened and searches for the arrangement with the fewest repeats. After six
weeks it typically reaches ~88% of all possible pairs having worked together at least
once, with no pair repeated more than about four times.

You can see the number on the Class tab.

---

## Where your data lives

In the browser's `localStorage`, on that computer, under the key `ow5.state.v1`.

That means: it survives closing the browser and restarting the machine, it is
**not** synced to any server, and it will not follow you to a different computer
or a different browser. Clearing site data wipes it.

So: **Save & Load → Download backup**, once a term at minimum. The backup is a
single `.json` file you can restore on any machine.

---

## Adding a new unit

Copy `packs/_TEMPLATE.js`, fill it in, and add one `<script>` line to
`index.html`. The games never change — only the packs do. See the comments
inside the template.

Unit content is written against
[Our World, Second Edition Level 5](https://eltngl.com/ourworld).

---

## Repo layout

```
index.html          the shell — teams, draw, log, backups
css/app.css         one stylesheet, sized for a TV
js/store.js         saved state, import/export
js/roles.js         Role Card definitions and unlock logic
js/teams.js         the anti-repeat shuffle, seat numbers, the draw
js/ui.js            DOM helper, toast, keyboard shortcuts
js/packs.js         content pack registry
js/app.js           the shell's screens
packs/              one file per unit
games/              one folder per game (see games/README.md)
games/corridor/     The Thing in the Corridor
docs/smoke.js       headless test of the shell
docs/smoke-corridor.js  plays a whole game, checks nothing overflows 1366×768
```

## Running the test

```bash
npm i -g playwright && npx playwright install chromium
python3 -m http.server 8123
node docs/smoke.js http://localhost:8123
node docs/smoke-corridor.js http://localhost:8123
```

The first fills in a class, shuffles six weeks of teams, draws, ticks a student to a
Role Card unlock, checks the state survives a reload, and asserts every screen fits
1366×768. The second plays a complete game of the corridor start to finish and fails
if any beat overflows the screen.

## Licence

MIT — see `LICENSE`.
