/* ============================================================
   engine.js — מנוע משותף לתרגול החשבון
   • ניקוד ושלבים (נשמר במכשיר), חגיגת אליפות
   • דיבור בעברית, צלילים, קונפטי
   • עוזרי גיאומטריה: סיווג משולשים, חישוב זוויות, ציור SVG
   ============================================================ */

/* ---------- דיבור (עברית, פנייה לבת) ---------- */
let VOICES = [];
function loadVoices() { VOICES = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
/* בוחר את הקול הכי טבעי שיש (Google / Natural / Neural) ולא את הקול
   הרובוטי של מיקרוסופט, כדי שיישמע אנושי ולא כמו מכונה. */
function pickVoice(lang) {
  if (!VOICES.length) loadVoices();
  const pref = lang.slice(0, 2).toLowerCase();
  const cands = VOICES.filter(v => v.lang && v.lang.toLowerCase().startsWith(pref));
  if (!cands.length) return null;
  const score = v => {
    const n = (v.name || "").toLowerCase();
    let s = 0;
    if (n.includes("google")) s += 100;          // Chrome/Edge — הכי טבעי
    if (n.includes("natural") || n.includes("neural")) s += 80;
    if (n.includes("carmit")) s += 50;            // iOS/macOS — קול נעים
    if (n.includes("online")) s += 20;
    if (v.localService === false) s += 15;        // קולות ענן בד"כ איכותיים יותר
    if (n.includes("asaf")) s += 3;               // מיקרוסופט — עדיף על כלום
    return s;
  };
  return cands.slice().sort((a, b) => score(b) - score(a))[0];
}
/* "קריאה טבעית" בלבד — בלי לשנות את נוסח המשפט. הופך סימנים/מקפים לאופן
   שבו קוראים אותם בקול, כך שמה שנשמע זהה למה שכתוב על המסך:
   • "מ-90" -> "מתשעים", "מ-180" -> "ממאה ושמונים" (במקום מקף שנשמע כהפסקה)
   • "°" -> "מעלות"
   • מקף עברי (־) בין מילים -> רווח, כדי ש"שווה־שוקיים" ייקרא ברצף */
function forSpeech(t) {
  return String(t)
    .replace(/מ-90/g, "מתשעים")
    .replace(/מ-180/g, "ממאה ושמונים")
    .replace(/°/g, " מעלות")
    .replace(/־/g, " ");
}
function speakHe(text, { rate = 0.95, pitch = 1.05 } = {}) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(forSpeech(text));
    u.lang = "he-IL"; u.rate = rate; u.pitch = pitch;
    const v = pickVoice("he-IL"); if (v) u.voice = v;
    u.onend = resolve; u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

/* ---------- צלילים (Web Audio — בלי קבצים) ---------- */
let AC;
function audio() { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function tone(freq, t0, dur, type = "sine", vol = 0.2) {
  const ac = audio();
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  const start = ac.currentTime + t0;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start); o.stop(start + dur + 0.02);
}
function soundCorrect() { try { tone(523, 0, 0.15); tone(659, 0.12, 0.15); tone(784, 0.24, 0.25); } catch (e) {} }
function soundWin()     { try { [523,659,784,1046].forEach((f,i)=>tone(f,i*0.12,0.3)); } catch (e) {} }
function soundTry()     { try { tone(330, 0, 0.18, "triangle", 0.15); tone(247, 0.16, 0.25, "triangle", 0.15); } catch (e) {} }
function soundPop()     { try { tone(660, 0, 0.08, "square", 0.12); } catch (e) {} }
function soundLevelUp() { try { tone(880, 0, 0.08, "sine", 0.1); } catch (e) {} }

/* ---------- קונפטי ---------- */
function confetti(n = 120) {
  let c = document.getElementById("confetti");
  if (!c) { c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c); }
  const ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const cols = ["#ff5d8f","#ffd23f","#3ddc84","#4d8bff","#9b5de5","#ff9f68","#20c4c4"];
  const P = Array.from({ length: n }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    r: 5 + Math.random() * 8, c: cols[(Math.random() * cols.length) | 0],
    vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, a: Math.random() * 6,
  }));
  let frames = 0;
  (function run() {
    ctx.clearRect(0, 0, c.width, c.height);
    P.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.a += 0.1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore();
    });
    if (frames++ < 140) requestAnimationFrame(run);
    else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

/* ---------- התקדמות מתמשכת (נשמר במכשיר) ----------
   כל תשובה נכונה = נקודה / שלב. CHAMP_AT נקודות = אליפות 🏆.
*/
const CHAMP_AT = 100;
const Progress = {
  key(p) { return "mg_progress_" + p; },
  fresh() { return { points: 0, championships: 0, best: 0, days: {} }; },
  load(p) {
    try { return Object.assign(this.fresh(), JSON.parse(localStorage.getItem(this.key(p))) || {}); }
    catch (e) { return this.fresh(); }
  },
  save(p, d) { try { localStorage.setItem(this.key(p), JSON.stringify(d)); } catch (e) {} },
  today() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },
  add(p, k = 1) {
    const d = this.load(p);
    d.points += k;
    const t = this.today();
    d.days[t] = (d.days[t] || 0) + k;
    let champ = false;
    if (d.points >= CHAMP_AT) { d.points -= CHAMP_AT; d.championships += 1; champ = true; }
    if (d.points > d.best) d.best = d.points;
    this.save(p, d);
    return { champ, points: d.points, championships: d.championships };
  },
};

const Score = {
  el: null, player: null,
  init(el, player) { this.el = el; this.player = player; this.render(Progress.load(player).points); },
  add(k = 1) {
    const r = Progress.add(this.player, k);
    this.render(r.points);
    if (this.el) { this.el.style.transform = "scale(1.25)"; setTimeout(() => (this.el.style.transform = ""), 180); }
    soundLevelUp();
    if (r.champ) celebrateChampionship(r.championships);
    return r;
  },
  render(n) { if (this.el) this.el.textContent = "⭐ " + n + " / " + CHAMP_AT; },
};

function celebrateChampionship(num) {
  soundWin(); confetti(220);
  const ov = el("div", "champ-overlay");
  const card = el("div", "champ-card");
  card.innerHTML = `<div class="cup">🏆</div><h2>את אלופה!</h2>` +
    `<p>זאת אליפות מספר ${num}! 🎉<br>הנקודות מתאפסות — קדימה לאליפות הבאה!</p>`;
  const btn = el("button", "action next", "יאללה! 🎈");
  btn.onclick = () => ov.remove();
  card.appendChild(btn); ov.appendChild(card); document.body.appendChild(ov);
  setTimeout(() => confetti(160), 600);
  speakHe("כל הכבוד! את אלופה!");
}

function renderProgress(container, player) {
  const d = Progress.load(player);
  container.innerHTML = "";
  container.appendChild(el("div", "prompt-he", "כל הדרך לאליפות! 🏆"));
  container.appendChild(el("div", "level-badge", "⭐ " + d.points));
  container.appendChild(el("div", "level-cap", "שלב " + d.points + " / " + CHAMP_AT));
  const bar = el("div", "bar");
  const fill = el("i"); fill.style.width = Math.min(100, (d.points / CHAMP_AT) * 100) + "%";
  bar.appendChild(fill); container.appendChild(bar);
  container.appendChild(el("div", "level-cap", "האליפויות שלך:"));
  const tr = el("div", "trophies");
  if (d.championships > 0) tr.innerHTML = "🏆".repeat(Math.min(d.championships, 20)) + (d.championships > 20 ? " ×" + d.championships : "");
  else tr.innerHTML = `<span class="none">עוד אין — הראשונה בדרך!</span>`;
  container.appendChild(tr);
  const dates = Object.keys(d.days).sort().reverse();
  const table = el("table", "days-table");
  table.innerHTML = `<tr><th>תאריך</th><th>נקודות</th></tr>`;
  if (dates.length === 0) {
    const row = el("tr"); row.innerHTML = `<td colspan="2" class="days-empty">עדיין אין נקודות — אפשר להתחיל!</td>`;
    table.appendChild(row);
  } else {
    const today = Progress.today();
    dates.slice(0, 14).forEach(dt => {
      const [, m, day] = dt.split("-");
      const row = el("tr", dt === today ? "today" : "");
      const label = `${day}/${m}` + (dt === today ? " (היום)" : "");
      row.innerHTML = `<td>${label}</td><td class="pts">${d.days[dt]} ⭐</td>`;
      table.appendChild(row);
    });
  }
  container.appendChild(table);
}

/* ---------- עוזרים כלליים ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function sample(arr, k) { return shuffle(arr).slice(0, k); }
function randItem(arr) { return arr[(Math.random() * arr.length) | 0]; }

/* בחירה ללא חזרה: עוברים על כל פריטי המאגר לפני שחוזרים, וגם
   לא חוזרים על אותו פריט בגבול בין "שק" ל"שק". מפתח לפי הפניית המערך. */
const _bags = new Map(), _bagLast = new Map();
function bagItem(arr) {
  if (!arr || arr.length === 0) return undefined;
  if (arr.length === 1) return arr[0];
  let bag = _bags.get(arr);
  if (!bag || bag.length === 0) {
    bag = shuffle(arr);
    if (bag[bag.length - 1] === _bagLast.get(arr)) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    _bags.set(arr, bag);
  }
  const it = bag.pop();
  _bagLast.set(arr, it);
  return it;
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
function primeAudio() { try { audio().resume(); } catch (e) {} if (window.speechSynthesis) speechSynthesis.resume(); }
document.addEventListener("pointerdown", primeAudio, { once: true });

/* ============================================================
   גיאומטריה — מקור אמת אחד: כל סיווג מחושב מהקואורדינטות.
   ============================================================ */
function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }

/* זווית (במעלות) בקודקוד b, בין הקטעים b→a ל-b→c */
function angleAt(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]) || 1;
  return Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180 / Math.PI;
}

/* סיווג משולש לפי צלעות וזוויות מתוך 3 קודקודים */
function classifyTriangle(pts) {
  const [A, B, C] = pts;
  const a = dist(B, C), b = dist(C, A), c = dist(A, B);
  const mx = Math.max(a, b, c);
  const eq = (x, y) => Math.abs(x - y) <= 0.07 * mx;
  let equalPairs = 0;
  if (eq(a, b)) equalPairs++;
  if (eq(b, c)) equalPairs++;
  if (eq(a, c)) equalPairs++;
  let sides;
  if (equalPairs >= 3) sides = "equilateral";
  else if (equalPairs >= 1) sides = "isosceles";
  else sides = "scalene";
  const angA = angleAt(B, A, C), angB = angleAt(A, B, C), angC = angleAt(A, C, B);
  const maxAng = Math.max(angA, angB, angC);
  let angles;
  if (Math.abs(maxAng - 90) <= 4) angles = "right";
  else if (maxAng > 90) angles = "obtuse";
  else angles = "acute";
  return { sides, angles };
}

/* זוויות פנימיות (במעלות) של מצולע נתון לפי הסדר */
function polygonAngles(pts) {
  const n = pts.length;
  return pts.map((p, i) => angleAt(pts[(i - 1 + n) % n], p, pts[(i + 1) % n]));
}

/* ---------- ציור SVG ---------- */
function svgBox(pts, pad = 36) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  return { minx, miny, w: (maxx - minx) + pad * 2, h: (maxy - miny) + pad * 2, pad };
}

/* מצולע (משולש/מרובע). labels — סימון זווית סטנדרטי: קשת קטנה בכל קודקוד
   והמספר בתוך הצורה ליד הקשת, בלי להסתיר את הקודקוד. fill — צבע מילוי */
function polygonSvg(pts, { labels, fill = "#dbeafe" } = {}) {
  const box = svgBox(pts);
  const vb = `${box.minx - box.pad} ${box.miny - box.pad} ${box.w} ${box.h}`;
  const poly = pts.map(p => p.join(",")).join(" ");
  const uvec = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; };
  let extra = "";
  if (labels) {
    const n = pts.length;
    pts.forEach((p, i) => {
      const prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
      const u1 = uvec(p, prev), u2 = uvec(p, next);
      let a1 = Math.atan2(u1[1], u1[0]), a2 = Math.atan2(u2[1], u2[0]);
      let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
      const r = 22, steps = 16, arc = [];
      for (let s = 0; s <= steps; s++) { const t = a1 + d * s / steps; arc.push((p[0] + r * Math.cos(t)).toFixed(1) + "," + (p[1] + r * Math.sin(t)).toFixed(1)); }
      extra += `<polyline points="${arc.join(" ")}" fill="none" stroke="#9b5de5" stroke-width="3"/>`;
      const bis = a1 + d / 2, lr = r + 17;
      const lx = p[0] + lr * Math.cos(bis), ly = p[1] + lr * Math.sin(bis);
      extra += `<circle cx="${lx}" cy="${ly}" r="13" fill="#fff" stroke="#9b5de5" stroke-width="2"/>`
             + `<text x="${lx}" y="${ly + 6}" text-anchor="middle" font-size="18" font-weight="800" fill="#9b5de5">${labels[i]}</text>`;
    });
  }
  return `<svg viewBox="${vb}" class="shape-svg"><polygon points="${poly}" fill="${fill}" `
       + `stroke="#2b2140" stroke-width="3" stroke-linejoin="round"/>${extra}</svg>`;
}

/* ציור זווית בודדת בגודל deg מעלות */
function angleSvg(deg) {
  const V = [40, 150], len = 132;
  const r1 = [V[0] + len, V[1]];
  const rad = deg * Math.PI / 180;
  const r2 = [V[0] + len * Math.cos(-rad), V[1] + len * Math.sin(-rad)];
  const box = svgBox([V, r1, r2], 30);
  const vb = `${box.minx - box.pad} ${box.miny - box.pad} ${box.w} ${box.h}`;
  // קשת/ריבוע סימון
  let mark;
  if (Math.abs(deg - 90) < 1) {
    const s = 26;
    mark = `<path d="M ${V[0] + s} ${V[1]} L ${V[0] + s} ${V[1] - s} L ${V[0]} ${V[1] - s}" fill="none" stroke="#ff5d8f" stroke-width="3"/>`;
  } else {
    const ar = 34;
    const a1 = [V[0] + ar, V[1]];
    const a2 = [V[0] + ar * Math.cos(-rad), V[1] + ar * Math.sin(-rad)];
    mark = `<path d="M ${a1[0]} ${a1[1]} A ${ar} ${ar} 0 0 0 ${a2[0]} ${a2[1]}" fill="none" stroke="#ff5d8f" stroke-width="3"/>`;
  }
  const line = (p) => `<line x1="${V[0]}" y1="${V[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#2b2140" stroke-width="4" stroke-linecap="round"/>`;
  return `<svg viewBox="${vb}" class="shape-svg">${line(r1)}${line(r2)}${mark}`
       + `<circle cx="${V[0]}" cy="${V[1]}" r="5" fill="#2b2140"/></svg>`;
}
