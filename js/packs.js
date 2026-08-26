/* Content packs.

   A pack is one unit's worth of questions. The GAMES never change; only
   packs do. They are plain .js files that call OW5.registerPack(...) rather
   than .json loaded with fetch, so the site also works when you open
   index.html straight from a folder with no web server. */
(function (global) {
  'use strict';
  var OW5 = global.OW5 = global.OW5 || {};
  var packs = [];

  function registerPack(p) {
    if (!p || !p.id) return;
    for (var i = 0; i < packs.length; i++) {
      if (packs[i].id === p.id) { packs[i] = p; return; }
    }
    packs.push(p);
  }

  function list() { return packs.slice(); }

  function get(id) {
    for (var i = 0; i < packs.length; i++) if (packs[i].id === id) return packs[i];
    return null;
  }

  /* Basic sanity check so a half-finished pack fails loudly at setup time
     rather than silently mid-lesson. */
  function validate(p) {
    var problems = [];
    if (!p.unit) problems.push('missing "unit"');
    if (!p.title) problems.push('missing "title"');
    if (!Array.isArray(p.clues) || p.clues.length < 1) problems.push('needs at least one clue');
    (p.clues || []).forEach(function (c, i) {
      if (!c.q || !c.a) problems.push('clue ' + (i + 1) + ' needs both q and a');
    });
    (p.locked || []).forEach(function (c, i) {
      if (!c.prompt) problems.push('locked door ' + (i + 1) + ' needs a prompt');
    });
    (p.dark || []).forEach(function (c, i) {
      if (!c.text || !c.q) problems.push('dark room ' + (i + 1) + ' needs text and q');
    });
    return problems;
  }

  OW5.registerPack = registerPack;
  OW5.packs = { list: list, get: get, validate: validate };
})(window);
