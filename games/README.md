# Games live here

Each game is its own folder with an `index.html`. A game page loads the shared
engine from `../../js/` and reads and writes the same saved class, so ticks
earned inside a game land straight in the Student Log.

The skeleton of a game page:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Game name</title>
  <link rel="stylesheet" href="../../css/app.css">
</head>
<body class="app">
  <!-- game markup -->

  <script src="../../js/store.js"></script>
  <script src="../../js/roles.js"></script>
  <script src="../../js/teams.js"></script>
  <script src="../../js/ui.js"></script>
  <script src="../../js/packs.js"></script>
  <script src="../../packs/unit02-history.js"></script>
  <!-- one line per pack -->
  <script src="game.js"></script>
</body>
</html>
```

What a game gets for free:

| Call | What it gives you |
|---|---|
| `OW5.store.state` | class list, this week's teams, seat numbers, scores |
| `OW5.teams.drawSeat()` | a seat number plus the four students holding it |
| `OW5.store.addTick(id, track, n)` | award ticks that persist to the Student Log |
| `OW5.store.addMvp(id)` | award an MVP star |
| `OW5.roles.rolesFor(student)` | the Role Cards that student is holding |
| `OW5.roles.newlyUnlocked(before, after)` | what to announce at the end |
| `OW5.packs.list()` / `.get(id)` | the unit content packs |
| `OW5.ui.el / toast / keys` | DOM helper, toast, keyboard shortcuts |

Then add the game to the `GAMES` array in `js/app.js` and set `ready: true`.
