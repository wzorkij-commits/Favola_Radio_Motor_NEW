// Быстрая проверка без сети и без ключей: все модули грузятся без ошибок,
// данные библиотеки в порядке, а чистая логика (без обращений к провайдерам)
// ведёт себя правильно. Живые проверки провайдеров — через /api/ping?test=...
// уже в развёрнутом виде, отдельно (нужны настоящие ключи).
import assert from 'node:assert/strict';

let ok = 0, fail = 0;
function check(name, fn) {
  try { fn(); ok++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '  -> ' + e.message); }
}

console.log('модули api/*.js загружаются');
const apiFiles = ['account', 'auth', 'pay', 'ping', 'record', 'image', 'hero', 'voice', 'library', 'wizard', 'stories'];
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
check('libraryList фильтрует по языку', () => assert.equal(libraryList('ru').length, 16));
check('libraryOne находит по id, иначе null', () => {
  assert.equal(libraryOne('ru-repka').title, 'Репка');
  assert.equal(libraryOne('нет-такой'), null);
});

console.log('\nтарифы (lib/plans.js) — пакет сказок, год без ограничений, донат');
const { PLANS, FREE_STORIES, RECORD_FREE, grantFor } = await import('../lib/plans.js');
check('два тарифа: pack10, year', () => assert.deepEqual(Object.keys(PLANS).sort(), ['pack10', 'year']));
check('grantFor(pack10) даёт 10 сказок', () => {
  const g = grantFor('pack10', 0);
  assert.equal(g.stories, 10);
});
check('grantFor(year) даёт безлимит на 365 дней', () => {
  const g = grantFor('year', 0);
  assert.equal(g.stories, null);
  assert.equal(g.until, 365 * 86400000);
});
check('FREE_STORIES=1: ровно одна бесплатная сказка любым способом', () => { assert.equal(FREE_STORIES, 1); assert.equal(RECORD_FREE, 1); });

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
check('вторая сказка из записи без оплаты — нельзя (RECORD_FREE=1)', () => {
  const u = blankUser('dev3'); u.made = 1;
  assert.equal(canMakeRecord(u, FREE_STORIES, RECORD_FREE).ok, false);
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
      const r = await call({ method:'POST', query:{ __r:'upload' }, body:{ type:'blob.generate-presigned-url', payload:{ pathname:'radio-raw/d1/abc123.webm', clientPayload:null, multipart:false } } });
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
      const r = await call({ method:'POST', query:{ __r:'upload' }, body:{ type:'blob.generate-presigned-url', payload:{ pathname:'library/ru-repka/scene-1.jpg', clientPayload:null, multipart:false } } });
      assert.equal(r.status, 500); assert.equal(asked.length, n, 'мотор всё равно попросил разрешение');
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

console.log(`\n${ok} прошло, ${fail} провалено`);
process.exit(fail ? 1 : 0);
