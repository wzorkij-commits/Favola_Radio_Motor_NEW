// Файлы сказок: картинки и дорожки. В базу они не помещаются и не должны:
// база для описи, файлы — в файловом хранилище.
//
// Пишем по одному файлу за запрос. У функций Vercel потолок тела запроса
// 4,5 МБ, а целая сказка весит около четырёх — впритык, и однажды не влезет.
// По одному кадру это триста килобайт, запас десятикратный.

let putFn = null, delFn = null, getFn = null;

async function sdk() {
  if (putFn) return { put: putFn, del: delFn, get: getFn };
  const m = await import('@vercel/blob');
  putFn = m.put; delFn = m.del; getFn = m.get;
  return { put: putFn, del: delFn, get: getFn };
}

/**
 * Прочитать файл из нашего хранилища. Сначала как обычную ссылку; если хранилище
 * не отдаёт файл без пропуска (403/401 — так бывает у закрытого хранилища или
 * у файлов, загруженных новым способом), читаем через библиотеку Vercel Blob
 * с пропуском проекта.
 * @returns {Promise<{buffer: Buffer, mime: string, via: string}>}
 */
export async function readFile(url) {
  let status = 0;
  try {
    const f = await fetch(url);
    status = f.status;
    if (f.ok) return { buffer: Buffer.from(await f.arrayBuffer()), mime: (f.headers.get('content-type') || '').split(';')[0], via: 'link' };
  } catch (e) { status = -1; }
  if (!BLOB_READY()) throw new Error('файл не скачался из хранилища: ' + status);
  const { get } = await sdk();
  let lastErr = '';
  for (const access of ['private', 'public']) {
    try {
      const r = await get(url, { access, useCache: false });
      if (r && r.statusCode === 200 && r.stream) {
        const buffer = Buffer.from(await new Response(r.stream).arrayBuffer());
        return { buffer, mime: (r.blob && r.blob.contentType) || '', via: 'sdk-' + access };
      }
      lastErr = r ? 'ответ ' + r.statusCode : 'файла нет';
    } catch (e) { lastErr = String(e.message || e); }
  }
  throw new Error('файл не скачался из хранилища: ' + status + ' (и с пропуском: ' + lastErr.slice(0, 160) + ')');
}

// Хранилище считается подключённым, если есть либо старый ключ BLOB_READ_WRITE_TOKEN,
// либо новый набор: BLOB_STORE_ID (Vercel сам выдаёт короткий пропуск на время работы функции).
// Пропуск на прямую загрузку из телефона выдаётся только по полному ключу хранилища.
export const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN || null;

export const BLOB_READY = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/**
 * @param {string} path  куда класть, например stories/<id>/panel-1.jpg
 * @param {Buffer} data
 * @returns {Promise<string>} постоянный адрес файла
 */
export async function putFile(path, data, contentType) {
  if (!BLOB_READY()) throw new Error('файловое хранилище не подключено: нет BLOB_READ_WRITE_TOKEN и нет BLOB_STORE_ID');
  const { put } = await sdk();
  const b = await put(path, data, {
    access: 'public',              // ссылка угадывается только вместе со случайным хвостом
    addRandomSuffix: true,
    contentType
  });
  return b.url;
}

export async function deleteFiles(urls) {
  if (!BLOB_READY() || !urls || !urls.length) return;
  const { del } = await sdk();
  try { await del(urls); } catch (e) { /* уже удалено — не беда */ }
}

/** data:image/jpeg;base64,.... -> { buffer, type, ext } */
export function fromDataUrl(s) {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(String(s || ''));
  if (!m) throw new Error('это не файл в виде строки');
  const type = m[1];
  const ext = type.includes('jpeg') ? 'jpg'
            : type.includes('png')  ? 'png'
            : type.includes('webp') ? 'webp'
            : type.includes('mpeg') ? 'mp3'
            : type.includes('mp4')  ? 'm4a' : 'bin';
  return { buffer: Buffer.from(m[2], 'base64'), type, ext };
}
