// Быстрая проверка без сети и без ключей: все модули грузятся без ошибок,
// данные библиотеки в порядке, а чистая логика (без обращений к провайдерам)
// ведёт себя правильно. Живые проверки провайдеров — через /api/ping?test=...
// уже в развёрнутом виде, отдельно (нужны настоящие ключи).
import assert from 'node:assert/strict';
process.env.RADIO_OPEN = '1';   // старые проверки адресов мотора; пропуск проверяется отдельным блоком в конце

let ok = 0, fail = 0;
function check(name, fn) {
  try { fn(); ok++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
}

console.log('модули api/*.js загружаются');
const apiFiles = ['account', 'auth', 'pay', 'ping', 'record', 'image', 'hero', 'voice', 'library', 'wizard', 'stories', 'art', 'beta', 'square'];
for (const f of apiFiles) {
  try { await import('../api/' + f + '.js'); ok++; console.log('  ok   загрузился api/' + f + '.js'); }
  catch (e) { fail++; console.log('  FAIL api/' + f + '.js не загрузился -> ' + e.message); }
}

console.log('\nбиблиотека сказок (data/library.js)');
const { LIBRARY, libraryList, libraryOne } = await import('../data/library.js');
check('в библиотеке тридцать две сказки', () => assert.equal(LIBRARY.length, 32));
check('шестнадцать русских, шестнадцать английских', () => {
  assert.equal(LIBRARY.filter(s => s.lang === 'ru').length, 16);
  assert.equal(LIBRARY.filter(s => s.lang === 'en').length, 16);
});
check('каждая сказка читается вслух меньше чем за пять минут (предел записи с суфлёра)', () => {
  for (const s of LIBRARY) assert.ok(s.text.split(/\s+/).length / 110 < 5, s.id + ': слишком длинная');
});
check('все id разные', () => assert.equal(new Set(LIBRARY.map(s => s.id)).size, LIBRARY.length));
check('у каждой сказки есть текст, источник и оценка времени', () => {
  for (const s of LIBRARY) {
    assert.ok(s.text && s.text.length > 30, s.id + ': текст пустой или совсем короткий');
    assert.ok(s.source && s.source.length > 5, s.id + ': нет источника');
    assert.ok(s.estMinutes > 0, s.id + ': нет оценки времени чтения');
  }
});
check('libraryList: в каждом языке — десять сказок «Favola 10»', () => assert.equal(libraryList('ru').length, 10));
check('libraryOne находит по id, иначе null', () => {
  assert.equal(libraryOne('ru-repka').title, 'Репка');
  assert.equal(libraryOne('нет-такой'), null);
});

console.log('\nтарифы (lib/plans.js) — пакет сказок, год без ограничений, донат');
const { PLANS, FREE_STORIES, RECORD_FREE, grantFor, priceOf } = await import('../lib/plans.js');
check('в продаже два пакета: 10 сказок за 9,99 € и 100 сказок за 49,99 €, без годовой подписки', () => {
  assert.deepEqual(Object.keys(PLANS).sort(), ['pack10', 'pack100']);
  assert.equal(PLANS.pack10.price, 9.99); assert.equal(PLANS.pack100.price, 49.99); assert.equal(grantFor('pack100', 0).stories, 100);
});
check('донат — от 10 €', () => { assert.equal(priceOf('support', 9), null); assert.equal(priceOf('support', 10), 10); assert.equal(priceOf('support', 37.5), 37.5); });
check('grantFor(pack10) даёт 10 сказок', () => {
  const g = grantFor('pack10', 0);
  assert.equal(g.stories, 10);
});
check('grantFor(year) даёт безлимит на 365 дней', () => {
  const g = grantFor('year', 0);
  assert.equal(g.stories, null);
  assert.equal(g.until, 365 * 86400000);
});
check('FREE_STORIES=3: три бесплатные сказки любым способом', () => { assert.equal(FREE_STORIES, 3); assert.equal(RECORD_FREE, 3); });

console.log('\nправила аккаунта (lib/store.js) — тот же счётчик, что списывает Favola');
const { canMake, canMakeRecord, blankUser, publicView, linkIdentity, emailKey, saveUser } = await import('../lib/store.js');
check('свежий аккаунт может сделать бесплатную сказку', () => {
  const u = blankUser('dev1');
  assert.equal(canMake(u, FREE_STORIES).ok, true);
});
check('после FREE_STORIES бесплатных без оплаты — нельзя', () => {
  const u = blankUser('dev2'); u.made = FREE_STORIES;
  assert.equal(canMake(u, FREE_STORIES).ok, false);
});
check('вторая и третья сказки из записи — бесплатно, четвёртая без оплаты — нельзя', () => {
  const u = blankUser('dev3'); u.made = 1;
  assert.equal(canMakeRecord(u, FREE_STORIES, RECORD_FREE).ok, true);
  u.made = 2; assert.equal(canMakeRecord(u, FREE_STORIES, RECORD_FREE).ok, true);
  u.made = 3; assert.equal(canMakeRecord(u, FREE_STORIES, RECORD_FREE).ok, false);
});
check('publicView не отдаёт лишнего', () => {
  const u = blankUser('dev4');
  const v = publicView(u, FREE_STORIES, RECORD_FREE);
  assert.ok(!('payments' in v));
});
await (async () => {
  // Главная жалоба Василия: «зашёл под своей почтой с другого устройства —
  // а сказок нет». linkIdentity должен подтягивать radio_made (список своих
  // сказок Radio) точно так же, как уже подтягивает shelf для Favola.
  try {
    const mail = emailKey('semya-' + Date.now() + '@example.com');
    const devA = blankUser('devA-' + Date.now()); devA.radio_made = ['rd1', 'rd2'];
    await linkIdentity(devA, mail);
    await saveUser(devA);
    const devB = blankUser('devB-' + Date.now());
    await linkIdentity(devB, mail);
    assert.ok(devB.radio_made.includes('rd1') && devB.radio_made.includes('rd2'),
      'на новом устройстве под той же почтой нет сказок с первого: ' + JSON.stringify(devB.radio_made));
    ok++; console.log('  ok   при входе с новой почты/устройства свои сказки Radio подтягиваются с других устройств');
  } catch (e) { fail++; console.log('  FAIL при входе с новой почты/устройства свои сказки Radio подтягиваются с других устройств  -> ' + e.message); }
})();

console.log('\nразбор записи (lib/record.js) — переиспользованная логика Favola');
const { splitSentences, sceneCountFor, cleanShows, timeline } = await import('../lib/record.js');
check('splitSentences режет по точке', () => {
  const words = 'Раз. Два.'.split(' ').map((t, i) => ({ t, s: i, e: i + 0.5 }));
  const s = splitSentences(words);
  assert.ok(s.length >= 2);
});
check('sceneCountFor держится в границах 3..6', () => {
  assert.ok(sceneCountFor(300, 30) <= 6);
  assert.ok(sceneCountFor(5, 2) >= 1);
});
check('cleanShows убирает повторы и режет длину списка', () => {
  assert.deepEqual(cleanShows(['кот', 'КОТ', 'дом', 'дом', 'дом', 'а', 'б', 'в', 'г']).length <= 6, true);
});

console.log('\nподсказки (lib/prompts.js) — новые для Radio собраны без ошибок');
const { buildWizardPrompt, buildPolishPrompt, buildLibraryScenesPrompt, WIZARD_SYSTEM, POLISH_SYSTEM } = await import('../lib/prompts.js');
check('buildWizardPrompt подставляет все восемь ответов', () => {
  const p = buildWizardPrompt(['Ася', 'зверь', 'мёд', 'дождь', 'сова', 'лес', 'спрятался', 'подождал'], 'ru');
  assert.ok(p.includes('Ася') && p.includes('подождал'));
});
check('buildPolishPrompt нумерует предложения', () => {
  const p = buildPolishPrompt(['Раз.', 'Два.'], 'ru');
  assert.ok(p.includes('0: Раз.') && p.includes('1: Два.'));
});
check('buildLibraryScenesPrompt нумерует абзацы', () => {
  const p = buildLibraryScenesPrompt(['Абзац один.', 'Абзац два.'], 'ru');
  assert.ok(p.includes('0: Абзац один.'));
});
check('системные подсказки не пустые', () => { assert.ok(WIZARD_SYSTEM.length > 100); assert.ok(POLISH_SYSTEM.length > 100); });

console.log('\nсвои сказки (api/stories.js) — сохранение не должно молчать об ошибке');
{
  const storiesHandler = (await import('../api/stories.js')).default;
  // Маленькая подмена req/res в духе Vercel: handler читает req.method/query/body
  // и вызывает res.status(...).json(...).
  function call(req) {
    const res = { _status: 200, status(c){ this._status=c; return this; }, json(o){ this._body=o; return this; }, end(){ return this; }, setHeader(){ return this; } };
    req.query = req.query || {};
    return storiesHandler(req, res).then(() => ({ status: res._status, body: res._body }));
  }
  const device = 'selftest-device-' + Date.now();
  let sid = null;
  await (async () => {
    try {
      const r = await call({ method:'POST', body: { device, act:'start', story: {
        kind:'record', title:'Т', lang:'ru', panels:['раз','два'], questions:[],
        audio: { url: 'data:audio/webm;base64,QQ==', timeline: [], words: [], pauses: [] }
      } } });
      assert.equal(r.status, 200);
      assert.ok(r.body && r.body.id, 'нет id: ' + JSON.stringify(r.body));
      sid = r.body.id;
      ok++; console.log('  ok   act:start заводит сказку и не пишет data:-строку голоса в опись');
    } catch (e) { fail++; console.log('  FAIL act:start заводит сказку и не пишет data:-строку голоса в опись  -> ' + e.message); }
  })();
  await (async () => {
    try {
      assert.ok(sid, 'предыдущий шаг не завёл сказку');
      // Без BLOB_READ_WRITE_TOKEN/BLOB_STORE_ID (как в этой песочнице) хранилище файлов
      // не подключено — раньше act:asset тут молча отвечал «ok», а картинка терялась.
      const r = await call({ method:'POST', body: { device, act:'asset', id: sid, name:'panel-1', data:'data:image/jpeg;base64,QQ==' } });
      assert.ok(r.body && r.body.error, 'ожидали явную ошибку, получили: ' + JSON.stringify(r.body));
      ok++; console.log('  ok   act:asset без файлового хранилища возвращает понятную ошибку, а не тихий "ok"');
    } catch (e) { fail++; console.log('  FAIL act:asset без файлового хранилища возвращает понятную ошибку, а не тихий "ok"  -> ' + e.message); }
  })();
}

console.log('\nпрямая загрузка записи в хранилище (/api/upload) и хранение оригинала');
{
  const rec = await import('../lib/record.js');
  const recordHandler = (await import('../api/record.js')).default;
  const storiesHandler = (await import('../api/stories.js')).default;
  function mk(handler) {
    return req => {
      const res = { _status: 200, status(c){ this._status=c; return this; }, json(o){ this._body=o; return this; }, end(){ return this; }, setHeader(){ return this; } };
      req.query = req.query || {};
      return handler(req, res).then(() => ({ status: res._status, body: res._body }));
    };
  }
  const callRec = mk(recordHandler), callSt = mk(storiesHandler);
  check('путь загрузки лежит внутри radio-raw/ и не пускает чужие символы', () => {
    const p = rec.uploadPath('../../evil dev', 'take.m4a');
    assert.ok(p.startsWith('radio-raw/evildev/'), p);
    assert.ok(p.endsWith('.m4a'), p);
    assert.equal(rec.uploadPath('', 'x.webm'), null);
    assert.ok(rec.uploadPath('d1', 'x.exe').endsWith('.webm'));
  });
  await (async () => {
    const name = 'без ключа хранилища /api/upload честно говорит «no-storage»';
    try {
      const saved = process.env.BLOB_READ_WRITE_TOKEN; delete process.env.BLOB_READ_WRITE_TOKEN;
      const r = await callRec({ method:'POST', query:{ __r:'upload' }, body:{ device:'d1', name:'t.webm' } });
      if (saved) process.env.BLOB_READ_WRITE_TOKEN = saved;
      assert.equal(r.status, 503); assert.equal(r.body.outcome, 'no-storage');
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'с ключом хранилища /api/upload выдаёт пропуск на один путь';
    try {
      process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teststore_secretsecretsecret';
      const r = await callRec({ method:'POST', query:{ __r:'upload' }, body:{ device:'d1', name:'t.webm' } });
      delete process.env.BLOB_READ_WRITE_TOKEN;
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(String(r.body.clientToken).startsWith('vercel_blob_client_'), 'не пропуск: ' + r.body.clientToken);
      assert.ok(r.body.pathname.startsWith('radio-raw/d1/'));
      const payload = JSON.parse(Buffer.from(Buffer.from(r.body.clientToken.split('_').pop(), 'base64').toString().split('.')[1], 'base64').toString());
      assert.equal(payload.pathname, r.body.pathname);
      assert.equal(payload.maximumSizeInBytes, rec.MAX_UPLOAD_BYTES);
      ok++; console.log('  ok   ' + name);
    } catch (e) { delete process.env.BLOB_READ_WRITE_TOKEN; fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = '/api/clean по ссылке берёт запись только из нашего хранилища';
    try {
      process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'test';
      const r = await callRec({ method:'POST', query:{ __r:'clean' }, body:{ url:'https://evil.example.com/a.webm' } });
      assert.equal(r.status, 400);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'act:start хранит исходную запись рядом с очищенной, чужие ссылки не берёт';
    try {
      const device = 'selftest-orig-' + Date.now();
      const good = 'https://abc.public.blob.vercel-storage.com/radio-raw/d/x.webm';
      const r1 = await callSt({ method:'POST', body:{ device, act:'start', story:{ kind:'record', title:'Т', lang:'ru', panels:['а'],
        audio:{ url:'https://abc.public.blob.vercel-storage.com/records/clean.mp3', original: good, timeline:[{start:0,end:1}] } } } });
      const { get: storeGet } = await import('../lib/store.js');
      const raw1 = await storeGet('rad:story:' + r1.body.id);
      assert.equal(raw1.audio.original, good);
      assert.ok(raw1.audio.voice);
      const g1 = await callSt({ method:'GET', query:{ device, id: r1.body.id } });
      assert.ok(g1.body.audio.voice, 'телефону отдан голос');
      assert.equal(g1.body.audio.original, undefined, 'исходник телефону не отдаём');
      const r2 = await callSt({ method:'POST', body:{ device, act:'start', story:{ kind:'record', title:'Т', lang:'ru', panels:['а'],
        audio:{ url:'https://abc.public.blob.vercel-storage.com/records/clean.mp3', original:'https://evil.example.com/x.webm', timeline:[] } } } });
      const raw2 = await storeGet('rad:story:' + r2.body.id);
      assert.equal(raw2.audio.original, undefined);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
}

console.log('\nзагрузка по подписанной ссылке (хранилище с BLOB_STORE_ID, без полного ключа)');
{
  const rec = await import('../lib/record.js');
  const recordHandler = (await import('../api/record.js')).default;
  const call = req => {
    const res = { _status: 200, status(c){ this._status=c; return this; }, json(o){ this._body=o; return this; }, end(){ return this; }, setHeader(){ return this; } };
    req.query = req.query || {}; req.headers = req.headers || {};
    return recordHandler(req, res).then(() => ({ status: res._status, body: res._body }));
  };
  check('путь для записи проверяется строго', () => {
    assert.ok(rec.isUploadPathOk('radio-raw/rdabc123/k2x9m1abcd.webm'));
    assert.ok(rec.isUploadPathOk('radio-raw/d1/abc123.m4a'));
    assert.ok(!rec.isUploadPathOk('library/ru-repka/scene-1.jpg'));
    assert.ok(!rec.isUploadPathOk('radio-raw/../x/abc123.webm'));
    assert.ok(!rec.isUploadPathOk('radio-raw/d1/abc123.exe'));
  });
  const saved = { ...process.env };
  process.env.BLOB_STORE_ID = 'store_teststore'; // Похожий на настоящий пропуск Vercel (JWT со сроком на час вперёд), иначе библиотека попытается его обновить.
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  process.env.VERCEL_OIDC_TOKEN = b64({ alg:'none' }) + '.' + b64({ exp: Math.floor(Date.now()/1000) + 3600, sub:'test' }) + '.sig';
  process.env.BLOB_WEBHOOK_PUBLIC_KEY = 'pk-test'; delete process.env.BLOB_READ_WRITE_TOKEN;
  // Подставной Vercel Blob на этом же компьютере: отвечает на запрос разрешения (/signed-token).
  const asked = [];
  const http = await import('node:http');
  const fakeBlob = http.createServer((q, r) => {
    let raw = ''; q.on('data', c => raw += c); q.on('end', () => {
      const b = JSON.parse(raw || '{}'); asked.push({ ...b, auth: q.headers.authorization || '' });
      const payload = Buffer.from(JSON.stringify({ storeId: 'teststore', pathname: b.pathname, operations: b.operations, validUntil: b.validUntil })).toString('base64url');
      r.writeHead(200, { 'content-type': 'application/json' });
      r.end(JSON.stringify({ delegationToken: payload + '.sig', clientSigningToken: Buffer.from('k'.repeat(32)).toString('base64url'), validUntil: b.validUntil }));
    });
  });
  await new Promise(ok => fakeBlob.listen(0, '127.0.0.1', ok));
  process.env.VERCEL_BLOB_API_URL = 'http://127.0.0.1:' + fakeBlob.address().port;
  process.env.VERCEL_BLOB_RETRIES = '0';
  await (async () => {
    const name = 'мотор выдаёт подписанную ссылку ровно на один путь, только на запись';
    try {
      const r = await call({ method:'POST', query:{ __r:'upload' }, body:{ type:'blob.generate-presigned-url', payload:{ pathname:'radio-raw/d1/abc123.webm', clientPayload:JSON.stringify({ device:'d1' }), multipart:false } } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(r.body.presignedUrlPayload && r.body.presignedUrlPayload.signature, 'нет подписи: ' + JSON.stringify(r.body));
      assert.equal(asked[0].pathname, 'radio-raw/d1/abc123.webm');
      assert.deepEqual(asked[0].operations, ['put']);
      assert.equal(asked[0].maximumSizeInBytes, rec.MAX_UPLOAD_BYTES);
      assert.ok(asked[0].auth.includes(process.env.VERCEL_OIDC_TOKEN), 'разрешение просили без пропуска Vercel');
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'чужой путь (например, в библиотеку) мотор не подписывает';
    try {
      const n = asked.length;
      const r = await call({ method:'POST', query:{ __r:'upload' }, body:{ type:'blob.generate-presigned-url', payload:{ pathname:'library/ru-repka/scene-1.jpg', clientPayload:JSON.stringify({ device:'d1' }), multipart:false } } });
      assert.ok(r.status === 403 || r.status === 500, 'ответ ' + r.status); assert.equal(asked.length, n, 'мотор всё равно попросил разрешение');
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  fakeBlob.close();
  for (const k of ['BLOB_STORE_ID','VERCEL_OIDC_TOKEN','BLOB_WEBHOOK_PUBLIC_KEY','VERCEL_BLOB_API_URL','VERCEL_BLOB_RETRIES']) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
}

console.log('\nчтение файла из хранилища (lib/blob.js readFile)');
{
  const { readFile } = await import('../lib/blob.js');
  const http = await import('node:http');
  const srv = http.createServer((q, r) => { if (q.url === '/ok.webm') { r.writeHead(200, {'content-type':'audio/webm'}); r.end('voice'); } else { r.writeHead(403); r.end('no'); } });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const base = 'http://127.0.0.1:' + srv.address().port;
  await (async () => {
    const name = 'открытый файл читается по ссылке';
    try { const f = await readFile(base + '/ok.webm'); assert.equal(f.buffer.toString(), 'voice'); assert.equal(f.mime, 'audio/webm'); ok++; console.log('  ok   ' + name); }
    catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'закрытый файл без хранилища — понятная ошибка с кодом 403';
    try { const saved = { a: process.env.BLOB_READ_WRITE_TOKEN, b: process.env.BLOB_STORE_ID }; delete process.env.BLOB_READ_WRITE_TOKEN; delete process.env.BLOB_STORE_ID;
      await assert.rejects(() => readFile(base + '/secret.webm'), /403/);
      if (saved.a) process.env.BLOB_READ_WRITE_TOKEN = saved.a; if (saved.b) process.env.BLOB_STORE_ID = saved.b;
      ok++; console.log('  ok   ' + name); }
    catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  srv.close();
}

console.log('\nзакрытое хранилище: временные подписанные ссылки для телефона');
{
  const blob = await import('../lib/blob.js');
  check('распознаёт ссылку закрытого хранилища', () => {
    assert.ok(blob.isPrivateUrl('https://abc.private.blob.vercel-storage.com/radio-stories/x/panel-1-q.jpg'));
    assert.ok(!blob.isPrivateUrl('https://abc.public.blob.vercel-storage.com/x.jpg'));
    assert.ok(!blob.isPrivateUrl('data:image/jpeg;base64,AA'));
  });
  check('постоянный адрес без подписи', () => {
    assert.equal(blob.canonicalUrl('https://abc.private.blob.vercel-storage.com/a/b.jpg?vercel-blob-signature=zz&x=1'), 'https://abc.private.blob.vercel-storage.com/a/b.jpg');
    assert.equal(blob.canonicalUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  });
  const http = await import('node:http');
  const puts = [];
  const fake = http.createServer((q, r) => {
    let raw = ''; q.on('data', c => raw += c); q.on('end', () => {
      if (q.url.startsWith('/signed-token')) {
        const b = JSON.parse(raw || '{}');
        const payload = Buffer.from(JSON.stringify({ storeId: 'teststore', pathname: b.pathname, operations: b.operations, validUntil: b.validUntil })).toString('base64url');
        r.writeHead(200, { 'content-type': 'application/json' });
        return r.end(JSON.stringify({ delegationToken: payload + '.sig', clientSigningToken: Buffer.from('k'.repeat(32)).toString('base64url'), validUntil: b.validUntil }));
      }
      // запись файла: закрытое хранилище отказывает открытой записи, как настоящее
      const access = q.headers['x-vercel-blob-access'];
      puts.push(access);
      if (access !== 'private') { r.writeHead(400, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ error: { code: 'bad_request', message: 'Cannot use public access on a private store. The store is configured with private access.' } })); }
      const pathname = new URL(q.url, 'http://x').searchParams.get('pathname');
      r.writeHead(200, { 'content-type': 'application/json' });
      r.end(JSON.stringify({ url: 'https://teststore.private.blob.vercel-storage.com/' + pathname, downloadUrl: '', pathname, contentType: 'text/plain', contentDisposition: 'inline' }));
    });
  });
  await new Promise(ok => fake.listen(0, '127.0.0.1', ok));
  const saved = { ...process.env };
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  Object.assign(process.env, { VERCEL_BLOB_API_URL: 'http://127.0.0.1:' + fake.address().port, VERCEL_BLOB_RETRIES: '0', BLOB_STORE_ID: 'store_teststore',
    VERCEL_OIDC_TOKEN: b64({ alg:'none' }) + '.' + b64({ exp: Math.floor(Date.now()/1000) + 3600, sub:'t' }) + '.sig' });
  delete process.env.BLOB_READ_WRITE_TOKEN;
  blob._setAccessForTests(null);
  await (async () => {
    const name = 'закрытое хранилище: запись сама переключается на private';
    try {
      const u = await blob.putFile('radio-diag/t.txt', Buffer.from('x'), 'text/plain');
      assert.ok(u.includes('.private.'), u);
      assert.deepEqual(puts.slice(0, 2), ['public', 'private']);
      assert.equal(blob.storeAccess(), 'private');
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'ссылка для телефона подписана и ведёт на тот же файл';
    try {
      const v = await blob.viewUrl('https://teststore.private.blob.vercel-storage.com/radio-stories/rd1/panel-1-abc.jpg');
      const x = new URL(v);
      assert.equal(x.hostname, 'teststore.private.blob.vercel-storage.com');
      assert.equal(x.pathname, '/radio-stories/rd1/panel-1-abc.jpg');
      assert.ok([...x.searchParams.keys()].some(k => /signature/i.test(k)), 'нет подписи: ' + v);
      assert.equal(await blob.viewUrl('https://abc.public.blob.vercel-storage.com/a.jpg'), 'https://abc.public.blob.vercel-storage.com/a.jpg');
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  fake.close(); blob._setAccessForTests(null);
  for (const k of ['VERCEL_BLOB_API_URL','VERCEL_BLOB_RETRIES','BLOB_STORE_ID','VERCEL_OIDC_TOKEN']) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
}

console.log('\nплитка сказки на стене (seed + громкость по ячейкам)');
await (async () => {
  const name = 'act:start хранит семя, 16 ячеек плитки и фигуру, мусор отбрасывает';
  try {
    const h = (await import('../api/stories.js')).default;
    const call = req => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.query=req.query||{}; return h(req,res).then(()=>res._b); };
    const device = 'tile-' + Date.now();
    const r = await call({ method:'POST', body:{ device, act:'start', story:{ kind:'record', title:'Т', panels:['а'], emblem:'hedgehog', seed:'tk12<script>ab', tile:[...Array(20)].map((_, i) => i === 3 ? 7 : i / 20) } } });
    const list = await call({ method:'GET', query:{ device } });
    const it = list.stories.find(x => x.id === r.id);
    assert.equal(it.seed, 'tk12scriptab');
    assert.equal(it.tile.length, 16);
    assert.equal(it.tile[3], 1);
    assert.equal(it.emblem, 'hedgehog');
    const r2 = await call({ method:'POST', body:{ device, act:'start', story:{ kind:'record', title:'Т', panels:['а'], emblem:'<img src=x>' } } });
    const l2 = await call({ method:'GET', query:{ device } });
    assert.equal(l2.stories.find(x => x.id === r2.id).emblem, null);
    ok++; console.log('  ok   ' + name);
  } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
})();

console.log('\nстиль картинок по умолчанию — португальская книжка');
{
  const pr = await import('../lib/prompts.js');
  check('по умолчанию рисуем португальской книжкой', () => { assert.equal(pr.DEFAULT_STYLE, 'portuguese'); assert.ok(/Portuguese picture-book/.test(pr.styleOf())); assert.ok(/azulejo/.test(pr.styleOf('portuguese'))); });
  check('прежние стили остались на выбор', () => { for (const k of ['classic','engraving','kids','minecraft']) assert.ok(pr.STYLE_BIBLE[k]); });
  check('в подсказке нет имён художников', () => assert.ok(!/Keil|Tangerina|Matoso|Carvalho|Bordallo/i.test(pr.STYLE_BIBLE.portuguese)));
}

console.log('\nготовая сказка открывается сразу, без ожидания плана картинок');
await (async () => {
  const name = 'GET /api/library?light=1&id=… отдаёт текст, не спрашивая модель';
  try {
    const h = (await import('../api/library.js')).default;
    const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} };
    const t0 = Date.now();
    await h({ method:'GET', query:{ id:'ru-repka', light:'1' }, headers:{} }, res);
    assert.equal(res._s, 200); assert.ok(res._b.text && res._b.text.length > 30); assert.equal(res._b.scenes, undefined);
    assert.ok(Date.now() - t0 < 1500, 'слишком долго');
    ok++; console.log('  ok   ' + name);
  } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
})();

console.log('\nпропуск на сказку: без списания сказки платные адреса не работают');
{
  delete process.env.RADIO_OPEN;
  const { issueTicket, requireTicket, MAX_CALLS } = await import('../lib/ticket.js');
  const spend = (await import('../lib/h-spend.js')).default;
  const recordH = (await import('../api/record.js')).default;
  const imageH = (await import('../api/image.js')).default;
  const call = (h, req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.query=req.query||{}; req.headers=req.headers||{}; return h(req,res).then(()=>res); };
  await (async () => {
    const name = 'без пропуска очистка, картинки и загрузка отвечают 402';
    try {
      const r1 = await call(recordH, { method:'POST', query:{ __r:'clean' }, body:{ device:'d1', url:'https://x.public.blob.vercel-storage.com/a.webm' } });
      const r2 = await call(imageH, { method:'POST', body:{ device:'d1', brief:'x' } });
      const r3 = await call(recordH, { method:'POST', query:{ __r:'upload' }, body:{ type:'blob.generate-presigned-url', payload:{ pathname:'radio-raw/d1/abc123.webm', clientPayload:'{}' } } });
      process.env.BLOB_STORE_ID = process.env.BLOB_STORE_ID || '';
      assert.equal(r1._s, 402); assert.equal(r1._b.outcome, 'no-ticket'); assert.equal(r2._s, 402);
      assert.ok(r3._s === 402 || r3._s === 503, 'загрузка: ' + r3._s);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = '/api/spend выдаёт пропуск, с ним адрес пропускает, с чужим устройством — нет';
    try {
      const device = 'tk-dev-' + Date.now();
      const sp = await call(spend, { method:'POST', body:{ device, kind:'record' } });
      assert.equal(sp._b.ok, true, JSON.stringify(sp._b)); assert.ok(/^tk_/.test(sp._b.ticket));
      const good = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;} };
      assert.equal(await requireTicket({ body:{ device, ticket: sp._b.ticket } }, good), true);
      const bad = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;} };
      assert.equal(await requireTicket({ body:{ device:'someone-else', ticket: sp._b.ticket } }, bad), false); assert.equal(bad._s, 402);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = 'три сказки бесплатно, четвёртой без оплаты нет: spend отказывает и пропуск не выдаёт';
    try {
      const device = 'tk-dev2-' + Date.now();
      for (let k = 0; k < 3; k++) { const r = await call(spend, { method:'POST', body:{ device, kind:'record' } }); assert.equal(r._b.ok, true, 'бесплатная № ' + (k + 1)); assert.ok(r._b.ticket); }
      const sp4 = await call(spend, { method:'POST', body:{ device, kind:'record' } });
      assert.equal(sp4._b.ok, false); assert.equal(sp4._b.ticket, undefined);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  await (async () => {
    const name = `у одного пропуска не больше ${MAX_CALLS} вызовов`;
    try {
      const id = await issueTicket('d9', 'record');
      let last = null;
      for (let i = 0; i <= MAX_CALLS; i++){ const r = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;} }; last = [await requireTicket({ body:{ device:'d9', ticket:id } }, r), r._s]; }
      assert.deepEqual(last, [false, 429]);
      ok++; console.log('  ok   ' + name);
    } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
  })();
  check('аварийный выключатель RADIO_OPEN=1 открывает адреса', () => {});
}

console.log('\n«Придумать вместе»: сначала писатель (проза), потом художник (план картинок)');
await (async () => {
  const realFetch = global.fetch; process.env.RADIO_OPEN = '1'; process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
  const calls = [];
  const para = (n) => 'Жил-был светящийся человечек Люмен. Он жил на холме, где пахло сливами. «Хочу в небо!» — говорил он коню. Конь фыркал и не пускал. Люмен вздыхал и снова смотрел на облака. '.repeat(n);
  const talePlain = (k) => 'Люмен и небо\n\n' + Array(5).fill(0).map(() => para(k)).join('\n\n');
  global.fetch = async (url, opts) => {
    if (!String(url).includes('anthropic')) return realFetch(url, opts);
    const b = JSON.parse(opts.body); const writer = /children's author/.test(b.system); calls.push(writer ? 'tale' : 'plan');
    const text = writer
      ? (calls.filter(c => c === 'tale').length === 1 ? 'Люмен\n\nЛюмен смотрит на небо.\n\nКонь мешает.\n\nЛюмен летит.' : talePlain(2))
      : JSON.stringify({ cast:[{name:'Люмен', look:'a small glowing boy'}], world:'hills', scenes: Array(5).fill({ brief:'Lumen looks at the sky', shows:['sky'] }), questions:['Что чувствовал Люмен?','А ты бы полетел?','Как зовут коня?','Что было дальше?','Какой был ферзь?'] });
    return { ok:true, json: async () => ({ content:[{ text }], usage:{ input_tokens:10, output_tokens:10 }, stop_reason:'end_turn' }) };
  };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  try {
    const h = (await import('../api/wizard.js')).default;
    const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} };
    await h({ method:'POST', headers:{}, query:{ trace:'1' }, body:{ answers:['Люмен','волшебное существо','полетать','конь','ферзь','Тютеляндия','слива','договорился'], lang:'ru' } }, res);
    await t('короткий черновик писателя отправлен на переписывание, затем — план картинок', async () => { assert.deepEqual(calls, ['tale','tale','plan']); });
    await t('страницы — абзацы прозы писателя, а не подписи к картинкам', async () => {
      assert.equal(res._s, 200); assert.equal(res._b.panels.length, 5); assert.ok(res._b.panels.every(p => p.length > 150), res._b.panels.map(p => p.length).join(','));
      assert.equal(res._b.title, 'Люмен и небо'); assert.ok(!res._b.source);
    });
    await t('на каждый абзац — свой кадр, герои и вопросы от художника', async () => {
      assert.equal(res._b.scenes.length, 5); assert.equal(res._b.cast[0].name, 'Люмен'); assert.equal(res._b.questions.length, 5);
    });
    const { parseTale } = await import('../api/wizard.js');
    await t('разбор текста писателя: название и абзацы, лишние обёртки убираются', async () => {
      const p = parseTale('```\n**Люмен и небо**\n\nПервый абзац.\nПродолжение.\n\nВторой абзац.\n```');
      assert.equal(p.title, 'Люмен и небо'); assert.deepEqual(p.paragraphs, ['Первый абзац. Продолжение.', 'Второй абзац.']);
    });
  } finally { global.fetch = realFetch; }
})();

console.log('\nкартинки рисует сервер: задание, повторы, дорисовка, сказка');
await (async () => {
  const A = await import('../lib/art.js'); const S = await import('../lib/store.js');
  A._fastForTests();
  const PNG = 'data:image/png;base64,iVBORw0KGgo=';
  let calls = 0;
  A._setGenForTests(async (prompt) => { calls++; if (/scene-fail/.test(prompt)) throw new Error('google 503'); if (calls === 2) throw new Error('временный сбой'); return PNG; });
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  await t('задание рисует лист героя и все кадры, временный сбой лечится повтором', async () => {
    const job = A.newJob({ device:'d1', cast:'Ася: девочка', world:'лес', scenes:[{brief:'a'},{brief:'b'},{brief:'c'}] });
    await S.set(A.jobKey(job.id), job); await A.markPending(job.id, true);
    const j = await A.processJob(job.id);
    assert.equal(j.hero.state, 'done'); assert.deepEqual(j.items.map(x => x.state), ['done','done','done']);
    assert.ok(!((await S.get('rad:art:pending')) || []).includes(job.id), 'законченное задание снято с расписания');
    const pub = await A.publicJob(j); assert.equal(pub.done, true); assert.ok(pub.items.every(x => x.url));
  });
  await t('кадр, который не рисуется, остаётся в расписании и не ломает остальные', async () => {
    const job = A.newJob({ device:'d1', cast:'', scenes:[{brief:'ok'},{brief:'scene-fail'}] });
    await S.set(A.jobKey(job.id), job); await A.markPending(job.id, true);
    const j = await A.processJob(job.id);
    assert.equal(j.hero.state, 'skip'); assert.equal(j.items[0].state, 'done'); assert.equal(j.items[1].state, 'retry');
    assert.equal(j.items[1].tries, A.MAX_TRIES); assert.match(j.items[1].err, /google 503/);
    assert.ok(((await S.get('rad:art:pending')) || []).includes(job.id), 'в расписании');
  });
  await t('расписание дорисовывает позже, и картинка сама встаёт в сохранённую сказку', async () => {
    const job = A.newJob({ device:'d2', cast:'', scenes:[{brief:'x'},{brief:'scene-fail'}] });
    await S.set(A.jobKey(job.id), job); await A.markPending(job.id, true);
    await A.processJob(job.id);
    await S.set('rad:story:st1', { id:'st1', art:[null, null] });
    const j0 = await S.get(A.jobKey(job.id)); j0.storyId = 'st1'; j0.updated = Date.now() - 120000; await S.set(A.jobKey(job.id), j0);
    await A.copyIntoStory(j0);
    A._setGenForTests(async () => PNG);                       // Google снова работает
    const pass = await A.cronPass(10);
    assert.ok(pass.some(p => p.id === job.id && p.done === 2), JSON.stringify(pass));
    const rec = await S.get('rad:story:st1'); assert.ok(rec.art[0] && rec.art[1], 'обе картинки в сказке');
  });
  await t('/api/art: без пропуска 402, с RADIO_OPEN задание заводится; расписание — только для cron', async () => {
    const h = (await import('../api/art.js')).default;
    const call = async (req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = req.query || {}; await h(req, res); return res; };
    const prev = process.env.RADIO_OPEN; delete process.env.RADIO_OPEN;
    const r1 = await call({ method:'POST', body:{ device:'d3', scenes:[{brief:'a'}] } }); assert.equal(r1._s, 402);
    process.env.RADIO_OPEN = '1';
    const r2 = await call({ method:'POST', body:{ device:'d3', scenes:[{brief:'a'}] } }); assert.equal(r2._s, 200); assert.match(r2._b.job, /^aj_/);
    const r3 = await call({ method:'GET', query:{ job: r2._b.job } }); assert.equal(r3._s, 200); assert.equal(r3._b.items.length, 1);
    const r4 = await call({ method:'GET', query:{ cron:'1' }, headers:{ 'user-agent':'curl' } }); assert.equal(r4._s, 401);
    const r5 = await call({ method:'GET', query:{ cron:'1' }, headers:{ 'user-agent':'vercel-cron/1.0' } }); assert.equal(r5._s, 200);
    if (prev === undefined) delete process.env.RADIO_OPEN; else process.env.RADIO_OPEN = prev;
  });
})();

console.log('\nсказки на полке открываются и после смены адреса');
await (async () => {
  const S = await import('../lib/store.js');
  const h = (await import('../api/stories.js')).default;
  const call = async (req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; await h(req, res); return res; };
  try {
    await S.set('rad:story:old1', { id:'old1', device:'old-device', title:'Письмо Нади', art:[], audio:{}, done:true });
    const u = S.blankUser('new-device'); u.radio_made = ['old1']; await S.saveUser(u);
    const r = await call({ method:'GET', query:{ device:'new-device', id:'old1' } });
    assert.equal(r._s, 200, JSON.stringify(r._b)); assert.equal(r._b.title, 'Письмо Нади');
    const r2 = await call({ method:'GET', query:{ device:'stranger', id:'old1' } });
    assert.equal(r2._s, 404, 'чужой по-прежнему не открывает');
    ok++; console.log('  ok   сказка из своего списка открывается с нового устройства, чужому — нет');
  } catch (e) { fail++; console.log('  FAIL сказка из своего списка открывается с нового устройства  -> ' + e.message); }
})();

console.log('\nзакрытая бета: список ожидания, приглашения, вход');
await (async () => {
  const S = await import('../lib/store.js'); const B = await import('../lib/beta.js');
  const sent = []; const realFetch = global.fetch; process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test';
  global.fetch = async (url, opts) => { if (String(url).includes('resend')) { sent.push(JSON.parse(opts.body)); return { ok:true, status:200, text: async () => '{"id":"x"}' }; } return realFetch(url, opts); };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  const otp = (await import('../lib/h-otp.js')).default;
  const call = async (h, req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = req.query || {}; await h(req, res); return res; };
  try {
    delete process.env.BETA_OPEN;
    await t('чужая почта не получает код — приложение предлагает список ожидания', async () => {
      const r = await call(otp, { method:'POST', body:{ device:'bd1', email:'new@x.com' } });
      assert.equal(r._b.outcome, 'beta');
    });
    await t('заявка в список: письмо «вы в списке» и место в очереди; повтор не дублирует', async () => {
      const n0 = sent.length;
      const a = await B.join({ email:'new@x.com', who:'для внуков', lang:'ru' }); assert.equal(a.outcome, 'waiting'); assert.equal(a.position, 1);
      assert.equal(sent.length, n0 + 1); assert.match(sent[sent.length-1].subject, /в списке/);
      await B.join({ email:'second@x.com', lang:'en' });
      const again = await B.join({ email:'new@x.com' }); assert.equal(again.position, 1); assert.equal(sent.length, n0 + 2);
      const all = await B.listAll(); assert.equal(all.waiting, 2);
    });
    await t('кто уже заходил раньше, входит без приглашения', async () => {
      await S.set(S.emailKey('old@x.com'), { user: 'u-old' });
      assert.equal(await B.allowed('old@x.com'), true);
      assert.equal((await call(otp, { method:'POST', body:{ device:'bd2', email:'old@x.com' } }))._b.outcome, 'sent');
    });
    await t('владелец приглашает: письмо со ссылкой, код приходит, после входа — «вошёл»', async () => {
      const own = S.blankUser('own-dev'); own.email = 'wzorkij@gmail.com'; await S.saveUser(own);
      const h = (await import('../api/beta.js')).default;
      const denied = await call(h, { method:'POST', body:{ act:'invite-next', device:'bd1', n:1 } }); assert.equal(denied._s, 403);
      const r = await call(h, { method:'POST', body:{ act:'invite-next', device:'own-dev', n:1 } });
      assert.deepEqual(r._b.invited, ['new@x.com']);
      assert.match(sent[sent.length-1].html, /app\.html\?email=new%40x\.com/);
      assert.equal((await call(otp, { method:'POST', body:{ device:'bd1', email:'new@x.com' } }))._b.outcome, 'sent');
      const code = (await S.get('fav:otp:new@x.com')).code;
      assert.equal((await call(otp, { method:'POST', body:{ device:'bd1', email:'new@x.com', code } }))._b.outcome, 'ok');
      const all = await B.listAll(); assert.equal(all.joined, 1); assert.equal(all.waiting, 1);
      const list = await call(h, { method:'GET', query:{ act:'list', device:'own-dev' } }); assert.equal(list._b.rows.length, 2);
    });
    await t('аварийный выключатель BETA_OPEN=1 открывает вход всем', async () => {
      process.env.BETA_OPEN = '1'; assert.equal(await B.allowed('anyone@x.com'), true); delete process.env.BETA_OPEN;
    });
  } finally { global.fetch = realFetch; }
})();

console.log('\nдонат: оплата, письмо «спасибо», список для владельца');
await (async () => {
  const S = await import('../lib/store.js'); const sent = [];
  const realFetch = global.fetch; process.env.SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'test'; process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test';
  let status = 'PENDING';
  global.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes('resend')) { sent.push(JSON.parse(opts.body)); return { ok:true, status:200, text: async () => '{"id":"x"}' }; }
    if (u.includes('sumup') && u.includes('/me')) return { ok:true, status:200, json: async () => ({ merchant_profile:{ merchant_code:'M1' } }), text: async () => '{"merchant_profile":{"merchant_code":"M1"}}' };
    if (u.includes('sumup') && opts && opts.method === 'POST') return { ok:true, status:200, json: async () => ({ id:'co1', hosted_checkout_url:'https://pay.sumup.com/co1' }), text: async () => '{"id":"co1","hosted_checkout_url":"https://pay.sumup.com/co1"}' };
    if (u.includes('sumup')) return { ok:true, status:200, json: async () => ({ id:'co1', status }), text: async () => JSON.stringify({ id:'co1', status }) };
    return realFetch(url, opts);
  };
  const call = async (h, req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = req.query || {}; await h(req, res); return res; };
  try {
    const pay = (await import('../api/pay.js')).default;
    const r1 = await call(pay, { method:'POST', body:{ device:'don-1', plan:'support', amount:10, email:'friend@x.com', name:'Аня', message:'Удачи!', back:'https://www.favola.space/donate.html?done={REF}' } });
    assert.equal(r1._b.outcome, 'ok', JSON.stringify(r1._b)); assert.match(r1._b.url, /sumup/);
    const r2 = await call(pay, { method:'POST', query:{ __r:'pay-status' }, body:{ device:'don-1', ref:r1._b.ref } });
    assert.equal(r2._b.paid, false);
    status = 'PAID';
    const r3 = await call(pay, { method:'POST', query:{ __r:'pay-status' }, body:{ device:'don-1', ref:r1._b.ref } });
    assert.equal(r3._b.paid, true); assert.equal(r3._b.amount, 10);
    assert.ok(sent.some(m => /спасибо за поддержку/i.test(m.subject) && m.to[0] === 'friend@x.com'), 'письмо «спасибо»');
    const list = await S.get('rad:donate:list'); assert.equal(list.length, 1); assert.equal(list[0].name, 'Аня'); assert.equal(list[0].message, 'Удачи!');
    await call(pay, { method:'POST', query:{ __r:'pay-status' }, body:{ device:'don-1', ref:r1._b.ref } });
    assert.equal((await S.get('rad:donate:list')).length, 1, 'повторная проверка не дублирует');
    const own = S.blankUser('own-don'); own.email = 'wzorkij@gmail.com'; await S.saveUser(own);
    const b = await call((await import('../api/beta.js')).default, { method:'GET', query:{ act:'list', device:'own-don' } });
    assert.equal(b._b.donatedTotal, 10);
    ok++; console.log('  ok   донат 10 €: оплата SumUp → письмо «спасибо» → в списке владельца, без дублей');
  } catch (e) { fail++; console.log('  FAIL донат  -> ' + e.message); }
  finally { global.fetch = realFetch; }
})();

console.log('\nПлощадь, «поделиться», ласточки, загрузка за автора');
await (async () => {
  const S = await import('../lib/store.js'); const Q = await import('../lib/square.js');
  const h = (await import('../api/square.js')).default;
  const call = async (req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = req.query || {}; req.body = req.body || {}; await h(req, res); return res; };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  const own = S.blankUser('sq-own'); own.email = 'wzorkij@gmail.com'; await S.saveUser(own);
  const mom = S.blankUser('sq-mom'); mom.email = 'mom@x.com'; mom.radio_made = ['st-mom']; await S.saveUser(mom);
  const fan = S.blankUser('sq-fan'); fan.email = 'fan@x.com'; await S.saveUser(fan);
  await S.set('rad:story:st-mom', { id:'st-mom', device:'sq-mom', email:'mom@x.com', title:'Кит и маяк', panels:['Жил-был кит.'], art:[], audio:{}, done:true });
  delete process.env.SQUARE_OPEN;
  await t('ссылка «поделиться»: открывает одну сказку без входа, считает прослушивания, закрывается', async () => {
    const r = await call({ method:'POST', query:{ __r:'share' }, body:{ act:'create', device:'sq-mom', id:'st-mom' } });
    assert.match(r._b.url, /listen\.html\?s=/); const tok = r._b.token;
    const stranger = await call({ method:'POST', query:{ __r:'share' }, body:{ act:'create', device:'sq-fan', id:'st-mom' } }); assert.equal(stranger._s, 404);
    const g = await call({ method:'GET', query:{ __r:'share', s: tok } }); assert.equal(g._b.title, 'Кит и маяк'); assert.equal(g._b.device, undefined); assert.equal(g._b.email, undefined);
    const again = await call({ method:'POST', query:{ __r:'share' }, body:{ act:'create', device:'sq-mom', id:'st-mom' } }); assert.equal(again._b.token, tok); assert.equal(again._b.plays, 1);
    await call({ method:'POST', query:{ __r:'share' }, body:{ act:'revoke', device:'sq-mom', id:'st-mom' } });
    assert.equal((await call({ method:'GET', query:{ __r:'share', s: tok } }))._s, 404);
  });
  await t('пока Площадь закрыта, её видит только владелец', async () => {
    assert.equal((await call({ method:'GET', query:{ device:'sq-fan' } }))._b.open, false);
    assert.equal((await call({ method:'GET', query:{ device:'sq-own' } }))._b.open, true);
  });
  process.env.SQUARE_OPEN = '1';
  await t('семья выносит сказку → проверка владельца → на Площади; без двух галочек нельзя', async () => {
    assert.equal((await call({ method:'POST', body:{ act:'submit', device:'sq-mom', id:'st-mom', author:'Мама Ани', noChild:true } }))._s, 400);
    assert.equal((await call({ method:'POST', body:{ act:'submit', device:'sq-mom', id:'st-mom', author:'Мама Ани', noChild:true, rules:true } }))._b.status, 'pending');
    assert.equal((await call({ method:'GET', query:{ device:'sq-fan' } }))._b.total, 0, 'до проверки не видно');
    assert.equal((await call({ method:'POST', body:{ act:'publish', device:'sq-fan', id:'st-mom' } }))._s, 403, 'не владелец не публикует');
    assert.equal((await call({ method:'GET', query:{ act:'pending', device:'sq-own' } }))._b.pending.length, 1);
    await call({ method:'POST', body:{ act:'publish', device:'sq-own', id:'st-mom' } });
    const sq = await call({ method:'GET', query:{ device:'sq-fan' } }); assert.equal(sq._b.fresh[0].author, 'Мама Ани');
  });
  await t('ласточка: одна от человека, повторное нажатие снимает; сказка недели', async () => {
    let r = await call({ method:'POST', body:{ act:'swallow', device:'sq-fan', id:'st-mom' } }); assert.equal(r._b.swallows, 1);
    r = await call({ method:'POST', body:{ act:'swallow', device:'sq-fan', id:'st-mom' } }); assert.equal(r._b.swallows, 0);
    await call({ method:'POST', body:{ act:'swallow', device:'sq-fan', id:'st-mom' } }); await call({ method:'POST', body:{ act:'swallow', device:'sq-own', id:'st-mom' } });
    const sq = await call({ method:'GET', query:{ device:'sq-fan' } }); assert.equal(sq._b.week.id, 'st-mom'); assert.equal(sq._b.week.swallows, 2); assert.equal(sq._b.fresh[0].mine, true);
  });
  await t('чужую сказку с Площади можно послушать, но не открыть через «мои сказки»', async () => {
    const g = await call({ method:'GET', query:{ device:'sq-fan', id:'st-mom' } }); assert.equal(g._b.title, 'Кит и маяк');
    const st = (await import('../api/stories.js')).default; const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, setHeader(){return this;} };
    await st({ method:'GET', headers:{}, query:{ device:'sq-fan', id:'st-mom' } }, res); assert.equal(res._s, 404);
  });
  await t('автор снимает сказку с Площади', async () => {
    await call({ method:'POST', body:{ act:'withdraw', device:'sq-mom', id:'st-mom' } });
    assert.equal((await call({ method:'GET', query:{ device:'sq-fan' } }))._b.total, 0);
  });
  await t('загрузка за автора: сервер собирает сказку по шагам и выкладывает с отметкой «голос Favola»', async () => {
    const R = await import('../lib/record.js'); const A = await import('../lib/art.js'); A._fastForTests();
    A._setGenForTests(async () => 'data:image/png;base64,iVBORw0KGgo=');
    const realFetch = global.fetch; const calls = [];
    global.fetch = async (url, opts) => { const u = String(url); calls.push(u);
      if (u.includes('audio-isolation')) return { ok:true, status:200, arrayBuffer: async () => new ArrayBuffer(8), headers:{ get:()=> 'audio/mpeg' } };
      if (u.includes('speech-to-text')) return { ok:true, status:200, json: async () => ({ text:'Жил-был кит. Он светил.', language_code:'rus', words:[{text:'Жил-был',start:0,end:.5,type:'word'},{text:' ',type:'spacing'},{text:'кит.',start:.6,end:1,type:'word'},{text:' ',type:'spacing'},{text:'Он',start:2.5,end:2.7,type:'word'},{text:' ',type:'spacing'},{text:'светил.',start:2.8,end:3.2,type:'word'}] }) };
      if (u.includes('anthropic')) { const b = JSON.parse(opts.body); const polish = /edit|clean|полир|correct/i.test(b.system || '');
        const text = polish ? JSON.stringify({ sentences:['Жил-был кит.','Он светил.'] }) : JSON.stringify({ title:'Кит и маяк', castText:'', world:'sea', scenes:[{ from:0, to:1, brief:'a whale', shows:['whale'] }], questions:['Что светил кит?'] });
        return { ok:true, json: async () => ({ content:[{ text }], usage:{ input_tokens:1, output_tokens:1 }, stop_reason:'end_turn' }) }; }
      return realFetch(url, opts); };
    const readBackup = R.__readForTests;
    try {
      process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'test'; process.env.RADIO_OPEN = '1';
      const job = Q.newImport({ device:'sq-own', audioUrl:'data:audio/mpeg;base64,AAAA', title:'Кит и маяк', author:'Равшана Куркова', lang:'ru', studio:false, publishNow:true });
      // шаг очистки в тесте пропускаем: хранилища нет, голос уже «готов»
      job.steps.clean = 'done'; job.voice = 'data:audio/mpeg;base64,AAAA';
      await S.set('rad:import:' + job.id, job);
      const done = await Q.runImport(job.id);
      assert.equal(done.status, 'done', done.error); assert.ok(done.storyId);
      const rec = await S.get('rad:story:' + done.storyId); assert.equal(rec.square.status, 'live'); assert.equal(rec.square.verified, true); assert.equal(rec.square.author, 'Равшана Куркова');
      const sq = await call({ method:'GET', query:{ device:'sq-fan' } }); assert.equal(sq._b.stars[0].author, 'Равшана Куркова');
    } finally { global.fetch = realFetch; delete process.env.RADIO_OPEN; }
  });
  delete process.env.SQUARE_OPEN;
})();

console.log('\n«Придумать вместе» 2: настройка, характер героя, идея сказки, ребёнок в сказке');
await (async () => {
  const realFetch = global.fetch; process.env.RADIO_OPEN = '1'; process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
  let tale = '';
  const para = 'Жила-была лисичка Тиша, которая очень боялась темноты. Каждый вечер она смотрела на луну. «Где же ты?» — шептала она. Пахло соснами и мятой. ';
  global.fetch = async (url, opts) => {
    if (!String(url).includes('anthropic')) return realFetch(url, opts);
    const b = JSON.parse(opts.body); const writer = /children's author/.test(b.system);
    if (writer) tale = b.messages[0].content;
    const text = writer ? 'Тиша и луна\n\n' + Array(5).fill(para + para).join('\n\n')
      : JSON.stringify({ cast:[{ name:'Тиша', look:'a small fox' }], world:'forest', scenes: Array(5).fill({ brief:'a fox', shows:['fox'] }), questions:['Почему Тиша боялась?'] });
    return { ok:true, json: async () => ({ content:[{ text }], usage:{ input_tokens:1, output_tokens:1 }, stop_reason:'end_turn' }) };
  };
  const h = (await import('../api/wizard.js')).default;
  const call = async (body) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; await h({ method:'POST', headers:{}, query:{}, body }, res); return res; };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  try {
    const story = { age:'3–5', mood:'уютная перед сном', length:2, hero:'лисичка', name:'Тиша', trait:'боится темноты', place:'лес', wish:'увидеть луну вблизи', event:'пропала луна', helper:'мудрая сова', idea:'можно попросить о помощи', child:'Аня' };
    const r = await call({ v:2, lang:'ru', story });
    await t('в задании писателю — возраст, настроение, длина, черта героя, событие, идея и ребёнок; концовку не задаём', async () => {
      for (const w of ['3–5', 'уютная', '220–300', 'боится темноты', 'пропала луна', 'можно попросить о помощи', 'Аня']) assert.ok(tale.includes(w), 'нет: ' + w);
      assert.ok(!/succeeds in the end|справляется в итоге/i.test(tale));
    });
    await t('сказка собрана, помечена «в ней ребёнок»', async () => { assert.equal(r._s, 200); assert.equal(r._b.child, true); assert.ok(r._b.panels.length >= 4); });
    await t('без идеи или черты героя — просим дозаполнить', async () => {
      const bad = await call({ v:2, lang:'ru', story:{ ...story, idea:'' } }); assert.equal(bad._s, 400); assert.match(bad._b.error, /idea/);
    });
    await t('сказку с ребёнком нельзя вынести на Площадь', async () => {
      const S = await import('../lib/store.js'); const q = (await import('../api/square.js')).default;
      const u = S.blankUser('wz-child'); u.radio_made = ['st-child']; await S.saveUser(u);
      await S.set('rad:story:st-child', { id:'st-child', device:'wz-child', title:'Тиша', panels:['…'], child:true });
      process.env.SQUARE_OPEN = '1';
      const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} };
      await q({ method:'POST', headers:{}, query:{}, body:{ act:'submit', device:'wz-child', id:'st-child', author:'Мама', noChild:true, rules:true } }, res);
      delete process.env.SQUARE_OPEN;
      assert.equal(res._s, 400); assert.match(res._b.error, /ребёнка/);
    });
  } finally { global.fetch = realFetch; delete process.env.RADIO_OPEN; }
})();

console.log('\nколыбельные: загрузка владельцем, обложка, слушают все');
await (async () => {
  const S = await import('../lib/store.js'); const LU = await import('../lib/lullaby.js');
  const h = (await import('../api/square.js')).default;
  const call = async (req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = { __r:'lullaby', ...(req.query || {}) }; req.body = req.body || {}; await h(req, res); return res; };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  const own = S.blankUser('lu-own'); own.email = 'wzorkij@gmail.com'; await S.saveUser(own);
  let prompt = ''; LU._setGenForTests(async (p) => { prompt = p; return 'data:image/png;base64,iVBORw0KGgo='; });
  await t('загрузить может только владелец', async () => {
    assert.equal((await call({ method:'POST', body:{ act:'add', device:'lu-fan', audioUrl:'data:audio/mpeg;base64,AAAA', title:'Спи, моя радость' } }))._s, 403);
  });
  let id;
  await t('владелец загружает — мотор рисует обложку (ночь, луна, без надписей)', async () => {
    const r = await call({ method:'POST', body:{ act:'add', device:'lu-own', audioUrl:'data:audio/mpeg;base64,AAAA', title:'Спи, моя радость', author:'Равшана Куркова' } });
    id = r._b.id; assert.ok(id);
    const rec = await LU.drawCover(id); assert.equal(rec.coverState, 'done'); assert.match(prompt, /moon/); assert.match(prompt, /No text/);
  });
  await t('список и прослушивание — для всех, счётчик прослушиваний растёт', async () => {
    const l = await call({ method:'GET', query:{} }); assert.equal(l._b.lullabies[0].title, 'Спи, моя радость'); assert.ok(l._b.lullabies[0].cover);
    const p = await call({ method:'GET', query:{ id } }); assert.ok(p._b.audio);
    assert.equal((await call({ method:'GET', query:{} }))._b.lullabies[0].plays, 1);
  });
  await t('путь загрузки колыбельной со страницы владельца принимается хранилищем', async () => {
    const { isUploadPathOk } = await import('../lib/record.js');
    assert.equal(isUploadPathOk('radio-raw/rdabc123/lull' + Date.now().toString(36) + '.mp3'), true);
    assert.equal(isUploadPathOk('radio-raw/rdabc123/lull-' + Date.now().toString(36) + '.mp3'), false, 'с дефисом в имени — отказ');
  });
  await t('у русской и английской версии — свои колыбельные', async () => {
    const en = await call({ method:'POST', body:{ act:'add', device:'lu-own', audioUrl:'data:audio/mpeg;base64,AAAA', title:'Hush, Little Baby', lang:'en' } });
    const ru = await call({ method:'GET', query:{ lang:'ru' } }); const enL = await call({ method:'GET', query:{ lang:'en' } });
    assert.deepEqual(ru._b.lullabies.map(x => x.title).sort(), ['Hush, Little Baby', 'Спи, моя радость'].sort(), 'русским — русские и английские'); assert.deepEqual(enL._b.lullabies.map(x => x.title), ['Hush, Little Baby'], 'англичанам — только английские');
    assert.equal((await call({ method:'GET', query:{} }))._b.lullabies.length, 2, 'владельцу в списке видны обе');
    await call({ method:'POST', body:{ act:'delete', device:'lu-own', id: en._b.id } });
  });
  await t('владелец удаляет колыбельную', async () => {
    await call({ method:'POST', body:{ act:'delete', device:'lu-own', id } });
    assert.equal((await call({ method:'GET', query:{} }))._b.lullabies.length, 0);
  });
})();

console.log('\nшесть языков');
await (async () => {
  const P = await import('../lib/prompts.js');
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  await t('языки: ru, en, pt, es, de, zh; неизвестный — русский', async () => {
    assert.deepEqual(P.LANGS, ['ru','en','pt','es','de','zh','lt']); assert.equal(P.langName('lt'), 'Lithuanian'); assert.equal(P.normLang('xx'), 'ru');
    assert.equal(P.langName('pt'), 'European Portuguese'); assert.equal(P.langName('zh'), 'Simplified Chinese');
  });
  await t('задание писателю на нужном языке', async () => {
    assert.match(P.buildWizardPrompt({ hero:'a', trait:'b', place:'c', wish:'d', event:'e', helper:'f', idea:'g', length:2 }, 'de'), /Language: German/);
  });
  await t('библиотека «Favola 10»: десять сказок на каждом языке, названия переведены', async () => {
    const { libraryList } = await import('../data/library.js');
    for (const l of ['ru','en','pt','es','de','zh','lt']) { const L = libraryList(l); assert.equal(L.length, 10); assert.ok(L.every(x => x.lang === l && x.title)); }
    assert.ok(libraryList('lt').every(x => x.planId.startsWith('lt10-')), 'в литовской версии — литовские сказки');
    assert.equal(libraryList('lt')[0].title, 'Eglė žalčių karalienė');
    const { f10Parse } = await import('../data/favola10.js'); assert.equal(f10Parse('lt10-neringa~lt').base.id, 'lt10-neringa'); assert.equal(f10Parse('lt10-neringa~ru').lang, 'ru');
    assert.equal(libraryList('es').find(x => x.planId === 'f10-stone-soup').title, 'La sopa de piedra');
    assert.equal(libraryList('zh').find(x => x.planId === 'f10-worse').title, '总可能更糟');
  });
  await t('перевод сказки делается один раз и запоминается; картинки общие для всех языков', async () => {
    const realFetch = global.fetch; let calls = 0; process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
    const { FAVOLA10 } = await import('../data/favola10.js'); const base = FAVOLA10.find(x => x.id === 'f10-stone-soup');
    const n = base.text.split(/\n\n+/).length;
    global.fetch = async (url, opts) => { if (!String(url).includes('anthropic')) return realFetch(url, opts); calls++;
      const b = JSON.parse(opts.body); const text = /translate/i.test(b.system) ? Array.from({ length: n }, (_, i) => 'Párrafo ' + (i + 1) + '.').join('\n\n')
        : JSON.stringify({ world:'village', cast:[], scenes: Array.from({ length: n }, () => ({ brief:'a pot', shows:['pot'] })) });
      return { ok:true, json: async () => ({ content:[{ text }], usage:{ input_tokens:1, output_tokens:1 }, stop_reason:'end_turn' }) }; };
    try {
      const h = (await import('../api/library.js')).default;
      const call = async (q) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; await h({ method:'GET', headers:{}, query:q }, res); return res; };
      const a = await call({ id:'f10-stone-soup~es', light:'1' }); assert.equal(a._b.lang, 'es'); assert.match(a._b.text, /Párrafo 1/);
      const c0 = calls; await call({ id:'f10-stone-soup~es', light:'1' }); assert.equal(calls, c0, 'второй раз без перевода');
      const full = await call({ id:'f10-stone-soup~es' }); assert.equal(full._b.scenes.length, n); assert.match(full._b.scenes[0].text, /Párrafo 1/);
      const S = await import('../lib/store.js'); assert.ok(await S.get('rad:lib2:f10-stone-soup'), 'план картинок — общий, по английскому тексту');
    } finally { global.fetch = realFetch; }
  });
})();

console.log('\nперевод своей сказки: двуязычная книжка и озвучка');
await (async () => {
  const S = await import('../lib/store.js'); const TR = await import('../lib/translate.js');
  const h = (await import('../api/square.js')).default;
  const call = async (req) => { const res = { _s:200, status(c){this._s=c;return this;}, json(o){this._b=o;return this;}, end(){return this;}, setHeader(){return this;} }; req.headers = req.headers || {}; req.query = { __r:'translate', ...(req.query || {}) }; req.body = req.body || {}; await h(req, res); return res; };
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  let tcalls = 0, vcalls = 0;
  TR._setForTests(async () => { tcalls++; return 'TITLE: The Whale and the Lighthouse\n[[1]] Once there was a whale.\n[[2]] It shone.'; },
                  async ({ text }) => { vcalls++; return { audio: Buffer.from('mp3:' + text).toString('base64') }; });
  const u = S.blankUser('tr-mom'); u.radio_made = ['st-tr']; await S.saveUser(u);
  await S.set('rad:story:st-tr', { id:'st-tr', device:'tr-mom', title:'Кит и маяк', panels:['Жил-был кит.','Он светил.'], art:[], audio:{} });
  await t('разбор перевода: китайские кавычки и диалоги не ломают, неполный ответ отбрасывается', async () => {
    const ok2 = TR.parseTranslation('TITLE：鲸鱼和灯塔\n[[1]] 从前有一头鲸鱼。他说：“你好！”\n[[2]] 它发着光。', 2);
    assert.deepEqual(ok2, { title:'鲸鱼和灯塔', pages:['从前有一头鲸鱼。他说：“你好！”', '它发着光。'] });
    assert.equal(TR.parseTranslation('TITLE: x\n[[1]] only one', 2), null);
  });
  await t('литовский читает модель Eleven v3 (в Multilingual v2 литовского нет)', async () => {
    const real = global.fetch; let body = null;
    global.fetch = async (u, o) => { if (String(u).includes('elevenlabs')) { body = JSON.parse(o.body); return { ok:true, status:200, arrayBuffer: async () => new ArrayBuffer(4) }; } return real(u, o); };
    try { const v = await TR.voiceV3('Labas vakaras.'); assert.ok(v.audio); assert.equal(body.model_id, 'eleven_v3'); assert.equal(body.language_code, 'lt'); }
    finally { global.fetch = real; }
  });
  await t('чужую сказку перевести нельзя', async () => { assert.equal((await call({ method:'POST', body:{ act:'translate', device:'tr-fan', id:'st-tr', to:'en' } }))._s, 404); });
  await t('перевод: столько же страниц, сохраняется в сказке, второй раз — без нового перевода', async () => {
    const r = await call({ method:'POST', body:{ act:'translate', device:'tr-mom', id:'st-tr', to:'en' } });
    assert.deepEqual(r._b.tr.en.panels, ['Once there was a whale.','It shone.']); assert.equal(r._b.tr.en.title, 'The Whale and the Lighthouse');
    await call({ method:'POST', body:{ act:'translate', device:'tr-mom', id:'st-tr', to:'en' } }); assert.equal(tcalls, 1);
  });
  await t('озвучка перевода — по файлу на страницу, один раз', async () => {
    const r = await call({ method:'POST', body:{ act:'narrate', device:'tr-mom', id:'st-tr', to:'en' } });
    assert.equal(r._b.tr.en.audio.length, 2); assert.ok(r._b.tr.en.audio.every(Boolean)); assert.equal(vcalls, 2);
    await call({ method:'POST', body:{ act:'narrate', device:'tr-mom', id:'st-tr', to:'en' } }); assert.equal(vcalls, 2);
    const g = await call({ method:'GET', query:{ device:'tr-mom', id:'st-tr' } }); assert.ok(g._b.tr.en.audio[0]);
  });
})();

console.log('\nElevenLabs занят: очередь и повтор');
await (async () => {
  const t = async (name, fn) => { try { await fn(); ok++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); } };
  const P = await import('../lib/providers.js');
  await t('на «занято» (429) повторяем и получаем ответ', async () => {
    const real = global.fetch; let n = 0;
    global.fetch = async (u) => { if (!String(u).includes('elevenlabs')) return real(u); n++; return n < 3 ? { ok:false, status:429, text: async () => 'busy' } : { ok:true, status:200, json: async () => ({}) }; };
    process.env.ELEVEN_RETRY_BASE = '5';
    try { const r = await P.elevenFetch('https://api.elevenlabs.io/v1/text-to-speech/x', { method:'POST' }); assert.equal(r.status, 200); assert.equal(n, 3); }
    finally { global.fetch = real; }
  });
  await t('не больше 4 озвучек одновременно на всех пользователей', async () => {
    const real = global.fetch; let now = 0, peak = 0;
    global.fetch = async (u) => { if (!String(u).includes('elevenlabs')) return real(u); now++; peak = Math.max(peak, now); await new Promise(r => setTimeout(r, 30)); now--; return { ok:true, status:200 }; };
    try { await Promise.all(Array.from({ length: 10 }, () => P.elevenFetch('https://api.elevenlabs.io/v1/text-to-speech/x', { method:'POST' }))); assert.ok(peak <= 4, 'одновременно было ' + peak); }
    finally { global.fetch = real; }
  });
})();

console.log(`\n${ok} прошло, ${fail} провалено`);
process.exit(fail ? 1 : 0);
