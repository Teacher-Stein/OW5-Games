/* OW5 store — all persistent state lives here.
   Plain script, no modules, so the site works from GitHub Pages AND from a
   folder opened directly in the browser. */
(function (global) {
  'use strict';

  var OW5 = global.OW5 = global.OW5 || {};
  var KEY = 'ow5.state.v1';

  var TRACKS = ['speaking', 'listening', 'comprehension', 'writing'];

  var TEAM_META = [
    { name: 'Team 1', css: 't1', colour: '#E63946' },
    { name: 'Team 2', css: 't2', colour: '#3A8F75' },
    { name: 'Team 3', css: 't3', colour: '#F18A2B' },
    { name: 'Team 4', css: 't4', colour: '#D4A017' }
  ];

  function blankState() {
    return {
      version: 1,
      className: 'Grade 5',
      week: 1,
      students: [],      // {id, name, tracks:{}, mvp:0}
      teams: [[], [], [], []],
      scores: [0, 0, 0, 0],
      seatCount: 9,   // seats to draw from; the room is seated by the homeroom teacher
      seats: {},         // studentId -> seat number within their team
      pairings: {},      // "idA|idB" -> times they have been teammates
      cup: [],           // {week, unit, game, scores:[n,n,n,n]}
      lastSaved: null
    };
  }

  var state = blankState();
  var listeners = [];

  function uid() {
    return 's' + Math.random().toString(36).slice(2, 9);
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) state = migrate(parsed);
      }
    } catch (e) {
      console.warn('OW5: could not read saved state', e);
    }
    return state;
  }

  function migrate(s) {
    var base = blankState();
    Object.keys(base).forEach(function (k) {
      if (s[k] === undefined) s[k] = base[k];
    });
    (s.students || []).forEach(function (st) {
      st.tracks = st.tracks || {};
      TRACKS.forEach(function (t) {
        st.tracks[t] = Number(st.tracks[t]) || 0;
      });
      st.mvp = Number(st.mvp) || 0;
    });
    while (s.teams.length < 4) s.teams.push([]);
    return s;
  }

  function save() {
    state.lastSaved = new Date().toISOString();
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('OW5: could not save state', e);
    }
    listeners.forEach(function (fn) { fn(state); });
  }

  function subscribe(fn) { listeners.push(fn); }

  /* ------------------------------------------------------------ roster */

  function setRoster(names) {
    var byName = {};
    state.students.forEach(function (s) { byName[s.name.toLowerCase()] = s; });

    state.students = names.map(function (n) {
      var existing = byName[n.toLowerCase()];
      if (existing) return existing;
      var st = { id: uid(), name: n, tracks: {}, mvp: 0 };
      TRACKS.forEach(function (t) { st.tracks[t] = 0; });
      return st;
    });

    var live = {};
    state.students.forEach(function (s) { live[s.id] = true; });
    state.teams = state.teams.map(function (t) {
      return t.filter(function (id) { return live[id]; });
    });
    save();
  }

  function student(id) {
    for (var i = 0; i < state.students.length; i++) {
      if (state.students[i].id === id) return state.students[i];
    }
    return null;
  }

  /* ----------------------------------------------------------- ticks */

  function addTick(id, track, n) {
    var s = student(id);
    if (!s || TRACKS.indexOf(track) < 0) return;
    s.tracks[track] = Math.max(0, Math.min(20, (s.tracks[track] || 0) + (n || 1)));
    save();
  }

  function addMvp(id, n) {
    var s = student(id);
    if (!s) return;
    s.mvp = Math.max(0, (s.mvp || 0) + (n === undefined ? 1 : n));
    save();
  }

  function totalTicks(s) {
    return TRACKS.reduce(function (a, t) { return a + (s.tracks[t] || 0); }, 0);
  }

  /* ------------------------------------------------------ import / export */

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    var parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.students)) {
      throw new Error('That file does not look like a saved class.');
    }
    state = migrate(parsed);
    save();
    return state;
  }

  function reset() {
    state = blankState();
    save();
  }

  OW5.TRACKS = TRACKS;
  OW5.TEAM_META = TEAM_META;
  OW5.store = {
    get state() { return state; },
    load: load,
    save: save,
    subscribe: subscribe,
    setRoster: setRoster,
    student: student,
    addTick: addTick,
    addMvp: addMvp,
    totalTicks: totalTicks,
    exportJSON: exportJSON,
    importJSON: importJSON,
    reset: reset,
    uid: uid
  };
})(window);
