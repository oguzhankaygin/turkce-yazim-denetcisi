import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const kok = new URL('../docs/', import.meta.url);

test('Web uygulaması bildirimi ana ekrana eklenebilir ve ikonları mevcut', async () => {
  const bildirim = JSON.parse(await readFile(new URL('manifest.webmanifest', kok), 'utf8'));
  assert.equal(bildirim.lang, 'tr');
  assert.equal(bildirim.start_url, './');
  assert.equal(bildirim.scope, './');
  assert.equal(bildirim.display, 'standalone');
  assert.ok(bildirim.name && bildirim.short_name.length <= 15);
  assert.ok(bildirim.icons.some(ikon => ikon.purpose === 'maskable'));
  for (const ikon of bildirim.icons) {
    const veri = await readFile(new URL(ikon.src, kok));
    if (ikon.type === 'image/png') {
      // PNG IHDR: genişlik ve yükseklik 16. ve 20. baytlarda.
      const [g, y] = ikon.sizes.split('x').map(Number);
      assert.deepEqual([veri.readUInt32BE(16), veri.readUInt32BE(20)], [g, y], ikon.src);
    }
  }
  const sayfa = await readFile(new URL('index.html', kok), 'utf8');
  assert.match(sayfa, /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  assert.match(sayfa, /<link rel="apple-touch-icon" href="\.\/ikon-192\.png">/);
  const sw = await readFile(new URL('sw.js', kok), 'utf8');
  for (const dosya of ['manifest.webmanifest', ...new Set(bildirim.icons.map(ikon => ikon.src))]) {
    assert.ok(sw.includes(`./${dosya}`), `${dosya} çevrimdışı önbellekte`);
  }
});
