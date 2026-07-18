# math-games — משחקי תרגול חשבון (עברית, RTL)

אתר סטטי המתארח ב-**GitHub Pages**: https://estishemtov.github.io/math-games/
אין שרת. אין תלות בשום כלי פיתוח (כולל Claude) — Claude שימש רק לעריכת הקבצים.

## הקבצים
- `index.html` — עמוד הבית (בחירת נושא + קישור לדוח "שימוש באפליקציה").
- `shvilim9.html` — "שבילים 9": 22 סוגי תרגילים (מבוססי חוברת), חלקם בהקלדה. **ללא הקראה קולית.**
- `triangles.html` — "משולשים וזוויות".
- `engine.js` — מנוע משותף (ניקוד/localStorage, צלילים, קונפטי, עוזרי גיאומטריה). `speakHe` = הקראה (מבוטלת ב-shvilim9).
- `style.css` — עיצוב משותף.
- `report.html` — **דוח "שימוש באפליקציה"** להורה: לכל יום, אחוז השאלות מכל פרק + כמה נכון מתוך כמה (הצלחה בפעם הראשונה), לכל סוג. מכסה את *כל* האפליקציה.

## מעקב נתונים — Supabase (חשוב!)
כל תשובה (בפעם הראשונה) נרשמת לפי (יום, סוג פרק): `attempts` ו-`correct`.
נשמר גם ב-`localStorage` וגם ב-**Supabase** (מסד ענני, חוצה-מכשירים).

**החיבור ל-Supabase כתוב ישירות בקוד**, במשתנה `CONF` בשלושה קבצים:
`shvilim9.html`, `triangles.html`, `report.html`:
```js
const CONF = {
  url: "https://rgqiyqsabylcylsmdnsi.supabase.co",
  key: "sb_publishable_...",   // מפתח ציבורי (publishable) — בטוח לצד-לקוח
  kid: "esti-4a7f2c9d"          // מזהה-ילד (משותף לכתיבה ולקריאה)
};
```
- `shvilim9.html` + `triangles.html` **כותבים** ל-Supabase (`Track.record` → `syncProgress`).
- `report.html` **קורא** מ-Supabase ומציג. אם `CONF` ריק → נופל ל-localStorage.

### טבלת `progress` ב-Supabase
```sql
create table progress (
  kid_id text not null, day text not null, type text not null,
  attempts int not null default 0, correct int not null default 0,
  updated_at timestamptz default now(),
  primary key (kid_id, day, type)
);
alter table progress enable row level security;
create policy "allow all" on progress for all using (true) with check (true);
```
עדכון = upsert (`on_conflict=kid_id,day,type`, `Prefer: resolution=merge-duplicates`) עם הספירות המוחלטות של המכשיר.

## איך לפרסם שינוי (deploy)
עורכים קובץ, ואז:
```
git add -A
git commit -m "..."
git push       # דורש התחברות ל-GitHub (Git Credential Manager)
```
GitHub Pages מתעדכן אוטומטית תוך דקה-שתיים.

## עבודה מחשבון/מחשב אחר
הקוד כולו במאגר ובתיקייה — כל אחד יכול לפתוח ולערוך:
```
git clone https://github.com/ESTISHEMTOV/math-games.git
```
