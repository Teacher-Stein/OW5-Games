/* Role Cards — unlocked by ticks, owned by the student, carried between teams. */
(function (global) {
  'use strict';
  var OW5 = global.OW5 = global.OW5 || {};

  var ROLES = {
    speaking: [
      { tier: 1, name: 'The Voice',       effect: 'Double points on one speaking answer.' },
      { tier: 2, name: 'The Diplomat',    effect: "Swap one of your questions with another team's." },
      { tier: 3, name: 'The Herald',      effect: 'Answer once for a teammate whose number was drawn.' },
      { tier: 4, name: 'The Orator',      effect: 'Every speaking answer your team gives scores +1, all game.' }
    ],
    listening: [
      { tier: 1, name: 'The Ear',         effect: 'Ask for one clue to be played again.' },
      { tier: 2, name: 'The Eavesdropper',effect: "Hear one other team's answer before you lock in yours." },
      { tier: 3, name: 'The Sentry',      effect: 'Freeze the threat or the timer for one full turn.' },
      { tier: 4, name: 'The Echo',        effect: 'Your team scores double on one listening round.' }
    ],
    comprehension: [
      { tier: 1, name: 'The Detective',   effect: 'Ask the teacher one yes / no question.' },
      { tier: 2, name: 'The Scholar',     effect: 'Skip one question and keep the points.' },
      { tier: 3, name: 'The Cartographer',effect: 'Reveal one hidden tile, trap or door.' },
      { tier: 4, name: 'The Oracle',      effect: 'Look at the next question before it is asked.' }
    ],
    writing: [
      { tier: 1, name: 'The Scribe',      effect: "Rewrite one teammate's sentence before it is marked." },
      { tier: 2, name: 'The Editor',      effect: 'Fix one error after marking, for half points.' },
      { tier: 3, name: 'The Quill',       effect: 'Your team gets 60 extra seconds on one writing task.' },
      { tier: 4, name: 'The Author',      effect: 'One written answer counts double.' }
    ]
  };

  var TRACK_COLOUR = {
    speaking: '#E63946',
    listening: '#3A8F75',
    comprehension: '#F18A2B',
    writing: '#D4A017'
  };

  /* Everything this student has unlocked, derived from their ticks.
     5 ticks in a track = the next card on that track. */
  function rolesFor(student) {
    var out = [];
    Object.keys(ROLES).forEach(function (track) {
      var unlocked = Math.floor((student.tracks[track] || 0) / 5);
      for (var i = 0; i < unlocked && i < ROLES[track].length; i++) {
        out.push({
          track: track,
          colour: TRACK_COLOUR[track],
          name: ROLES[track][i].name,
          effect: ROLES[track][i].effect,
          tier: ROLES[track][i].tier
        });
      }
    });
    return out;
  }

  /* Cards that would appear if this student gained `n` more ticks in a track —
     used to announce a new unlock at the end of a game. */
  function newlyUnlocked(before, after) {
    var b = {}, out = [];
    rolesFor(before).forEach(function (r) { b[r.name] = true; });
    rolesFor(after).forEach(function (r) { if (!b[r.name]) out.push(r); });
    return out;
  }

  function nextUnlock(student, track) {
    var t = student.tracks[track] || 0;
    var idx = Math.floor(t / 5);
    if (idx >= ROLES[track].length) return null;
    return { card: ROLES[track][idx], ticksAway: (idx + 1) * 5 - t };
  }

  OW5.roles = {
    ROLES: ROLES,
    TRACK_COLOUR: TRACK_COLOUR,
    rolesFor: rolesFor,
    newlyUnlocked: newlyUnlocked,
    nextUnlock: nextUnlock
  };
})(window);
