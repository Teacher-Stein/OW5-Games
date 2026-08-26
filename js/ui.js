/* Small shared UI helpers. No framework — this has to keep working
   untouched for nine months on a school desktop. */
(function (global) {
  'use strict';
  var OW5 = global.OW5 = global.OW5 || {};

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) {
      t = el('div', { id: 'toast' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* Download a file the browser generates itself. */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function readFile(input, onText) {
    var f = input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { onText(String(r.result)); };
    r.readAsText(f);
  }

  /* Keyboard shortcuts, skipped while the teacher is typing in a field. */
  function keys(map) {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var k = e.key === ' ' ? 'Space' : e.key;
      var fn = map[k];
      if (fn) { e.preventDefault(); fn(e); }
    });
  }

  OW5.ui = {
    el: el, $: $, $$: $$, clear: clear,
    toast: toast, download: download, readFile: readFile, keys: keys
  };
})(window);
