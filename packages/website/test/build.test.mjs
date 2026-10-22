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
  for (const page of ['index.html', 'about.html', 'privacy.html', '404.html']) {
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
      if (name === 'index.html' || name === 'sr-latch.html') continue;
      const html = readFileSync(join(dist, dir, name), 'utf8');
      assert.match(html, /<svg class="schematic" viewBox="[-\d.]+ [-\d.]+ [\d.]+ [\d.]+"/, `${dir}/${name}`);
    }
  }
});

test('combinational guides show a simulated truth table with the right answers', () => {
  const html = readFileSync(join(dist, 'circuits', 'half-adder.html'), 'utf8');
  const rows = [...html.matchAll(/<tr><td>(\d)<\/td><td>(\d)<\/td><td class="out v\w">(\w)<\/td><td class="out v\w">(\w)<\/td><\/tr>/g)].map((m) => m.slice(1).join(''));
  assert.deepEqual(rows, ['0000', '0110', '1010', '1101']); // A B Sum Carry
  assert.match(readFileSync(join(dist, 'circuits', 'short-circuit-demo.html'), 'utf8'), /class="out vE">E</);
  assert.doesNotMatch(readFileSync(join(dist, 'circuits', 'jk-flip-flop.html'), 'utf8'), /<table class="truth"/);
});

test('the renamed flip-flop guide keeps its old address', () => {
  const html = readFileSync(join(dist, 'circuits', 'sr-latch.html'), 'utf8');
  assert.match(html, /http-equiv="refresh" content="0; url=jk-flip-flop.html"/);
});

test('no template leaks such as undefined, null or NaN in page text', () => {
  for (const file of htmlFiles(dist)) {
    const text = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /\b(undefined|null|NaN)\b/, file);
  }
});
