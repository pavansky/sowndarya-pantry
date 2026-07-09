// Build data.js from the verified research-workflow outputs.
// Regenerate:  node gen_data.js
const fs = require("fs");
const path = require("path");

const TASKS = "C:/Users/pguthiko/AppData/Local/Temp/3/claude/C--Users-pguthiko-IdeaProjects-pantry/14e86e8b-a514-41e9-9f58-83df16156a41/tasks";
const OUT1 = path.join(TASKS, "w2uy8whce.output");   // longevity South-Indian DB + targets/principles
const OUT2 = path.join(TASKS, "weekp97f2.output");   // multi-cuisine DB (may not exist yet)

// canonicalize messy ingredient-name variants -> one pantry name
const ALIAS = {
 "cold-pressed groundnut oil":"Cold-Pressed Oil","cold-pressed sesame oil":"Cold-Pressed Oil",
 "cold-pressed coconut oil":"Cold-Pressed Oil","cold-pressed oil":"Cold-Pressed Oil","cooking oil":"Cold-Pressed Oil",
 "oil":"Cold-Pressed Oil","sesame oil":"Cold-Pressed Oil","groundnut oil":"Cold-Pressed Oil","mustard oil":"Cold-Pressed Oil",
 "amaranth keerai":"Keerai (Amaranth)","amaranth leaves":"Keerai (Amaranth)","amaranth greens":"Keerai (Amaranth)",
 "moong dal (whole green, sprouted)":"Sprouted Moong","moong sprouts":"Sprouted Moong","sprouted moong":"Sprouted Moong",
 "besan (gram flour)":"Besan","besan (chickpea flour)":"Besan","gram flour":"Besan","besan":"Besan",
 "horsegram (kollu)":"Horsegram","horse gram":"Horsegram","kollu (horsegram)":"Horsegram","horsegram":"Horsegram",
 "coconut (grated)":"Grated Coconut","grated coconut":"Grated Coconut",
 "spinach (chopped)":"Spinach","carrot (chopped)":"Carrot","beans (chopped)":"Beans",
 "cucumber (chopped)":"Cucumber","cucumber (grated)":"Cucumber",
 "pearl millet (bajra, cooked & cooled)":"Pearl Millet","pearl millet":"Pearl Millet","pearl millet (bajra)":"Pearl Millet",
 "groundnut (roasted)":"Groundnut","roasted chana (bengal gram)":"Roasted Chana","roasted chana":"Roasted Chana",
 "flaxseed (ground)":"Flax Seeds","flax seeds":"Flax Seeds","flaxseed":"Flax Seeds",
 "cumin seeds":"Cumin","cumin powder":"Cumin","cumin":"Cumin",
 "black pepper":"Pepper","pepper":"Pepper",
 "paneer (grated)":"Paneer","turmeric powder":"Turmeric","turmeric":"Turmeric",
 "ginger garlic paste":"Ginger Garlic Paste","curd":"Curd/Yogurt","yogurt":"Curd/Yogurt","curd/yogurt":"Curd/Yogurt",
 // multi-cuisine additions
 "low-fat paneer":"Paneer","paneer":"Paneer","low-fat curd":"Curd/Yogurt","low-fat curd (dahi)":"Curd/Yogurt",
 "dahi":"Curd/Yogurt","curd (dahi)":"Curd/Yogurt","rolled oats":"Oats","oats":"Oats",
 "rajma":"Rajma","rajma (kidney beans)":"Rajma","kidney beans":"Rajma","chana dal":"Chana Dal",
 "toor dal (split pigeon pea)":"Toor Dal","moong dal (split)":"Moong Dal","toor dal":"Toor Dal","moong dal":"Moong Dal",
 "bajra (pearl millet) flour":"Bajra Flour","bajra flour":"Bajra Flour","jowar (sorghum) flour":"Jowar Flour","jowar flour":"Jowar Flour",
 "multigrain atta":"Multigrain Atta","whole wheat flour":"Wheat Atta","atta":"Wheat Atta",
 "chicken breast/leg":"Chicken","chicken breast":"Chicken","chicken":"Chicken","fish":"Fish","tofu":"Tofu",
 "roasted peanuts":"Groundnut","peanuts":"Groundnut","roasted chana (bhuna chana)":"Roasted Chana","bhuna chana":"Roasted Chana",
 "lemon juice":"Lemon","capsicum":"Capsicum","green peas":"Green Peas","garam masala":"Garam Masala",
 "coriander powder":"Coriander Powder","red chilli powder":"Red Chilli Powder","chaat masala":"Chaat Masala",
 "hing (asafoetida)":"Hing","asafoetida":"Hing","black salt":"Black Salt","tandoori masala":"Tandoori Masala",
 "mint-coriander chutney":"Green Chutney","roasted flaxseed powder":"Flax Seeds","roasted flaxseed":"Flax Seeds"
};
// strip prep/qualifier noise then alias; keeps the pantry list from fragmenting
function cleanName(n){ return String(n).replace(/\([^)]*\)/g," ").split(",")[0].replace(/\s+/g," ").trim(); }
function titleize(s){ return s.split(" ").map(w=>w?w[0].toUpperCase()+w.slice(1):w).join(" "); }
const norm = n => {
  const raw = String(n).trim().toLowerCase();
  if(ALIAS[raw]) return ALIAS[raw];
  const c = cleanName(n), cl = c.toLowerCase();
  if(ALIAS[cl]) return ALIAS[cl];
  return titleize(c);
};

const cuisineOfSI = n => {
  n = n.toLowerCase();
  if (/rajma/.test(n)) return "North Indian";
  if (/besan chilla|palak paneer/.test(n)) return "North Indian";
  return "South Indian";
};

function load(file){ return JSON.parse(fs.readFileSync(file, "utf8")).result; }
function normalizeDish(d, cuisine){
  return {
    name:d.name, cuisine: d.cuisine || cuisine, meal:d.meal, healthy:true,
    veg: d.veg !== undefined ? d.veg : true,
    rationale:d.rationale, swapsFor:d.swapsFor||"", tags:d.tags||[],
    kcal:d.kcal, protein_g:d.protein_g, carb_g:d.carb_g, fiber_g:d.fiber_g,
    ing:(d.ing||[]).map(i=>({name:norm(i.name), qty:i.qty, unit:i.unit}))
  };
}

const j1 = load(OUT1);
let dishes = j1.dishes.map(d => normalizeDish(d, cuisineOfSI(d.name)));

let cuisineCounts = {};
let j2 = null;
try { if (fs.existsSync(OUT2) && fs.statSync(OUT2).size > 10) j2 = load(OUT2); } catch(e) { j2 = null; }
if (j2 && j2.dishes) {
  const extra = j2.dishes.map(d => normalizeDish(d, d.cuisine||"Indian"));
  // de-dupe by name (case-insensitive)
  const have = new Set(dishes.map(d=>d.name.toLowerCase()));
  extra.forEach(d=>{ if(!have.has(d.name.toLowerCase())){ dishes.push(d); have.add(d.name.toLowerCase()); }});
  console.log("merged multi-cuisine DB:", extra.length, "dishes");
} else {
  console.log("multi-cuisine output not ready yet — South-Indian DB only (re-run after it completes)");
}
dishes.forEach(d => cuisineCounts[d.cuisine] = (cuisineCounts[d.cuisine]||0)+1);

// derive pantry STAPLES: ingredients used in >=2 dishes (singletons auto-add to order when cooked)
const seen = new Map(), freq = new Map();
dishes.forEach(d => d.ing.forEach(i => { if(!seen.has(i.name)) seen.set(i.name, i.unit); freq.set(i.name,(freq.get(i.name)||0)+1); }));
const pantry = [...seen].filter(([name]) => freq.get(name) >= 2).map(([name,unit]) => {
  const qty = unit==='pcs' ? 12 : unit==='ml' ? 500 : 800;
  return { name, qty, unit, low: Math.round(qty*0.25) };
});
["Salt:g:1000","Turmeric:g:200","Sambar Powder:g:200","Mustard Seeds:g:100","Cumin:g:100","Pepper:g:100",
 "Curry Leaves:g:50","Coriander Leaves:g:50","Lemon:pcs:6","Tamarind:g:200","Ginger Garlic Paste:g:150"]
 .forEach(s => { const [n,u,q]=s.split(":"); if(!seen.has(n)) pantry.push({name:n,unit:u,qty:+q,low:Math.round(+q*0.25)}); });

const health = {
  targets:{ protein_g:j1.dailyTargets.protein_g_per_adult, fiber_g:j1.dailyTargets.fiber_g_per_adult, kcal:j1.dailyTargets.kcal_per_adult },
  targetNote:j1.dailyTargets.note,
  principles:j1.principles.map(p=>({title:p.title, nudge:p.nudge, verdict:p.verdict}))
};
const coach = [
  "🍽️ Eat in order: veg + protein first, grain last — cuts the post-meal glucose peak markedly.",
  "🍚 Rice tonight? Swap to foxtail millet — same texture, ~36% smaller glucose spike.",
  "🥗 Build the plate ½ veg · ¼ protein (dal/paneer/sundal) · ¼ grain.",
  "💊 B12 is non-negotiable for veg diets — take your weekly B12; pair iron foods with lemon, keep chai away from meals.",
  "🥛 Add a katori of thick dal or curd to any rice — protein flattens the sugar curve.",
  "🌾 Rotate millets across the week (foxtail, ragi, bajra, kodo) for a fuller mineral profile."
];

const out =
"// AUTO-GENERATED from verified research workflows (regenerate via: node gen_data.js)\n"+
"window.HEALTHY_DISHES = "+JSON.stringify(dishes,null,1)+";\n"+
"window.PANTRY_SEED = "+JSON.stringify(pantry,null,1)+";\n"+
"window.HEALTH = "+JSON.stringify(health,null,1)+";\n"+
"window.COACH_TIPS = "+JSON.stringify(coach,null,1)+";\n";
fs.writeFileSync(path.join(__dirname, "data.js"), out);
console.log("data.js written:", dishes.length, "dishes,", pantry.length, "pantry items");
console.log("cuisines:", JSON.stringify(cuisineCounts));
