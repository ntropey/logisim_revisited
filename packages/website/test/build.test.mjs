import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run `pnpm --filter @logisim/website build` first; this test asserts on dist/.
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'play') out.push(...htmlFiles(p));
    } else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

test('dist exists with the core pages', () => {
  assert.ok(existsSync(dist), 'dist/ missing: run the website build first');
  for (const page of ['index.html', 'about.html', 'privacy.html', '404.html', '_redirects']) {
    assert.ok(existsSync(join(dist, page)), `${page} missing`);
  }
});

test('every page has basic HTML structure', () => {
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<!doctype html>/i, file);
    assert.match(html, /<html[ >]/i, file);
    assert.match(html, /<head>/i, file);
    assert.match(html, /<body[ >]/i, file);
  }
});

test('no British spellings', () => {
  const british = /\b(colour|behaviour|centre|realise|organise|analyse|catalogue|grey)\w*/i;
  for (const file of htmlFiles(dist)) {
    const text = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
    const m = text.match(british);
    assert.equal(m, null, `${file}: ${m && m[0]}`);
  }
});

test('internal links resolve', () => {
  const broken = [];
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, 'utf8');
    for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
      if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) continue;
      const clean = href.split('#')[0].split('?')[0];
      if (!clean) continue;
      let target = clean.startsWith('/') ? join(dist, clean) : resolve(dirname(file), clean);
      if (target.startsWith(join(dist, 'play'))) continue; // the app is a separate build
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
      if (!existsSync(target)) broken.push(`${file.slice(dist.length)} -> ${href}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('every circuit guide and component page has a rendered schematic', () => {
  for (const dir of ['circuits', 'components']) {
    for (const name of readdirSync(join(dist, dir))) {
      if (name === 'index.html') continue;
      const html = readFileSync(join(dist, dir, name), 'utf8');
      assert.match(html, /<svg class="schematic" viewBox="[-\d.]+ [-\d.]+ [\d.]+ [\d.]+"/, `${dir}/${name}`);
    }
  }
});

test('every component reference page has substantive documentation, pinout table, and prose', () => {
  const compDir = join(dist, 'components');
  const files = readdirSync(compDir).filter((f) => f.endsWith('.html') && f !== 'index.html');
  assert.ok(files.length >= 41, `expected at least 41 component pages, got ${files.length}`);
  for (const name of files) {
    const html = readFileSync(join(compDir, name), 'utf8');
    const h2Count = [...html.matchAll(/<h2>/g)].length;
    assert.ok(h2Count >= 3, `components/${name} should have at least 3 <h2> sections (got ${h2Count})`);
    assert.match(html, /Pins &amp; Pinout<\/h2>/, `components/${name} missing pinout section`);
    assert.match(html, /<th>Location &amp; Role<\/th>/, `components/${name} missing pin table headers`);
    const articleMatch = html.match(/<article class="content guide">([\s\S]*?)<\/article>/);
    assert.ok(articleMatch, `components/${name} missing article`);
    const plainText = articleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    assert.ok(plainText.length >= 600, `components/${name} article prose too short (${plainText.length} chars)`);
  }
});

test('top Search Console component and landing pages contain targeted pinouts and truth tables', () => {
  const seg7 = readFileSync(join(dist, 'components', '7-segment-display.html'), 'utf8');
  assert.match(seg7, /<title>7-Segment Display Pins &amp; Pinout in Logisim \| Logisim Revisited<\/title>/);
  assert.match(seg7, /seg_g \(g\)/);
  assert.match(seg7, /seg_dp \(dp\)/);
  assert.match(seg7, /hex-digit-display\.html/);

  const sr = readFileSync(join(dist, 'components', 's-r-flip-flop.html'), 'utf8');
  assert.match(sr, /<title>S-R Flip-Flop in Logisim/);
  assert.match(sr, /Invalid \/ Forbidden/);
  assert.match(sr, /jk-flip-flop\.html/);

  const tff = readFileSync(join(dist, 'components', 't-flip-flop.html'), 'utf8');
  assert.match(tff, /<title>T Flip-Flop \(Toggle Flip-Flop\) in Logisim/);
  assert.match(tff, /divide-by-2 frequency divider/);
  assert.match(tff, /Toggle state/);

  const xor = readFileSync(join(dist, 'components', 'xor-gate.html'), 'utf8');
  assert.match(xor, /<title>XOR Logic Gate \(Exclusive OR\) in Logisim/);
  assert.match(xor, /A·~B \+ ~A·B/);
  assert.match(xor, /half-adder\.html/);

  const pin = readFileSync(join(dist, 'components', 'pin.html'), 'utf8');
  assert.match(pin, /<title>Input Pin &amp; Output Pin in Logisim/);
  assert.match(pin, /Poke tool/);
  assert.match(pin, /Select tool/);

  const tunnel = readFileSync(join(dist, 'components', 'tunnel.html'), 'utf8');
  assert.match(tunnel, /<title>Tunnel in Logisim — How to Connect Wires Without Crossing/);
  assert.match(tunnel, /case-sensitive/);
  assert.match(tunnel, /short-circuit-demo\.html/);

  const aiCoach = readFileSync(join(dist, 'manual', 'ai-coach.html'), 'utf8');
  assert.match(aiCoach, /Logisim AI Circuit Coach &amp; Signal Prover/);

  const online = readFileSync(join(dist, 'learn', 'logisim-online-no-java.html'), 'utf8');
  assert.match(online, /Logisim Online in Your Browser \(No Java Required\)/);
});

test('combinational guides show an interactive simulated truth table and input poke controls', () => {
  const html = readFileSync(join(dist, 'circuits', 'half-adder.html'), 'utf8');
  const rows = [...html.matchAll(/<tr><td>(\d)<\/td><td>(\d)<\/td><td class="out v\w">(\w)<\/td><td class="out v\w">(\w)<\/td><\/tr>/g)].map((m) => m.slice(1).join(''));
  assert.deepEqual(rows, ['0000', '0110', '1010', '1101']); // A B Sum Carry
  assert.match(html, /class="poke-bar"/);
  assert.match(html, /class="poke-btn"/);
  assert.match(html, /data-initial-row="3"/);

  const xorParity = readFileSync(join(dist, 'circuits', 'xor-parity.html'), 'utf8');
  const parityRows = [...xorParity.matchAll(/<tr><td>(\d)<\/td><td>(\d)<\/td><td>(\d)<\/td><td class="out v\w">(\w)<\/td><\/tr>/g)].map((m) => m.slice(1).join(''));
  assert.deepEqual(parityRows, ['0000', '0011', '0101', '0110', '1001', '1010', '1100', '1111']);
  assert.match(xorParity, /class="poke-bar"/);

  assert.match(readFileSync(join(dist, 'circuits', 'short-circuit-demo.html'), 'utf8'), /class="out vE">E</);
  assert.doesNotMatch(readFileSync(join(dist, 'circuits', 'jk-flip-flop.html'), 'utf8'), /<table class="truth"/);
});

test('all 4 new high-demand circuit guides exist as indexable pages with schematics', () => {
  for (const slug of ['sr-latch', 't-flip-flop', 'd-flip-flop', 'xor-parity']) {
    const html = readFileSync(join(dist, 'circuits', `${slug}.html`), 'utf8');
    assert.doesNotMatch(html, /<meta name="robots" content="noindex">/, slug);
    assert.doesNotMatch(html, /http-equiv="refresh"/, slug);
    assert.match(html, new RegExp(`href="\\.\\./play/\\?p=${slug}"`), slug);
  }
  const alu = readFileSync(join(dist, 'circuits', '4-bit-alu.html'), 'utf8');
  assert.match(alu, /class="bus-badge"/);
});

test('no template leaks such as undefined, null or NaN in page text', () => {
  for (const file of htmlFiles(dist)) {
    const text = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /\b(undefined|null|NaN)\b/, file);
  }
});
