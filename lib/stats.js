// Статистика для владельца и инвесторов: люди, сказки, возврат за второй сказкой, деньги.
// Считается по уже имеющимся данным (аккаунты, сказки, платежи), кешируется на минуту.
import { get, set, scanKeys, userKey } from './store.js';

const DAY = 86400000;
const dayKey = t => new Date(t).toISOString().slice(0, 10);

export async function computeStats({ fresh } = {}){
  if (!fresh) { const c = await get('rad:stats:cache'); if (c && Date.now() - c.at < 60000) return c.data; }
  const now = Date.now();
  const keys = await scanKeys(userKey(''));
  // аккаунты одной почты (разные устройства) склеиваем в одного человека
  const people = new Map(); let anon = 0;
  for (const k of keys){
    const u = await get(k); if (!u) continue;
    if (!u.email && !u.google) { anon++; continue; }
    const id = u.email || ('g:' + u.google);
    const p = people.get(id) || { id, stories: new Set(), pays: new Map(), founder: false, gift: false };
    for (const sid of (u.radio_made || [])) p.stories.add(sid);
    for (const pay of (u.payments || [])) if (pay.status === 'PAID') p.pays.set(pay.ref, pay);
    if (u.founder) p.founder = true;
    if (u.plan === 'gift' || u.plan === 'promo') p.gift = true;
    people.set(id, p);
  }
  // даты регистрации — из списка беты/регистраций
  const list = (await get('rad:beta:list')) || [];
  const joinedAt = new Map();
  for (const m of list){ const r = await get('rad:beta:req:' + m); if (r && r.status === 'joined') joinedAt.set(m, r.joinedAt || r.at); }
  // сказки: время и способ
  const daily = new Map(); for (let i = 13; i >= 0; i--) daily.set(dayKey(now - i * DAY), { signups: 0, stories: 0 });
  const byKind = { record: 0, library: 0, wizard: 0 };
  let storiesTotal = 0, stories7 = 0, madeOne = 0, madeTwo = 0, returned = 0, payers = 0, revenue = 0, revenue7 = 0, donations = 0, donationSum = 0, founders = 0, gifts = 0;
  const byPlan = {};
  for (const p of people.values()){
    const times = [];
    for (const sid of p.stories){
      const r = await get('rad:story:' + sid); if (!r) continue;
      storiesTotal++; times.push(r.at || 0);
      if (byKind[r.kind] !== undefined) byKind[r.kind]++;
      if (now - (r.at || 0) < 7 * DAY) stories7++;
      const d = daily.get(dayKey(r.at || 0)); if (d) d.stories++;
    }
    times.sort((a, b) => a - b);
    if (times.length >= 1) madeOne++;
    if (times.length >= 2) { madeTwo++; if (dayKey(times[1]) !== dayKey(times[0])) returned++; }   // вторая сказка — в другой день
    let paid = false;
    for (const pay of p.pays.values()){
      if (pay.plan === 'support') { donations++; donationSum += Number(pay.amount) || 0; continue; }
      paid = true; revenue += Number(pay.amount) || 0; if (now - (pay.paidAt || pay.at || 0) < 7 * DAY) revenue7 += Number(pay.amount) || 0;
      byPlan[pay.plan] = (byPlan[pay.plan] || 0) + 1;
    }
    if (paid) payers++;
    if (p.founder) founders++;
    if (p.gift) gifts++;
    const j = joinedAt.get(p.id); if (j) { const d = daily.get(dayKey(j)); if (d) d.signups++; }
  }
  const users = people.size;
  const new7 = [...joinedAt.values()].filter(t => now - t < 7 * DAY).length;
  const pct = (a, b) => b ? Math.round(a * 1000 / b) / 10 : 0;
  const data = {
    at: now,
    users: { total: users, new7, anon, withStory: madeOne, activation: pct(madeOne, users) },
    stories: { total: storiesTotal, d7: stories7, perUser: users ? Math.round(storiesTotal * 10 / users) / 10 : 0, byKind },
    retention: { madeOne, madeTwo, returned, rate: pct(returned, madeOne), twoPlusRate: pct(madeTwo, madeOne) },
    money: { payers, conversion: pct(payers, users), revenue: Math.round(revenue * 100) / 100, revenue7: Math.round(revenue7 * 100) / 100,
      avgCheck: payers ? Math.round(revenue * 100 / payers) / 100 : 0, donations, donationSum: Math.round(donationSum * 100) / 100, founders, gifts, byPlan },
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v }))
  };
  await set('rad:stats:cache', { at: now, data });
  return data;
}
