/* Smoke test: the game loads, the title starts a level, the hero moves, and the console stays clean.
   Run: NODE_PATH=/tmp/node_modules node tests/smoke.cjs
   Needs Google Chrome and puppeteer-core. */
const {spawn} = require('child_process');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8791;

function serve(){
  const child = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {cwd: ROOT, stdio: 'ignore'});
  return child;
}
function waitForServer(){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 8000);
    const ping = () => {
      const req = http.get('http://127.0.0.1:' + PORT + '/', res => { res.resume(); clearTimeout(t); resolve(); });
      req.on('error', () => setTimeout(ping, 80));
    };
    ping();
  });
}

(async () => {
  const server = serve();
  const fails = [];
  let browser;
  try {
    await waitForServer();
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME || '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message || e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({width: 1100, height: 700});
    await page.goto('http://127.0.0.1:' + PORT + '/?qa=1', {waitUntil: 'networkidle0', timeout: 20000});
    await page.waitForFunction(() => window.__ES && window.PTP && window.PTP.KIND && window.PTP.KIND.hero, {timeout: 8000});
    const title = await page.evaluate(() => ({
      btns: K.btns.map(b => b.id),
      wide: !!(K.img.wide && K.img.wide.naturalWidth),
      tall: !!(K.img.tall && K.img.tall.naturalWidth),
      overlap: K.qaOverlap()
    }));
    if (!title.btns.includes('play')) fails.push('title is missing Play');
    if (!title.wide || !title.tall) fails.push('title key art did not load');
    if (title.overlap.length) fails.push('title buttons cover a character: ' + title.overlap.join(','));
    await page.evaluate(() => __ES.startLevel(0));
    await new Promise(r => setTimeout(r, 200));
    const x0 = await page.evaluate(() => __ES.G && __ES.G.hero.x);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ShiftRight');
    await new Promise(r => setTimeout(r, 450));
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('ShiftRight');
    const moved = await page.evaluate(() => ({x: __ES.G.hero.x, state: __ES.G.state, kids: __ES.G.lv.kidsTotal}));
    if (!(moved.x > x0 + 8)) fails.push('hero did not move (from ' + x0 + ' to ' + moved.x + ')');
    if (moved.state !== 'play') fails.push('level left play state: ' + moved.state);
    await page.evaluate(() => __ES.startLevel(29));
    await new Promise(r => setTimeout(r, 200));
    const boss = await page.evaluate(() => __ES.G && __ES.G.boss && __ES.G.boss.lk && __ES.G.boss.lk.kind);
    if (boss !== 'pete') fails.push('final boss is not Pete (' + boss + ')');
    const real = errors.filter(e => !/favicon/i.test(e));
    if (real.length) fails.push('console errors: ' + real.join(' | '));
    if (fails.length) {
      console.error('SMOKE FAIL\n' + fails.map(f => '- ' + f).join('\n'));
      process.exitCode = 1;
    } else console.log('SMOKE OK move', x0, '->', moved.x, 'boss', boss);
  } catch (e) {
    console.error('SMOKE FAIL', e);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
})();
