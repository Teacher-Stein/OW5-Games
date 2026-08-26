/* Headless smoke test: drives the shell the way a teacher would and
   screenshots each screen at TV resolution. Not shipped to students. */
const { chromium } = require('playwright');

const NAMES = ['Nguyen An','Tran Binh','Le Chi','Pham Dung','Hoang Em','Vu Phuong','Do Giang',
  'Bui Hoa','Dang Khanh','Ngo Lan','Duong Minh','Ly Nam','Ha Oanh','Cao Phuc','Dinh Quyen',
  'Truong Son','Mai Thu','Phan Uyen','Ta Viet','Luu Xuan','Chu Yen','Ho Anh','Trinh Bao',
  'Quach Cuong','Kieu Diep','Lam Duc','Nghiem Giang','Doan Ha','To Hieu','Vo Khoa','Thai Linh',
  'Chau My','Uong Ngoc','Hua Phat','Bach Quang'];

(async () => {
  const base = process.argv[2] || 'http://localhost:8123';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(base + '/index.html');

  // class list
  await page.click('a[href="#/class"]');
  await page.fill('#rosterBox', NAMES.join('\n'));
  await page.fill('#classNameBox', 'Grade 5B');
  await page.click('#btnSaveRoster');
  await page.waitForTimeout(300);
  const count = await page.textContent('#rosterCount');
  console.log('roster:', count.trim());

  // teams — shuffle several weeks so the mixing logic gets exercised
  await page.click('a[href="#/teams"]');
  for (let w = 0; w < 6; w++) {
    await page.click('#btnShuffle');
    await page.waitForTimeout(120);
  }
  const mix = await page.textContent('#mixReport');
  console.log('mix:', mix.trim());
  const teamSizes = await page.$$eval('#teamCards .team-card ol',
    ols => ols.map(o => o.children.length));
  console.log('team sizes:', teamSizes.join(', '));
  await page.screenshot({ path: 'docs/shot-teams.png' });

  // draw
  await page.click('a[href="#/draw"]');
  await page.click('#btnDraw');
  await page.waitForTimeout(1800);
  const drawn = await page.textContent('#drawNum');
  const names = await page.$$eval('#drawNames .who', ns => ns.map(n => n.textContent));
  console.log('drew seat', drawn.trim(), '->', names.join(' | '));
  await page.screenshot({ path: 'docs/shot-draw.png' });

  // log — tick someone to a role unlock
  await page.click('a[href="#/log"]');
  for (let i = 0; i < 5; i++) {
    await page.click('#logTable tbody tr:first-child td:nth-child(4) button:last-child');
    await page.waitForTimeout(60);
  }
  const chips = await page.$$eval('#logTable tbody tr:first-child .chip', c => c.map(x => x.textContent));
  console.log('role chips after 5 speaking ticks:', chips.join(', ') || '(none)');
  await page.screenshot({ path: 'docs/shot-log.png' });

  // home + scoring
  await page.click('a[href="#/home"]');
  await page.click('#scoreStrip .score-cell:nth-child(2) button:nth-child(3)');
  await page.click('#scoreStrip .score-cell:nth-child(2) button:nth-child(3)');
  await page.waitForTimeout(150);
  const pts = await page.$$eval('#scoreStrip .pt', p => p.map(x => x.textContent));
  console.log('scores:', pts.join('/'));
  await page.screenshot({ path: 'docs/shot-home.png' });

  // persistence across reload
  await page.reload();
  await page.waitForTimeout(300);
  const afterReload = await page.textContent('#weekChip');
  const ptsAfter = await page.$$eval('#scoreStrip .pt', p => p.map(x => x.textContent));
  console.log('after reload:', afterReload.trim(), 'scores', ptsAfter.join('/'));

  await page.click('a[href="#/data"]');
  await page.screenshot({ path: 'docs/shot-data.png' });

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
