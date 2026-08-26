/* The shell: class list, weekly teams, the draw, the Student Log, backups.
   Games live in /games/* and read the same saved state. */
(function (global) {
  'use strict';

  var OW5 = global.OW5;
  var store = OW5.store;
  var teamsMod = OW5.teams;
  var roles = OW5.roles;
  var ui = OW5.ui;
  var el = ui.el, $ = ui.$, clear = ui.clear;

  var VIEWS = ['home', 'teams', 'draw', 'log', 'class', 'data'];

  var GAMES = [
    {
      id: 'corridor',
      title: 'The Thing in the Corridor',
      tag: 'Listening · 20 min',
      blurb: 'Four teams flee down a corridor. Right answers move you forward; the Thing ' +
             'moves one door closer every beat, and noise makes it faster.',
      href: 'games/corridor/',
      ready: true
    },
    {
      id: 'sabotage',
      title: 'Snakes & Ladders: Sabotage',
      tag: 'Any skill · 15 min',
      blurb: 'Ladders have to be earned by answering, and every team secretly places two ' +
             'traps on the board before play begins.',
      href: '#/home',
      ready: false
    },
    {
      id: 'vault',
      title: 'The Vault',
      tag: 'Writing · 20 min',
      blurb: 'Crack a four-digit code. One digit is released per completed writing task, ' +
             'marked against a rubric on screen.',
      href: '#/home',
      ready: false
    }
  ];

  /* ------------------------------------------------------------- routing */

  function route() {
    var hash = (location.hash || '#/home').replace('#/', '');
    if (VIEWS.indexOf(hash) < 0) hash = 'home';
    VIEWS.forEach(function (v) {
      var node = $('#v-' + v);
      if (node) node.classList.toggle('on', v === hash);
    });
    ui.$$('#tabs a').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#/' + hash);
    });
    render(hash);
  }

  function render(which) {
    renderChrome();
    if (which === 'home') renderHome();
    if (which === 'teams') renderTeams();
    if (which === 'draw') renderDraw();
    if (which === 'log') renderLog();
    if (which === 'class') renderClass();
    if (which === 'data') renderData();
  }

  function renderChrome() {
    $('#weekChip').textContent = 'Week ' + store.state.week + ' · ' + store.state.className;
  }

  /* ---------------------------------------------------------------- home */

  function ensureScores() {
    var s = store.state;
    if (!Array.isArray(s.scores) || s.scores.length !== 4) s.scores = [0, 0, 0, 0];
  }

  function renderHome() {
    ensureScores();
    var strip = $('#scoreStrip');
    clear(strip);

    OW5.TEAM_META.forEach(function (meta, i) {
      strip.appendChild(el('div', { class: 'score-cell ' + meta.css, style: 'border-color:' + meta.colour }, [
        el('div', { class: 'nm', text: meta.name, style: 'color:' + meta.colour }),
        el('div', { class: 'pt', text: String(store.state.scores[i]) }),
        el('div', { class: 'row', style: 'justify-content:center;margin-top:.4em' }, [
          el('button', { class: 'ghost', text: '−', onclick: function () { bump(i, -1); } }),
          el('button', { class: 'ghost', text: '+1', onclick: function () { bump(i, 1); } }),
          el('button', { class: 'ghost', text: '+5', onclick: function () { bump(i, 5); } })
        ])
      ]));
    });

    var s = store.state;
    var box = $('#statusBox');
    clear(box);
    var assigned = s.teams.reduce(function (a, t) { return a + t.length; }, 0);
    box.appendChild(el('p', {
      style: 'margin:.2em 0;font-size:var(--t3);font-weight:800',
      text: s.students.length + ' students · ' + assigned + ' in teams'
    }));
    if (!s.students.length) {
      box.appendChild(el('p', { class: 'warn', text: 'Add your class list first — Class tab.' }));
    } else if (!assigned) {
      box.appendChild(el('p', { class: 'warn', text: "No teams yet — shuffle them on This Week's Teams." }));
    } else {
      var mix = teamsMod.mixReport();
      box.appendChild(el('p', { class: 'hint', text:
        mix.pct + '% of all possible pairs have worked together at least once. ' +
        'Most repeated pairing: ' + mix.worst + '×.' }));
    }

    var tiles = $('#gameTiles');
    clear(tiles);
    GAMES.forEach(function (g) {
      tiles.appendChild(el('a', {
        class: 'tile' + (g.ready ? '' : ' soon'),
        href: g.ready ? g.href : '#/home'
      }, [
        el('div', { class: 'tag', text: g.ready ? g.tag : 'Not built yet' }),
        el('h3', { text: g.title }),
        el('p', { text: g.blurb })
      ]));
    });
  }

  function bump(i, n) {
    ensureScores();
    store.state.scores[i] = Math.max(0, store.state.scores[i] + n);
    store.save();
    renderHome();
  }

  function endWeek() {
    ensureScores();
    var s = store.state;
    var unit = prompt('Which unit did you play? (leave blank to skip)', '') || '';
    s.cup.push({
      week: s.week,
      unit: unit,
      scores: s.scores.slice(),
      when: new Date().toISOString().slice(0, 10)
    });
    s.week += 1;
    s.scores = [0, 0, 0, 0];
    store.save();
    ui.toast('Week saved. Now on week ' + s.week + '.');
    route();
  }

  /* --------------------------------------------------------------- teams */

  function renderTeams() {
    var wrap = $('#teamCards');
    clear(wrap);
    var s = store.state;

    if (!s.students.length) {
      wrap.appendChild(el('p', { class: 'warn', text: 'Add your class list first — Class tab.' }));
      $('#mixReport').textContent = '';
      return;
    }

    s.teams.forEach(function (team, i) {
      var meta = OW5.TEAM_META[i];
      var list = el('ol', {});
      team.forEach(function (id) {
        var st = store.student(id);
        if (!st) return;
        var mine = roles.rolesFor(st);
        list.appendChild(el('li', {}, [
          el('span', { text: st.name }),
          mine.length
            ? el('span', { class: 'chip', style: 'margin-left:.5em', text: mine.length + ' card' + (mine.length > 1 ? 's' : '') })
            : null
        ]));
      });
      wrap.appendChild(el('div', { class: 'team-card ' + meta.css }, [
        el('h3', {}, [meta.name, el('span', { class: 'chip', text: team.length + ' players' })]),
        list
      ]));
    });

    var mix = teamsMod.mixReport();
    $('#mixReport').textContent = mix.possible
      ? mix.met + ' of ' + mix.possible + ' possible pairs have met (' + mix.pct + '%).'
      : '';
  }

  /* ---------------------------------------------------------------- draw */

  var rolling = null;

  function seatRange() { return teamsMod.seatRange(); }

  function renderDraw() {
    $('#drawCaption').textContent =
      'Everybody writes. One is drawn. Seats 1–' + seatRange() + '.';
    var box = $('#seatCountBox');
    if (box) box.value = seatRange();
  }

  function doDraw() {
    if (rolling) return;
    var max = seatRange();

    var numNode = $('#drawNum');
    var namesNode = $('#drawNames');
    clear(namesNode);
    numNode.classList.add('rolling');

    var ticks = 0;
    rolling = setInterval(function () {
      numNode.textContent = String(1 + Math.floor(Math.random() * max));
      ticks++;
      if (ticks > 16) {
        clearInterval(rolling);
        rolling = null;
        var result = teamsMod.drawSeat();
        numNode.classList.remove('rolling');
        numNode.textContent = String(result.seat);
        showDrawn(result.students);
      }
    }, 70);
  }

  function showDrawn(rows) {
    var namesNode = $('#drawNames');
    clear(namesNode);
    rows.forEach(function (r) {
      namesNode.appendChild(el('div', {
        class: 'draw-name', style: 'border-color:' + r.team.colour
      }, [
        el('div', { class: 'team', text: r.team.name, style: 'color:' + r.team.colour }),
        el('div', { class: 'who', text: r.student ? r.student.name : '— empty seat —' })
      ]));
    });
  }

  /* ----------------------------------------------------------------- log */

  function renderLog() {
    var table = $('#logTable');
    clear(table);
    var s = store.state;
    var filter = ($('#logFilter').value || '').toLowerCase();
    var sortBy = $('#logSort').value;

    var seatOf = s.seats || {};
    var teamOf = {};
    s.teams.forEach(function (t, i) { t.forEach(function (id) { teamOf[id] = i; }); });

    var rows = s.students.filter(function (st) {
      return !filter || st.name.toLowerCase().indexOf(filter) >= 0;
    });

    rows.sort(function (a, b) {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'total') return store.totalTicks(b) - store.totalTicks(a);
      var ta = teamOf[a.id] === undefined ? 99 : teamOf[a.id];
      var tb = teamOf[b.id] === undefined ? 99 : teamOf[b.id];
      if (ta !== tb) return ta - tb;
      return (seatOf[a.id] || 99) - (seatOf[b.id] || 99);
    });

    var head = el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'Student' }),
        el('th', { class: 'n', text: 'Team' }),
        el('th', { class: 'n', text: 'Seat' })
      ].concat(OW5.TRACKS.map(function (t) {
        return el('th', { class: 'n', text: t.slice(0, 4).toUpperCase() });
      })).concat([
        el('th', { class: 'n', text: 'MVP' }),
        el('th', { class: 'n', text: 'Total' }),
        el('th', { text: 'Role Cards' })
      ]))
    ]);
    table.appendChild(head);

    var body = el('tbody', {});
    rows.forEach(function (st) {
      var ti = teamOf[st.id];
      var meta = ti === undefined ? null : OW5.TEAM_META[ti];
      var tr = el('tr', {}, [
        el('td', { text: st.name, style: 'font-weight:700' }),
        el('td', { class: 'n', text: meta ? String(ti + 1) : '–',
                   style: meta ? 'color:' + meta.colour + ';font-weight:800' : '' }),
        el('td', { class: 'n', text: seatOf[st.id] ? String(seatOf[st.id]) : '–' })
      ]);

      OW5.TRACKS.forEach(function (track) {
        var v = st.tracks[track] || 0;
        tr.appendChild(el('td', { class: 'n' }, [
          el('div', { class: 'row', style: 'justify-content:center;gap:4px;flex-wrap:nowrap' }, [
            el('button', { class: 'ghost', style: 'padding:.1em .5em', text: '−',
              onclick: function () { store.addTick(st.id, track, -1); renderLog(); } }),
            el('b', { text: String(v), style: 'min-width:1.6em;display:inline-block' }),
            el('button', { class: 'ghost', style: 'padding:.1em .5em', text: '+',
              onclick: function () { tickUp(st.id, track); } })
          ]),
          el('div', { class: 'bar', style: 'margin-top:4px' }, [
            el('i', { style: 'width:' + (v / 20 * 100) + '%;background:' + roles.TRACK_COLOUR[track] })
          ])
        ]));
      });

      tr.appendChild(el('td', { class: 'n' }, [
        el('div', { class: 'row', style: 'justify-content:center;gap:4px;flex-wrap:nowrap' }, [
          el('button', { class: 'ghost', style: 'padding:.1em .5em', text: '−',
            onclick: function () { store.addMvp(st.id, -1); renderLog(); } }),
          el('b', { text: String(st.mvp || 0) }),
          el('button', { class: 'ghost', style: 'padding:.1em .5em', text: '+',
            onclick: function () { store.addMvp(st.id, 1); renderLog(); } })
        ])
      ]));

      tr.appendChild(el('td', { class: 'n', text: String(store.totalTicks(st)), style: 'font-weight:800' }));

      var cards = roles.rolesFor(st);
      var cell = el('td', {});
      if (!cards.length) {
        cell.appendChild(el('span', { class: 'hint', text: 'none yet' }));
      } else {
        cards.forEach(function (c) {
          cell.appendChild(el('span', {
            class: 'chip', title: c.effect, text: c.name,
            style: 'margin:2px 4px 2px 0;border-color:' + c.colour + ';color:' + c.colour
          }));
        });
      }
      tr.appendChild(cell);
      body.appendChild(tr);
    });

    table.appendChild(body);
  }

  /* Ticking up can unlock a card — say so out loud, that is the whole point. */
  function tickUp(id, track) {
    var st = store.student(id);
    var before = JSON.parse(JSON.stringify(st));
    store.addTick(id, track, 1);
    var gained = roles.newlyUnlocked(before, store.student(id));
    if (gained.length) {
      ui.toast(st.name + ' unlocks ' + gained.map(function (g) { return g.name; }).join(' + ') + '!');
    }
    renderLog();
  }

  /* --------------------------------------------------------------- class */

  function renderClass() {
    var s = store.state;
    $('#rosterBox').value = s.students.map(function (st) { return st.name; }).join('\n');
    $('#classNameBox').value = s.className;
    $('#rosterCount').textContent = s.students.length + ' students saved';

    var mix = teamsMod.mixReport();
    var box = $('#mixDetail');
    clear(box);
    if (!mix.possible) {
      box.appendChild(el('p', { class: 'hint', text: 'Nothing to report yet.' }));
      return;
    }
    box.appendChild(el('div', { class: 'bar', style: 'height:14px;width:100%' }, [
      el('i', { style: 'width:' + mix.pct + '%;background:var(--teal)' })
    ]));
    box.appendChild(el('p', { class: 'hint', style: 'margin-top:.6em', text:
      mix.met + ' of ' + mix.possible + ' possible pairs have been teammates (' + mix.pct + '%). ' +
      mix.unmet + ' pairs have never worked together. No pair has been together more than ' +
      mix.worst + ' time' + (mix.worst === 1 ? '' : 's') + '.' }));
  }

  function saveRoster() {
    var names = $('#rosterBox').value.split('\n')
      .map(function (n) { return n.trim(); })
      .filter(function (n) { return n.length; });
    store.state.className = $('#classNameBox').value.trim() || 'Grade 5';
    store.setRoster(names);
    ui.toast(names.length + ' students saved.');
    renderChrome();
    renderClass();
  }

  /* ---------------------------------------------------------------- data */

  function renderData() {
    var s = store.state;
    $('#savedAt').textContent = s.lastSaved
      ? 'Last saved ' + new Date(s.lastSaved).toLocaleString()
      : 'Nothing saved yet.';

    var t = $('#cupTable');
    clear(t);
    t.appendChild(el('thead', {}, [
      el('tr', {}, [
        el('th', { class: 'n', text: 'Week' }),
        el('th', { text: 'Date' }),
        el('th', { text: 'Unit' })
      ].concat(OW5.TEAM_META.map(function (m) {
        return el('th', { class: 'n', text: m.name, style: 'color:' + m.colour });
      })).concat([el('th', { text: 'Winner' })]))
    ]));

    var body = el('tbody', {});
    if (!s.cup.length) {
      body.appendChild(el('tr', {}, [el('td', { colspan: '8', class: 'hint', text: 'No weeks recorded yet.' })]));
    }
    s.cup.slice().reverse().forEach(function (row) {
      var top = Math.max.apply(null, row.scores);
      var winners = [];
      row.scores.forEach(function (v, i) { if (v === top && top > 0) winners.push(OW5.TEAM_META[i].name); });
      body.appendChild(el('tr', {}, [
        el('td', { class: 'n', text: String(row.week) }),
        el('td', { text: row.when || '' }),
        el('td', { text: row.unit || '' })
      ].concat(row.scores.map(function (v) {
        return el('td', { class: 'n', text: String(v) });
      })).concat([
        el('td', { text: winners.length ? winners.join(' & ') : '–', style: 'font-weight:700' })
      ])));
    });
    t.appendChild(body);
  }

  /* ---------------------------------------------------------------- wire */

  function init() {
    store.load();
    ensureScores();

    $('#btnResetScores').addEventListener('click', function () {
      store.state.scores = [0, 0, 0, 0];
      store.save();
      renderHome();
    });
    $('#btnEndWeek').addEventListener('click', endWeek);
    $('#btnQuickDraw').addEventListener('click', function () { location.hash = '#/draw'; });

    $('#btnShuffle').addEventListener('click', function () {
      if (!store.state.students.length) { ui.toast('Add your class list first.'); return; }
      teamsMod.applyTeams(teamsMod.makeTeams({ teamCount: 4 }));
      ui.toast('New teams. Seat numbers handed out.');
      renderTeams();
    });
    $('#btnKeepTeams').addEventListener('click', function () {
      ui.toast('Teams unchanged.');
    });

    $('#btnDraw').addEventListener('click', doDraw);

    $('#seatCountBox').addEventListener('change', function () {
      var n = parseInt(this.value, 10);
      if (isNaN(n) || n < 2) n = 2;
      if (n > 20) n = 20;
      store.state.seatCount = n;
      store.save();
      renderDraw();
    });

    $('#logFilter').addEventListener('input', renderLog);
    $('#logSort').addEventListener('change', renderLog);

    $('#btnSaveRoster').addEventListener('click', saveRoster);

    $('#btnExport').addEventListener('click', function () {
      var name = 'ow5-' + store.state.className.replace(/\s+/g, '-').toLowerCase() +
                 '-week' + store.state.week + '.json';
      ui.download(name, store.exportJSON());
      ui.toast('Backup downloaded.');
    });

    $('#importFile').addEventListener('change', function () {
      var input = this;
      ui.readFile(input, function (text) {
        try {
          store.importJSON(text);
          ui.toast('Class restored.');
          route();
        } catch (e) {
          ui.toast('Could not read that file.');
        }
        input.value = '';
      });
    });

    $('#btnReset').addEventListener('click', function () {
      if (confirm('This erases the class list, every tick and every week. Continue?')) {
        store.reset();
        ui.toast('Erased.');
        route();
      }
    });

    ui.keys({
      'd': function () { location.hash = '#/draw'; setTimeout(doDraw, 120); },
      'D': function () { location.hash = '#/draw'; setTimeout(doDraw, 120); },
      'Space': function () { if (location.hash === '#/draw') doDraw(); },
      '1': function () { bump(0, 1); },
      '2': function () { bump(1, 1); },
      '3': function () { bump(2, 1); },
      '4': function () { bump(3, 1); }
    });

    global.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
