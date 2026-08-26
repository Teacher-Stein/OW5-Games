/* The Thing in the Corridor.

   Numbers only — this game never needs the class roster. It calls a seat
   number and the room resolves who that is. Ticks for the Student Log are
   awarded afterwards in the shell, by name. */
(function (global) {
  'use strict';

  var OW5 = global.OW5;
  var ui = OW5.ui, el = ui.el, $ = ui.$, clear = ui.clear;
  var META = OW5.TEAM_META;

  var DOORS = 20;
  var START = 3;
  var SPECIAL = {
    5: 'locked', 11: 'locked', 17: 'locked',
    8: 'dark', 14: 'dark',
    12: 'mirror', 16: 'safe'
  };
  var KIND_LABEL = {
    locked: 'Locked door · write a full sentence',
    dark:   'Dark room · read it once only',
    mirror: 'Mirror · answer for the team behind you',
    safe:   'Sanctuary · The Thing cannot pass'
  };
  var WRITE_SECONDS = { locked: 60, dark: 40, normal: 30 };
  var ESCAPE_POINTS = [5, 3, 2, 1];

  var G = null;
  var timerHandle = null;
  var rollHandle = null;

  /* ------------------------------------------------------------- helpers */

  function kindOf(door) { return SPECIAL[door] || 'normal'; }

  function maxSeat() {
    return OW5.teams.seatRange();
  }

  function view(name) {
    ['setup', 'play', 'end'].forEach(function (v) {
      $('#v-' + v).classList.toggle('on', v === name);
    });
  }

  function running(i) { return G.status[i] === 'run'; }

  /* ---------------------------------------------------------------- setup */

  function fillPacks() {
    var sel = $('#packPick');
    clear(sel);
    var list = OW5.packs.list();
    if (!list.length) {
      sel.appendChild(el('option', { value: '', text: 'No packs loaded' }));
      $('#btnStart').disabled = true;
      return;
    }
    list.forEach(function (p) {
      sel.appendChild(el('option', { value: p.id, text: p.unit + ' — ' + p.title }));
    });
    sel.addEventListener('change', showPackSummary);
    showPackSummary();
  }

  function showPackSummary() {
    var p = OW5.packs.get($('#packPick').value);
    var box = $('#packSummary');
    clear(box);
    if (!p) return;

    var problems = OW5.packs.validate(p);
    $('#setupTitle').textContent = p.theme && p.theme.corridor ? p.theme.corridor : 'The Thing in the Corridor';
    $('#setupFlavour').textContent = (p.theme && p.theme.flavour) ||
      'Four teams. Twenty doors. Something behind you that never stops walking.';

    box.appendChild(el('p', { class: 'row', style: 'gap:8px' }, [
      el('span', { class: 'chip', text: 'The Thing is called ' + ((p.theme && p.theme.threat) || 'THE THING') }),
      el('span', { class: 'chip', text: (p.clues || []).length + ' clues' }),
      el('span', { class: 'chip', text: (p.locked || []).length + ' locked doors' }),
      el('span', { class: 'chip', text: (p.dark || []).length + ' dark rooms' }),
      el('span', { class: 'chip', text: 'seats 1–' + maxSeat() })
    ]));
    if (p.grammar) {
      box.appendChild(el('p', { class: 'hint', text: 'Grammar target: ' + p.grammar }));
    }
    if (problems.length) {
      box.appendChild(el('p', { class: 'warn', text: 'Check this pack: ' + problems.join('; ') }));
    }
  }

  function start() {
    var pack = OW5.packs.get($('#packPick').value);
    if (!pack) return;

    G = {
      pack: pack,
      beat: 1,
      pos: [START, START, START, START],
      thing: 0,
      status: ['run', 'run', 'run', 'run'],
      escaped: [],
      marks: [false, false, false, false],
      seat: null,
      noise: 0,
      clueI: 0, lockedI: 0, darkI: 0,
      current: null,
      phase: null
    };
    view('play');
    beginBeat();
  }

  /* --------------------------------------------------------------- content */

  function contentFor(door) {
    var p = G.pack, kind = kindOf(door);
    if (kind === 'locked' && p.locked && p.locked.length) {
      var l = p.locked[G.lockedI % p.locked.length];
      G.lockedI++;
      return { kind: kind, prompt: l.prompt, model: l.model };
    }
    if (kind === 'dark' && p.dark && p.dark.length) {
      var d = p.dark[G.darkI % p.dark.length];
      G.darkI++;
      return { kind: kind, text: d.text, q: d.q, a: d.a };
    }
    var c = (p.clues && p.clues.length) ? p.clues[G.clueI % p.clues.length] : { q: '—', a: '—' };
    G.clueI++;
    return { kind: kind === 'normal' ? 'normal' : kind, q: c.q, a: c.a };
  }

  /* ----------------------------------------------------------------- board */

  function drawBoard() {
    var board = $('#board');
    clear(board);

    board.appendChild(el('div', {}));
    var nums = el('div', { class: 'door-numbers' });
    for (var d = 1; d <= DOORS; d++) {
      var ncls = (SPECIAL[d] || d === DOORS) ? 'mark' : '';
      if (d === G.beat) ncls += ' now';
      nums.appendChild(el('span', {
        class: ncls,
        text: d === DOORS ? 'OUT' : String(d)
      }));
    }
    board.appendChild(nums);

    for (var t = 0; t < 4; t++) {
      var st = G.status[t];
      board.appendChild(el('div', {
        class: 'lane-label' + (st === 'run' ? '' : ' dead'),
        style: 'background:' + META[t].colour
      }, [
        el('span', {}, [
          META[t].name,
          el('span', { class: 'lane-tag', text: st === 'caught' ? 'CHORUS' : st === 'escaped' ? 'OUT' : 'door ' + G.pos[t] })
        ])
      ]));

      var lane = el('div', { class: 'lane' + (st === 'run' ? '' : ' out') });
      for (var dd = 1; dd <= DOORS; dd++) {
        var kind = SPECIAL[dd];
        var cls = 'door';
        if (kind) cls += ' special ' + kind;
        if (dd <= G.thing) cls += ' thing';
        else if (dd < G.pos[t]) cls += ' behind';
        if (dd === G.beat) cls += ' current';
        if (dd === G.pos[t] && st === 'run') cls += ' here';
        lane.appendChild(el('div', {
          class: cls,
          style: (dd === G.pos[t] && st === 'run') ? 'color:' + META[t].colour : null
        }));
      }
      board.appendChild(lane);
    }
  }

  /* ---------------------------------------------------------------- phases */

  function beginBeat() {
    G.current = contentFor(G.beat);
    G.marks = [false, false, false, false];
    G.seat = null;
    G.noise = 0;
    setPhase('clue');
  }

  function setPhase(p) {
    G.phase = p;
    drawBoard();
    renderStage();
    renderNoiseRow();
    $('#beatChip').textContent = 'Door ' + G.beat + ' of ' + DOORS +
      ' · The Thing at ' + G.thing;
  }

  function renderStage() {
    var body = $('#stageBody'), controls = $('#controls');
    clear(body); clear(controls);

    var c = G.current;
    var kind = c.kind;
    $('#doorBadge').textContent = 'DOOR ' + G.beat;
    $('#doorKind').textContent = KIND_LABEL[kind] || '';
    $('#doorKind').style.color =
      kind === 'locked' ? 'var(--gold)' :
      kind === 'dark' ? '#7f8dab' :
      kind === 'mirror' ? 'var(--coral)' :
      kind === 'safe' ? 'var(--teal)' : 'var(--mute)';

    var gap = Math.min.apply(null, G.pos.filter(function (p, i) { return running(i); })) - G.thing;
    $('#thingWarn').textContent = isFinite(gap)
      ? (gap <= 1 ? 'IT IS RIGHT BEHIND THEM' : gap <= 3 ? 'closing — ' + gap + ' doors' : '')
      : '';

    if (G.phase === 'clue') return renderClue(body, controls, c, kind);
    if (G.phase === 'write') return renderWrite(body, controls, kind);
    if (G.phase === 'draw') return renderDraw(body, controls);
    if (G.phase === 'answer') return renderAnswer(body, controls, c, kind);
  }

  function renderClue(body, controls, c, kind) {
    if (kind === 'locked') {
      body.appendChild(el('div', { class: 'clue', text: c.prompt }));
      body.appendChild(el('div', { class: 'prompt-sub',
        text: 'A full, correct sentence. Nothing less opens this door.' }));
    } else if (kind === 'dark') {
      body.appendChild(el('div', { class: 'passage', text: c.text }));
      body.appendChild(el('div', { class: 'clue', style: 'margin-top:.4em', text: c.q }));
      body.appendChild(el('div', { class: 'prompt-sub',
        text: 'Read it once. No repeats — unless someone spends The Ear.' }));
    } else {
      body.appendChild(el('div', { class: 'clue', text: c.q }));
      if (kind === 'mirror') {
        body.appendChild(el('div', { class: 'prompt-sub',
          text: 'Mirror door: each team gives the answer of the team behind them. The last team answers for the leader.' }));
      }
      if (kind === 'safe') {
        body.appendChild(el('div', { class: 'prompt-sub',
          text: 'Sanctuary. The Thing does not move this beat.' }));
      }
    }
    controls.appendChild(el('button', {
      class: 'primary big', text: 'Everybody writes →',
      onclick: function () { setPhase('write'); startTimer(kind); }
    }));
  }

  function renderWrite(body, controls, kind) {
    var secs = WRITE_SECONDS[kind] || WRITE_SECONDS.normal;
    body.appendChild(el('div', { class: 'timer calm', id: 'timerNum', text: String(secs) }));
    body.appendChild(el('div', { class: 'prompt-sub', text: 'Silence. Everyone writes — anyone could be the one.' }));
    controls.appendChild(el('button', {
      class: 'primary big', text: 'Draw the number →',
      onclick: function () { stopTimer(); setPhase('draw'); roll(); }
    }));
  }

  function startTimer(kind) {
    stopTimer();
    var left = WRITE_SECONDS[kind] || WRITE_SECONDS.normal;
    timerHandle = setInterval(function () {
      left--;
      var n = $('#timerNum');
      if (!n) { stopTimer(); return; }
      n.textContent = String(Math.max(0, left));
      n.className = 'timer ' + (left > 10 ? 'calm' : left > 5 ? 'warn' : 'late');
      if (left <= 0) stopTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  }

  function renderDraw(body, controls) {
    body.appendChild(el('div', { class: 'big-num rolling', id: 'bigNum', text: '?' }));
    body.appendChild(el('div', { class: 'prompt-sub', id: 'drawSub',
      text: 'Every team’s holder of this number answers. Boards up together.' }));
    controls.appendChild(el('button', {
      class: 'primary big', id: 'btnReveal', text: 'Reveal the answer →', disabled: 'disabled',
      onclick: function () { setPhase('answer'); }
    }));
  }

  function roll() {
    if (rollHandle) return;
    var max = maxSeat(), ticks = 0;
    var node = $('#bigNum');
    rollHandle = setInterval(function () {
      node.textContent = String(1 + Math.floor(Math.random() * max));
      if (++ticks > 15) {
        clearInterval(rollHandle); rollHandle = null;
        G.seat = 1 + Math.floor(Math.random() * max);
        node.textContent = String(G.seat);
        node.classList.remove('rolling');
        var b = $('#btnReveal');
        if (b) b.disabled = false;
      }
    }, 70);
  }

  function renderAnswer(body, controls, c, kind) {
    if (kind === 'locked') {
      body.appendChild(el('div', { class: 'prompt-sub', text: 'One correct sentence looks like:' }));
      body.appendChild(el('div', { class: 'model', text: c.model || '—' }));
      body.appendChild(el('div', { class: 'hint', style: 'margin-top:.4em',
        text: 'Any sentence that uses the target grammar correctly counts.' }));
    } else {
      body.appendChild(el('div', { class: 'answer', text: (kind === 'dark' ? c.a : c.a) || '—' }));
    }

    body.appendChild(el('div', { class: 'prompt-sub', style: 'margin-top:.6em',
      text: 'Number ' + G.seat + ' answered. Mark each team.' }));

    var grid = el('div', { class: 'mark-grid', style: 'margin-top:.8em' });
    META.forEach(function (m, i) {
      var alive = running(i);
      grid.appendChild(el('button', {
        class: 'mark-btn ' + (!alive ? 'gone' : G.marks[i] ? 'yes' : 'no'),
        style: 'border-color:' + m.colour,
        onclick: function () { if (alive) { G.marks[i] = !G.marks[i]; renderStage(); } }
      }, [
        el('span', { class: 'tname', text: m.name, style: 'color:' + (G.marks[i] ? '#04150f' : m.colour) }),
        el('span', { class: 'state', text: !alive ? '—' : G.marks[i] ? 'RIGHT +2' : 'wrong' })
      ]));
    });
    body.appendChild(grid);

    controls.appendChild(el('button', {
      class: 'primary big', text: 'Next beat →', onclick: resolveBeat
    }));
  }

  /* -------------------------------------------------------------- resolve */

  function resolveBeat() {
    // 1. correct answers move forward
    for (var i = 0; i < 4; i++) {
      if (running(i) && G.marks[i]) G.pos[i] = Math.min(DOORS, G.pos[i] + 2);
    }

    // 2. escapes happen before The Thing moves
    for (i = 0; i < 4; i++) {
      if (running(i) && G.pos[i] >= DOORS) {
        G.status[i] = 'escaped';
        G.escaped.push(i);
      }
    }

    // 3. The Thing advances — unless this was the sanctuary door
    if (kindOf(G.beat) !== 'safe') G.thing += 1;
    G.thing += G.noise;

    // 4. anyone it has reached is caught
    for (i = 0; i < 4; i++) {
      if (running(i) && G.pos[i] <= G.thing) G.status[i] = 'caught';
    }

    G.beat++;

    var stillRunning = G.status.some(function (s) { return s === 'run'; });
    if (!stillRunning || G.beat > DOORS || G.thing >= DOORS) return finish();
    beginBeat();
  }

  function renderNoiseRow() {
    var row = $('#noiseRow');
    clear(row);
    META.forEach(function (m, i) {
      row.appendChild(el('button', {
        class: 'ghost',
        style: 'border-color:' + m.colour + ';color:' + m.colour + ';padding:.35em .8em',
        text: String(i + 1),
        title: 'Noise strike against ' + m.name,
        disabled: running(i) ? null : 'disabled',
        onclick: function () { noiseStrike(i); }
      }));
    });
  }

  function noiseStrike(idx) {
    if (!G || G.phase === null || !running(idx)) return;
    G.pos[idx] = Math.max(0, G.pos[idx] - 1);
    G.noise += 1;
    ui.toast(META[idx].name + ' drops back a door. The Thing speeds up.');
    setPhase(G.phase);
  }

  /* ------------------------------------------------------------------ end */

  function finish() {
    stopTimer();
    view('end');

    var anyOut = G.escaped.length;
    $('#endTitle').textContent = anyOut
      ? (G.escaped.length === 4 ? 'Everybody made it out' : 'Some of you made it out')
      : ((G.pack.theme && G.pack.theme.threat) || 'The Thing') + ' caught everyone';

    var body = $('#endBody');
    clear(body);

    var points = [0, 0, 0, 0];
    G.escaped.forEach(function (teamIdx, place) {
      points[teamIdx] = ESCAPE_POINTS[place] || 1;
    });
    // survivors who never escaped but were never caught still get something
    for (var i = 0; i < 4; i++) {
      if (G.status[i] === 'run') points[i] = 1;
    }

    var table = el('table', { class: 'result' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: 'Team' }),
        el('th', { text: 'Ending' }),
        el('th', { class: 'n', text: 'Door' }),
        el('th', { class: 'n', text: 'Team Cup points' })
      ])])
    ]);
    var tb = el('tbody', {});
    META.forEach(function (m, i) {
      var ending = G.status[i] === 'escaped'
        ? 'Escaped — ' + ordinal(G.escaped.indexOf(i) + 1) + ' out'
        : G.status[i] === 'caught' ? 'Caught · joined the Chorus' : 'Still running when time ran out';
      tb.appendChild(el('tr', {}, [
        el('td', { text: m.name, style: 'color:' + m.colour + ';font-weight:800' }),
        el('td', { text: ending }),
        el('td', { class: 'n', text: String(G.pos[i]) }),
        el('td', { class: 'n', text: String(points[i]) })
      ]));
    });
    table.appendChild(tb);
    body.appendChild(table);

    body.appendChild(el('p', { class: 'hint', style: 'margin-top:1.2em', text:
      'Now award ticks in the Student Log: 1 listening tick to every student who answered ' +
      'correctly on their turn, 1 writing tick for a correct locked-door sentence, ' +
      '1 comprehension tick for a dark room. Then each team votes an MVP.' }));

    body.appendChild(el('div', { class: 'row', style: 'margin-top:1em' }, [
      el('button', {
        class: 'good', text: 'Add these points to the Team Cup',
        onclick: function () {
          var s = OW5.store.state;
          if (!Array.isArray(s.scores) || s.scores.length !== 4) s.scores = [0, 0, 0, 0];
          for (var k = 0; k < 4; k++) s.scores[k] += points[k];
          OW5.store.save();
          ui.toast('Added to the Team Cup.');
          this.disabled = true;
        }
      })
    ]));
  }

  function ordinal(n) {
    return n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : 'fourth';
  }

  /* ----------------------------------------------------------------- wire */

  function init() {
    OW5.store.load();
    fillPacks();

    $('#btnStart').addEventListener('click', start);
    $('#btnRules').addEventListener('click', function () {
      var p = $('#rulesPanel');
      p.hidden = !p.hidden;
    });
    $('#btnAgain').addEventListener('click', function () { view('setup'); });

    ui.keys({
      'Space': function () {
        if (!G) { return; }
        var b = $('#controls button');
        if (b && !b.disabled) b.click();
      },
      'n': noiseStrike,
      'N': noiseStrike,
      '1': function () { toggle(0); },
      '2': function () { toggle(1); },
      '3': function () { toggle(2); },
      '4': function () { toggle(3); }
    });
  }

  function toggle(i) {
    if (!G || G.phase !== 'answer' || !running(i)) return;
    G.marks[i] = !G.marks[i];
    renderStage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
