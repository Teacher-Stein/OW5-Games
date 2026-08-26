/* Weekly team assignment + the random student draw.

   The shuffle is deliberately not random. Every week the students sit
   somewhere new, so the aim is to put people with teammates they have had
   LEAST often. Each pairing is counted; a new team assignment is chosen to
   minimise the total number of repeat pairings. */
(function (global) {
  'use strict';
  var OW5 = global.OW5 = global.OW5 || {};
  var store = OW5.store;

  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  function pairCount(state, a, b) {
    return state.pairings[pairKey(a, b)] || 0;
  }

  /* Cost of adding `id` to a team that already holds `members`. */
  function joinCost(state, id, members) {
    var c = 0;
    for (var i = 0; i < members.length; i++) c += pairCount(state, id, members[i]);
    return c;
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* One greedy pass: walk a shuffled roster, put each student in whichever
     team is (a) not yet oversized and (b) cheapest for them. */
  function onePass(state, ids, teamCount) {
    var teams = [];
    for (var i = 0; i < teamCount; i++) teams.push([]);
    var cap = Math.ceil(ids.length / teamCount);
    var total = 0;

    shuffled(ids).forEach(function (id) {
      var best = -1, bestCost = Infinity;
      for (var t = 0; t < teamCount; t++) {
        if (teams[t].length >= cap) continue;
        var cost = joinCost(state, id, teams[t]) * 100 + teams[t].length;
        if (cost < bestCost) { bestCost = cost; best = t; }
      }
      if (best < 0) best = 0;
      total += joinCost(state, id, teams[best]);
      teams[best].push(id);
    });

    return { teams: teams, cost: total };
  }

  /* Try a number of passes and keep the best one. Cheap, and much better
     than a single greedy run. */
  function makeTeams(opts) {
    opts = opts || {};
    var state = store.state;
    var teamCount = opts.teamCount || 4;
    var attempts = opts.attempts || 400;
    var ids = state.students.map(function (s) { return s.id; });
    if (!ids.length) return [[], [], [], []];

    var best = null;
    for (var i = 0; i < attempts; i++) {
      var r = onePass(state, ids, teamCount);
      if (!best || r.cost < best.cost) best = r;
      if (best.cost === 0) break;
    }
    return best.teams;
  }

  /* Commit an assignment: store it, hand out seat numbers, and record the
     pairings so next week's shuffle knows about them. */
  function applyTeams(teams) {
    var state = store.state;
    state.teams = teams;
    state.seats = {};

    teams.forEach(function (team) {
      team.forEach(function (id, i) { state.seats[id] = i + 1; });
      for (var a = 0; a < team.length; a++) {
        for (var b = a + 1; b < team.length; b++) {
          var k = pairKey(team[a], team[b]);
          state.pairings[k] = (state.pairings[k] || 0) + 1;
        }
      }
    });
    store.save();
  }

  /* How well mixed is the class so far? Returns the share of all possible
     pairs that have never been teammates, plus the worst repeat count. */
  function mixReport() {
    var state = store.state;
    var ids = state.students.map(function (s) { return s.id; });
    var possible = ids.length * (ids.length - 1) / 2;
    if (!possible) return { possible: 0, met: 0, unmet: 0, worst: 0, pct: 0 };

    var met = 0, worst = 0;
    for (var a = 0; a < ids.length; a++) {
      for (var b = a + 1; b < ids.length; b++) {
        var n = pairCount(state, ids[a], ids[b]);
        if (n > 0) met++;
        if (n > worst) worst = n;
      }
    }
    return {
      possible: possible,
      met: met,
      unmet: possible - met,
      worst: worst,
      pct: Math.round((met / possible) * 100)
    };
  }

  function largestTeam() {
    return store.state.teams.reduce(function (m, t) {
      return Math.max(m, t.length);
    }, 0);
  }

  /* How many seats to draw from.

     Stein does not set the seating — the homeroom teacher rearranges the class
     each week — so normally no roster is assigned to teams and this is simply
     the number the class counts off to at the start of the lesson. If teams
     HAVE been assigned in the app, the biggest team wins instead. */
  function seatRange() {
    var n = parseInt(store.state.seatCount, 10);
    if (n >= 2) return n;
    return largestTeam() || 9;
  }

  /* Draw one seat number. Every team's holder of that number answers,
     so a single draw serves all four teams at once. */
  function drawSeat() {
    var max = seatRange();
    if (!max) return null;
    var n = 1 + Math.floor(Math.random() * max);
    return { seat: n, students: studentsAtSeat(n) };
  }

  function studentsAtSeat(n) {
    var state = store.state;
    return state.teams.map(function (team, ti) {
      var id = team[n - 1];
      return {
        teamIndex: ti,
        team: OW5.TEAM_META[ti],
        student: id ? store.student(id) : null
      };
    });
  }

  OW5.teams = {
    makeTeams: makeTeams,
    seatRange: seatRange,
    applyTeams: applyTeams,
    mixReport: mixReport,
    drawSeat: drawSeat,
    studentsAtSeat: studentsAtSeat,
    largestTeam: largestTeam,
    pairCount: pairCount
  };
})(window);
