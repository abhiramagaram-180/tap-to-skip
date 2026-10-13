// Shared data layer + helpers. Works with Supabase, or localStorage (demo mode) if config.js is empty.
const TTS = (function () {
  const MEALS = ["breakfast", "lunch", "dinner"];
  const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
  const CREDIT_PER_SKIP = 12.5;
  const COST_PER_MEAL = 25;
  const BUFFER = 0.05;
  const LS_KEY = "tts_skips_v1";

  const url = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : "";
  const key = typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : "";
  const demo = !(url && key);
  let sb = null;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------- dates ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseDate(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function monthPrefix(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }

  // Cutoff: breakfast 10pm the night before, lunch 10am, dinner 4pm same day.
  function cutoff(meal, dateS) {
    const d = parseDate(dateS);
    if (meal === "breakfast") return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 22, 0, 0);
    if (meal === "lunch") return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0, 0);
  }

  function countdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (d > 0) return d + "d " + h + "h " + pad(m) + "m";
    return pad(h) + ":" + pad(m) + ":" + pad(sec);
  }

  function inr(x) { return "₹" + x.toFixed(2); }
  function inr0(x) { return "₹" + Math.round(x).toLocaleString("en-IN"); }
  function cookFor(residents, skips) { return Math.ceil((residents - skips) * (1 + BUFFER) - 1e-9); }

  // ---------- storage ----------
  function lsRead() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; }
  }
  function lsWrite(rows) { localStorage.setItem(LS_KEY, JSON.stringify(rows)); }
  const sameKey = (a, b) => a.resident_id === b.resident_id && a.meal === b.meal && a.meal_date === b.meal_date;

  let listeners = [];
  function notifyLocal() { listeners.forEach(function (f) { f(); }); }

  async function init() {
    if (demo) return;
    if (!window.supabase) {
      await new Promise(function (resolve, reject) {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = resolve;
        s.onerror = function () { reject(new Error("Could not load supabase-js")); };
        document.head.appendChild(s);
      });
    }
    sb = window.supabase.createClient(url, key);
  }

  async function list() {
    if (demo) return lsRead();
    const r = await sb.from("skips").select("*").order("created_at", { ascending: false }).range(0, 9999);
    if (r.error) throw r.error;
    return r.data;
  }

  async function add(resident, meal, meal_date) {
    const row = {
      resident_id: resident.id, resident_name: resident.name, room: resident.room,
      meal: meal, meal_date: meal_date
    };
    if (demo) {
      const rows = lsRead();
      if (!rows.some(function (r) { return sameKey(r, row); })) {
        rows.push(Object.assign({ id: uuid(), created_at: new Date().toISOString() }, row));
        lsWrite(rows);
      }
      notifyLocal();
      return;
    }
    const r = await sb.from("skips").insert(row);
    if (r.error && r.error.code !== "23505") throw r.error; // 23505 = already skipped, fine
  }

  async function remove(resident_id, meal, meal_date) {
    if (demo) {
      lsWrite(lsRead().filter(function (r) { return !sameKey(r, { resident_id: resident_id, meal: meal, meal_date: meal_date }); }));
      notifyLocal();
      return;
    }
    const r = await sb.from("skips").delete().eq("resident_id", resident_id).eq("meal", meal).eq("meal_date", meal_date);
    if (r.error) throw r.error;
  }

  async function addMany(newRows) {
    if (demo) {
      const rows = lsRead();
      newRows.forEach(function (n) {
        if (!rows.some(function (r) { return sameKey(r, n); })) rows.push(Object.assign({ id: uuid() }, n));
      });
      lsWrite(rows);
      notifyLocal();
      return;
    }
    for (let i = 0; i < newRows.length; i += 500) {
      const r = await sb.from("skips").upsert(newRows.slice(i, i + 500),
        { onConflict: "resident_id,meal,meal_date", ignoreDuplicates: true });
      if (r.error) throw r.error;
    }
  }

  async function resetAll() {
    if (demo) { lsWrite([]); notifyLocal(); return; }
    const r = await sb.from("skips").delete().not("id", "is", null);
    if (r.error) throw r.error;
  }

  // Realistic random skips for the past 7 days (more breakfast skips than lunch).
  async function seedWeek(residents) {
    const today = new Date();
    const p = { breakfast: 0.3, lunch: 0.12, dinner: 0.2 };
    const rows = [];
    residents.forEach(function (res) {
      const habit = 0.3 + Math.random() * 1.4; // some students skip more than others
      for (let back = 1; back <= 7; back++) {
        const day = addDays(today, -back);
        MEALS.forEach(function (meal) {
          if (Math.random() < p[meal] * habit) {
            const c = cutoff(meal, dateStr(day));
            c.setMinutes(c.getMinutes() - Math.floor(Math.random() * 600) - 5);
            rows.push({
              resident_id: res.id, resident_name: res.name, room: res.room,
              meal: meal, meal_date: dateStr(day), created_at: c.toISOString()
            });
          }
        });
      }
    });
    await addMany(rows);
    return rows.length;
  }

  // Call cb whenever data may have changed (other tabs, realtime, own writes).
  function subscribe(cb) {
    let timer = null;
    const fire = function () { clearTimeout(timer); timer = setTimeout(cb, 120); };
    listeners.push(fire);
    if (demo) {
      window.addEventListener("storage", function (e) { if (e.key === LS_KEY || e.key === null) fire(); });
    } else {
      sb.channel("skips-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "skips" }, fire)
        .subscribe();
      setInterval(fire, 20000); // safety net if the websocket drops
    }
  }

  function modeBadge() {
    const b = document.createElement("div");
    b.className = "badge modebadge" + (demo ? "" : " live");
    b.textContent = demo ? "Demo mode: this device only" : "Live: shared via Supabase";
    document.body.appendChild(b);
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }

  return {
    demo, MEALS, MEAL_LABEL, CREDIT_PER_SKIP, COST_PER_MEAL, BUFFER,
    init, list, add, remove, addMany, resetAll, seedWeek, subscribe, modeBadge, toast,
    dateStr, parseDate, addDays, monthPrefix, cutoff, countdown, inr, inr0, cookFor
  };
})();
