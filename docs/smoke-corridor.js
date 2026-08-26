/* Plays a full game of The Thing in the Corridor headlessly at the real
   classroom resolution (1366×768) and asserts nothing overflows the screen. */
const { chromium } = require('playwright');

const VP = { width: 1366, height: 768 };

async function overflow(page) {
  return page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth
  }));
}

(async () => {
  const base = process.argv[2] || 'http://localhost:8123';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VP });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(base + '/games/corridor/index.html');
  await page.waitForTimeout(200);
  console.log('setup title:', (await page.textContent('#setupTitle')).trim());
  await page.screenshot({ path: 'docs/shot-corridor-setup.png' });

  await page.click('#btnStart');
  await page.waitForTimeout(200);

  let beats = 0;
  let shotPlay = false, shotWrite = false, shotDraw = false, shotAnswer = false;

  while (beats < 30) {
    const playVisible = await page.isVisible('#v-play');
    if (!playVisible) break;
    beats++;

    const kind = (await page.textContent('#doorKind')).trim();
    const badge = (await page.textContent('#doorBadge')).trim();

    if (!shotPlay) { await page.screenshot({ path: 'docs/shot-corridor-clue.png' }); shotPlay = true; }
    if (kind.startsWith('Dark') && !shotAnswer) {
      await page.screenshot({ path: 'docs/shot-corridor-dark.png' }); shotAnswer = true;
    }

    // clue -> write
    await page.click('#controls button');
    await page.waitForTimeout(120);
    if (!shotWrite) { await page.screenshot({ path: 'docs/shot-corridor-timer.png' }); shotWrite = true; }

    // occasional noise strike
    if (beats === 3) await page.click('#noiseRow button:nth-child(1)');

    // write -> draw
    await page.click('#controls button');
    await page.waitForTimeout(1500);
    if (!shotDraw) { await page.screenshot({ path: 'docs/shot-corridor-draw.png' }); shotDraw = true; }

    // draw -> answer
    await page.click('#btnReveal');
    await page.waitForTimeout(120);

    // mark a varying number of teams right
    const rights = (beats % 4 === 0) ? 1 : 3;
    for (let t = 1; t <= rights; t++) {
      const btn = page.locator('.mark-btn').nth(t - 1);
      if (await btn.isVisible() && !(await btn.getAttribute('class')).includes('gone')) {
        await btn.click();
      }
    }
    await page.waitForTimeout(80);
    if (beats === 2) await page.screenshot({ path: 'docs/shot-corridor-mark.png' });

    const o = await overflow(page);
    if (o.scrollH > o.clientH + 2 || o.scrollW > o.clientW + 2) {
      errors.push(`OVERFLOW on ${badge} (${kind || 'normal'}): ` +
        `content ${o.scrollW}×${o.scrollH} vs viewport ${o.clientW}×${o.clientH}`);
    }

    // answer -> next beat
    await page.click('#controls button');
    await page.waitForTimeout(150);
  }

  console.log('beats played:', beats);
  const ended = await page.isVisible('#v-end');
  console.log('reached end screen:', ended);
  if (ended) {
    console.log('ending:', (await page.textContent('#endTitle')).trim());
    const rows = await page.$$eval('table.result tbody tr', trs =>
      trs.map(tr => Array.from(tr.children).map(td => td.textContent.trim()).join(' | ')));
    rows.forEach(r => console.log('  ', r));
    await page.screenshot({ path: 'docs/shot-corridor-end.png' });
  }

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors, no overflow');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
