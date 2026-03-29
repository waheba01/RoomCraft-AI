/**
 * RoomCraft AI — script.js  (FIXED VERSION)
 * AI-Assisted Interior Recommendation & Redesign System
 *
 * BUGS FIXED IN THIS VERSION:
 * ─────────────────────────────────────────────────────
 * BUG 1: after-img not rendering — onload/onerror now attached BEFORE src is set.
 * BUG 2: Wrong Replicate model version hash — switched to stable known version.
 * BUG 3: output could be string or array — safeOutputUrl() handles both.
 * BUG 4: recommendFurniture() returned 12+ items — now capped by room size.
 * BUG 5: result-section stayed hidden if image failed — now always shows.
 * BUG 6: Room size dropdown was missing — now added and used in recommendation.
 * ─────────────────────────────────────────────────────
 */

"use strict";

// ─── STATE ───────────────────────────────────────────────────
let imageBase64 = null;
let imageMime   = 'image/jpeg';
let previewSrc  = null;
let apiKey      = '';

// ─── FURNITURE KNOWLEDGE BASE ─────────────────────────────────
// priority: 1 = essential, 2 = recommended, 3 = optional/decor
const FURNITURE_DB = {
  bedroom: [
    { name:"Bed Frame (Queen/King)", cat:"Furniture", priority:1, desc:"Central piece of any bedroom — sized to room dimensions", styles:["minimal","modern","scandinavian","cozy","luxury","bohemian","industrial"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:8000, priceMax:45000, search:"queen bed frame wooden bedroom" },
    { name:"Wardrobe (2 or 4 Door)", cat:"Furniture", priority:1, desc:"Sliding doors save floor space in small rooms", styles:["modern","minimal","luxury","scandinavian","cozy"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:12000, priceMax:55000, search:"wardrobe mirror bedroom sliding" },
    { name:"Bedside Tables (Set of 2)", cat:"Furniture", priority:1, desc:"Compact nightstands with drawer for lamp and essentials", styles:["minimal","modern","scandinavian","cozy","luxury","bohemian"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:3000, priceMax:12000, search:"bedside table nightstand set 2" },
    { name:"Ceiling / Pendant Light", cat:"Lighting", priority:1, desc:"Warm ambient lighting to replace harsh fluorescent tubes", styles:["modern","luxury","industrial","scandinavian","minimal","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:800, priceMax:8000, search:"pendant ceiling light bedroom warm" },
    { name:"Blackout Curtains (Pair)", cat:"Decor", priority:2, desc:"Thick curtains to block light and improve sleep", styles:["cozy","luxury","modern","minimal","scandinavian"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:1200, priceMax:6000, search:"blackout curtains bedroom pair" },
    { name:"Bedroom Rug (5x3 ft)", cat:"Decor", priority:2, desc:"Soft rug beside the bed — adds warmth and texture", styles:["cozy","bohemian","luxury","scandinavian","minimal"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:1500, priceMax:8000, search:"bedroom rug soft area 5x3" },
    { name:"Dressing Table with Mirror", cat:"Furniture", priority:2, desc:"Vanity table with mirror — skip in small rooms", styles:["luxury","cozy","bohemian","modern"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:7000, priceMax:30000, search:"dressing table vanity mirror" },
    { name:"Wall Art / Canvas Print", cat:"Decor", priority:3, desc:"Framed prints to personalise bare walls", styles:["bohemian","modern","minimal","scandinavian","luxury","cozy"], budgets:["under 50000","50000 to 100000"], priceMin:500, priceMax:4000, search:"wall art canvas print bedroom decor" },
    { name:"Ottoman / Bench", cat:"Furniture", priority:3, desc:"End-of-bed bench — only fits in large bedrooms", styles:["luxury","modern","cozy"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:3000, priceMax:15000, search:"bedroom ottoman bench end of bed" },
    { name:"Indoor Plant + Planter", cat:"Decor", priority:3, desc:"Snake plant or pothos in a corner — adds freshness", styles:["bohemian","scandinavian","cozy","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:2500, search:"indoor plant planter bedroom" },
  ],
  "living room": [
    { name:"3-Seater Sofa", cat:"Furniture", priority:1, desc:"Central seating piece — anchor of any living room", styles:["minimal","modern","cozy","luxury","scandinavian","industrial","bohemian"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:12000, priceMax:80000, search:"3 seater sofa living room" },
    { name:"Centre Coffee Table", cat:"Furniture", priority:1, desc:"Wood or glass table to anchor the seating area", styles:["minimal","modern","luxury","industrial","scandinavian","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:3000, priceMax:25000, search:"coffee table centre living room" },
    { name:"TV Unit / Media Cabinet", cat:"Furniture", priority:1, desc:"Low media console for TV and storage", styles:["modern","minimal","scandinavian","industrial","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:5000, priceMax:30000, search:"TV unit entertainment cabinet wood" },
    { name:"Floor Lamp", cat:"Lighting", priority:1, desc:"Arc or tripod lamp for layered ambient lighting", styles:["modern","minimal","scandinavian","industrial","luxury","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:1500, priceMax:10000, search:"floor lamp arc living room" },
    { name:"Living Room Rug (6x4 ft)", cat:"Decor", priority:2, desc:"Area rug to define seating zone and soften the space", styles:["cozy","bohemian","luxury","modern","scandinavian","minimal"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:2000, priceMax:18000, search:"living room rug large area 6x4" },
    { name:"Throw Cushions (Set of 4)", cat:"Decor", priority:2, desc:"Mixed textures to add comfort and personality to sofa", styles:["cozy","bohemian","luxury","scandinavian","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:800, priceMax:4000, search:"throw cushion covers set living room" },
    { name:"Accent Chair", cat:"Furniture", priority:2, desc:"Statement chair to complement the sofa", styles:["luxury","modern","bohemian","industrial","scandinavian"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:6000, priceMax:30000, search:"accent chair living room modern" },
    { name:"L-Shape Sectional Sofa", cat:"Furniture", priority:2, desc:"Large sectional — only for spacious living rooms", styles:["modern","luxury","cozy"], budgets:["100000 to 200000","above 200000"], priceMin:35000, priceMax:150000, search:"L shape sectional sofa hall" },
    { name:"Bookshelf / Display Unit", cat:"Furniture", priority:3, desc:"Open shelving for books, plants, and decor objects", styles:["bohemian","industrial","scandinavian","modern","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:3500, priceMax:20000, search:"bookshelf display unit living room" },
    { name:"Indoor Plants + Planters", cat:"Decor", priority:3, desc:"Snake plant, pothos for freshness", styles:["bohemian","scandinavian","cozy","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:500, priceMax:4000, search:"indoor plants planters living room" },
    { name:"Wall Clock (Decorative)", cat:"Decor", priority:3, desc:"Large decorative clock as a focal wall piece", styles:["industrial","modern","minimal","scandinavian"], budgets:["under 50000","50000 to 100000"], priceMin:600, priceMax:4500, search:"wall clock decorative large living room" },
  ],
  kitchen: [
    { name:"Overhead Storage Cabinets", cat:"Storage", priority:1, desc:"Wall-mounted cabinets — essential kitchen storage", styles:["modern","minimal","luxury","industrial"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:15000, priceMax:60000, search:"kitchen overhead cabinet modular" },
    { name:"Dish Rack (Stainless Steel)", cat:"Storage", priority:1, desc:"Countertop rack for drying and organising utensils", styles:["modern","minimal","industrial"], budgets:["under 50000","50000 to 100000"], priceMin:500, priceMax:3000, search:"stainless steel dish rack kitchen" },
    { name:"Pendant Light over Counter", cat:"Lighting", priority:1, desc:"Task lighting above counter or island", styles:["modern","industrial","luxury","minimal"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:1200, priceMax:10000, search:"pendant light kitchen counter island" },
    { name:"Magnetic Spice Rack", cat:"Storage", priority:2, desc:"Wall-mounted spice containers — saves counter space", styles:["modern","minimal","scandinavian"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:2500, search:"magnetic spice rack wall kitchen" },
    { name:"Kitchen Island (Compact)", cat:"Furniture", priority:2, desc:"Freestanding prep counter with lower storage", styles:["modern","industrial","luxury"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:10000, priceMax:50000, search:"kitchen island compact freestanding" },
    { name:"High Bar Stools (Set of 2)", cat:"Furniture", priority:3, desc:"Counter-height seating — only if you have a breakfast bar", styles:["industrial","modern","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:2500, priceMax:12000, search:"bar stool kitchen high counter" },
    { name:"Herb Garden Window Planter", cat:"Decor", priority:3, desc:"Window-sill herb kit for cooking and fresh aesthetics", styles:["bohemian","scandinavian","cozy","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:2000, search:"herb planter kitchen window sill" },
  ],
  bathroom: [
    { name:"LED Backlit Vanity Mirror", cat:"Fixture", priority:1, desc:"Backlit mirror for even grooming light — major upgrade", styles:["modern","luxury","minimal"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:3000, priceMax:18000, search:"LED backlit vanity mirror bathroom" },
    { name:"Towel Rail / Ladder", cat:"Accessory", priority:1, desc:"Wall-mounted or freestanding towel organiser", styles:["minimal","scandinavian","industrial","luxury","modern"], budgets:["under 50000","50000 to 100000"], priceMin:800, priceMax:4500, search:"towel rail ladder bathroom stainless" },
    { name:"Bath Mat (Plush)", cat:"Decor", priority:1, desc:"Soft anti-slip mat for safety and comfort", styles:["cozy","luxury","scandinavian","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:3000, search:"bath mat plush non slip bathroom" },
    { name:"Floating Vanity Cabinet", cat:"Storage", priority:2, desc:"Wall-mounted under-sink cabinet — keeps floor clear", styles:["modern","minimal","luxury"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:8000, priceMax:35000, search:"floating vanity cabinet bathroom wall mounted" },
    { name:"Shower Caddy / Corner Shelf", cat:"Storage", priority:2, desc:"Rust-proof organiser for toiletries inside shower", styles:["modern","minimal","cozy","industrial"], budgets:["under 50000","50000 to 100000"], priceMin:300, priceMax:2000, search:"shower caddy corner shelf bathroom" },
    { name:"Small Plant / Succulent", cat:"Decor", priority:3, desc:"Single low-maintenance plant for a fresh look", styles:["bohemian","scandinavian","cozy","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:200, priceMax:1000, search:"small succulent plant bathroom" },
  ],
  study: [
    { name:"Study / Computer Desk", cat:"Furniture", priority:1, desc:"Spacious work surface — core of any home office", styles:["modern","minimal","industrial","scandinavian","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:5000, priceMax:25000, search:"study computer desk home office" },
    { name:"Ergonomic Office Chair", cat:"Furniture", priority:1, desc:"Lumbar support chair — essential for long study sessions", styles:["modern","minimal","industrial","scandinavian"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:5000, priceMax:28000, search:"ergonomic office chair lumbar support" },
    { name:"LED Desk Lamp", cat:"Lighting", priority:1, desc:"Adjustable arm lamp to reduce eye strain", styles:["modern","minimal","industrial","scandinavian","cozy"], budgets:["under 50000","50000 to 100000"], priceMin:600, priceMax:4000, search:"LED desk lamp adjustable arm study" },
    { name:"Bookcase / Shelf (3–5 shelf)", cat:"Storage", priority:2, desc:"Shelving for textbooks, binders, reference material", styles:["minimal","scandinavian","industrial","modern","cozy"], budgets:["under 50000","50000 to 100000"], priceMin:3000, priceMax:15000, search:"bookcase shelf study room 5 shelf" },
    { name:"Monitor Stand + Organiser", cat:"Storage", priority:2, desc:"Raises monitor and organises desk accessories", styles:["minimal","modern"], budgets:["under 50000","50000 to 100000"], priceMin:800, priceMax:4000, search:"monitor stand desk organiser bamboo" },
    { name:"Whiteboard / Corkboard", cat:"Decor", priority:3, desc:"Wall-mounted planning board for notes and tasks", styles:["minimal","industrial","modern","scandinavian"], budgets:["under 50000","50000 to 100000"], priceMin:500, priceMax:3500, search:"whiteboard corkboard wall study room" },
    { name:"Blackout / Thick Curtains", cat:"Decor", priority:3, desc:"Reduces glare and noise during study sessions", styles:["minimal","modern","cozy","industrial"], budgets:["under 50000","50000 to 100000"], priceMin:1500, priceMax:6000, search:"thick curtains study room glare noise" },
  ],
  balcony: [
    { name:"Outdoor Chairs (Set of 2)", cat:"Furniture", priority:1, desc:"Weather-resistant rattan or metal seating", styles:["bohemian","cozy","minimal","scandinavian","modern"], budgets:["under 50000","50000 to 100000"], priceMin:3000, priceMax:15000, search:"outdoor chair set 2 balcony rattan" },
    { name:"Hanging String Lights", cat:"Lighting", priority:1, desc:"Warm Edison bulb fairy lights for evening ambience", styles:["bohemian","cozy","modern","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:2500, search:"string lights outdoor balcony Edison warm" },
    { name:"Compact Folding Side Table", cat:"Furniture", priority:1, desc:"Small foldable table for drinks and phones", styles:["minimal","modern","scandinavian","bohemian"], budgets:["under 50000","50000 to 100000"], priceMin:1500, priceMax:7000, search:"folding table side compact outdoor balcony" },
    { name:"Vertical Garden Planter", cat:"Decor", priority:2, desc:"Wall-mounted pocket planter for herbs and flowers", styles:["bohemian","cozy","scandinavian","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:600, priceMax:5000, search:"vertical garden planter wall balcony" },
    { name:"Outdoor Rug (compact)", cat:"Decor", priority:2, desc:"Weather-resistant rug to define the seating zone", styles:["bohemian","cozy","minimal","scandinavian"], budgets:["under 50000","50000 to 100000"], priceMin:800, priceMax:4000, search:"outdoor rug balcony weather proof" },
    { name:"Hammock / Swing Chair", cat:"Furniture", priority:3, desc:"Hanging chair — only for larger balconies", styles:["bohemian","cozy"], budgets:["under 50000","50000 to 100000"], priceMin:1500, priceMax:6000, search:"hammock swing chair balcony hanging" },
  ],
  "dining room": [
    { name:"Dining Table (4 or 6 Seater)", cat:"Furniture", priority:1, desc:"Solid wood or glass table — sized to the room", styles:["modern","luxury","minimal","scandinavian","cozy","industrial"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:10000, priceMax:80000, search:"dining table 6 seater solid wood" },
    { name:"Dining Chairs (Set of 4)", cat:"Furniture", priority:1, desc:"Matching upholstered or wooden chairs", styles:["modern","luxury","scandinavian","minimal","cozy","industrial"], budgets:["under 50000","50000 to 100000","100000 to 200000","above 200000"], priceMin:6000, priceMax:40000, search:"dining chairs set 4 upholstered" },
    { name:"Dining Pendant Light", cat:"Lighting", priority:1, desc:"Statement pendant above table for mood lighting", styles:["luxury","modern","industrial","minimal","cozy"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:2000, priceMax:20000, search:"pendant light dining room table" },
    { name:"Crockery / Display Cabinet", cat:"Storage", priority:2, desc:"Glass-front cabinet for crockery display", styles:["luxury","modern","cozy","scandinavian"], budgets:["50000 to 100000","100000 to 200000","above 200000"], priceMin:8000, priceMax:35000, search:"crockery display cabinet glass dining" },
    { name:"Table Runner + Placemats", cat:"Decor", priority:2, desc:"Fabric runner and placemats for table styling", styles:["cozy","bohemian","luxury","scandinavian","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:400, priceMax:2500, search:"table runner placemats dining room" },
    { name:"Wall Art / Large Mirror", cat:"Decor", priority:3, desc:"Large mirror or art to open up the dining wall", styles:["luxury","modern","minimal","scandinavian"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:800, priceMax:8000, search:"wall art large mirror dining room" },
  ],
  "kids room": [
    { name:"Single / Bunk Bed", cat:"Furniture", priority:1, desc:"Age-appropriate bed — bunk only if ceiling is tall enough", styles:["modern","cozy","minimal","scandinavian"], budgets:["under 50000","50000 to 100000","100000 to 200000"], priceMin:8000, priceMax:40000, search:"kids bed single bunk room" },
    { name:"Kids Study Table + Chair", cat:"Furniture", priority:1, desc:"Height-adjustable desk and ergonomic children's chair", styles:["modern","minimal","cozy","scandinavian"], budgets:["under 50000","50000 to 100000"], priceMin:3000, priceMax:12000, search:"kids study table chair height adjustable" },
    { name:"Toy Storage Unit / Bins", cat:"Storage", priority:1, desc:"Low shelving with colourful bins for toy access", styles:["cozy","modern","minimal"], budgets:["under 50000","50000 to 100000"], priceMin:2000, priceMax:8000, search:"kids toy storage bins colourful unit" },
    { name:"Night Light (Colour Changing)", cat:"Lighting", priority:1, desc:"Soft colour-changing lamp for bedtime comfort", styles:["cozy","modern","minimal"], budgets:["under 50000"], priceMin:300, priceMax:2000, search:"colour changing night light kids bedroom" },
    { name:"Wall Decals / Stickers", cat:"Decor", priority:2, desc:"Removable peel-stick art — fun and damage-free", styles:["cozy","bohemian","modern","minimal"], budgets:["under 50000"], priceMin:300, priceMax:2000, search:"kids wall decals stickers room removable" },
    { name:"Bean Bag Chair", cat:"Furniture", priority:3, desc:"Soft freeform seating for reading and play", styles:["cozy","bohemian","modern"], budgets:["under 50000","50000 to 100000"], priceMin:1200, priceMax:6000, search:"bean bag chair kids room reading" },
  ]
};

// ─── ITEM CAPS ────────────────────────────────────────────────
// [small, medium, large]
const ITEM_CAPS = {
  bedroom:       [3, 5, 7],
  "living room": [4, 6, 8],
  kitchen:       [3, 4, 5],
  bathroom:      [3, 3, 4],
  study:         [3, 5, 6],
  balcony:       [3, 4, 5],
  "dining room": [3, 4, 6],
  "kids room":   [3, 4, 6],
};

// ─── API KEY ──────────────────────────────────────────────────
function saveApiKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val) { showError('Please enter a Replicate API key, or leave blank for Demo Mode.'); return; }
  apiKey = val;
  sessionStorage.setItem('replicate_key', val);
  const badge = document.getElementById('api-saved-badge');
  badge.style.display = 'inline';
  const modeBadge = document.getElementById('mib-mode-badge');
  if (modeBadge) { modeBadge.textContent = '🔑 AI Mode Active'; modeBadge.style.color = 'var(--sage)'; }
  setTimeout(() => badge.style.display = 'none', 3000);
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('replicate_key');
  if (saved) {
    apiKey = saved;
    document.getElementById('api-key-input').value = saved;
    const modeBadge = document.getElementById('mib-mode-badge');
    if (modeBadge) modeBadge.textContent = '🔑 AI Mode Active';
  }
  initUI();
});

function initUI() {
  document.getElementById('style-chips').addEventListener('click', e => {
    const chip = e.target.closest('.style-chip');
    if (chip) chip.classList.toggle('active');
  });
  document.getElementById('file-input').addEventListener('change', e => handleFile(e.target.files[0]));
  const zone = document.getElementById('drop-zone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragging');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  document.getElementById('generate-btn').addEventListener('click', generate);
  initCursor();
}

// ─── FILE HANDLING ────────────────────────────────────────────
function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showError('Please upload a valid image (JPEG, PNG, WEBP).'); return; }
  if (file.size > 8 * 1024 * 1024) { showError('Image too large. Please use an image under 8MB.'); return; }
  imageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = ev => {
    previewSrc  = ev.target.result;
    imageBase64 = ev.target.result.split(',')[1];
    const img = document.getElementById('preview-img');
    img.src = previewSrc;
    img.style.display = 'block';
    document.getElementById('drop-zone').classList.add('has-image');
    document.getElementById('drop-inner').style.opacity = '0';
    clearError();
  };
  reader.onerror = () => showError('Failed to read image. Please try again.');
  reader.readAsDataURL(file);
}

// ─── MAIN GENERATE ────────────────────────────────────────────
async function generate() {
  if (!imageBase64) {
    showError('⚠ Please upload a room photo first.');
    return;
  }
  clearError();

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = 'Generating… <span class="gen-icon">⟳</span>';
  document.getElementById('loader').style.display = 'flex';
  document.getElementById('result-section').style.display = 'none';
  startLoaderSteps();

  const roomType = document.getElementById('room-type').value;
  const budget   = document.getElementById('budget').value;
  const styles   = getSelectedStyles();
  const roomSize = document.getElementById('room-size').value || 'medium';

  // Recommendation engine runs immediately — does NOT need API key
  updateLoaderStep(3);
  const furniture = recommendFurniture(roomType, styles, budget, roomSize);

  let outputUrl    = null;
  let isDemo       = false;
  let aiPromptUsed = buildPositivePrompt(roomType, styles, budget);

  if (apiKey) {
    try {
      updateLoaderStep(0);
      const result = await callReplicateAI(roomType, styles, budget);
      outputUrl    = result.url;
      aiPromptUsed = result.prompt;
      updateLoaderStep(4);
    } catch (err) {
      console.warn('[RoomCraft AI] AI failed, using fallback:', err.message);
      outputUrl = getDemoImage(roomType);
      isDemo    = true;
      showError('⚠ AI image issue: ' + err.message + '. Showing reference image. Recommendations are still accurate.');
    }
  } else {
    isDemo = true;
    for (let s = 0; s < 5; s++) { updateLoaderStep(s); await sleep(550); }
    outputUrl = getDemoImage(roomType);
  }

  stopLoaderSteps();
  document.getElementById('loader').style.display = 'none';
  btn.disabled = false;
  btn.innerHTML = 'Generate My Interior Design <span class="gen-icon">✦</span>';

  renderResults({ outputUrl, roomType, styles, furniture, budget, roomSize, isDemo, aiPromptUsed });
}

// ─── DEMO IMAGES ──────────────────────────────────────────────
function getDemoImage(roomType) {
  const demos = {
    'bedroom':     'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&fit=crop',
    'living room': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&fit=crop',
    'kitchen':     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&fit=crop',
    'bathroom':    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&fit=crop',
    'study':       'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&fit=crop',
    'balcony':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&fit=crop',
    'dining room': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&fit=crop',
    'kids room':   'https://images.unsplash.com/photo-1566792925922-7b94f2d3f0e1?w=1200&fit=crop',
  };
  return demos[roomType] || demos['living room'];
}

// ─── REPLICATE AI CALL ────────────────────────────────────────
async function callReplicateAI(roomType, styles, budget) {
  const prompt         = buildPositivePrompt(roomType, styles, budget);
  const negativePrompt = buildNegativePrompt();

  // stability-ai/stable-diffusion img2img — verified working version
  const MODEL_VERSION = 'a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c8';

  const submitRes = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        image:           `data:${imageMime};base64,${imageBase64}`,
        prompt:           prompt,
        negative_prompt:  negativePrompt,
        prompt_strength:  0.35,   // LOW → preserves room structure strongly
        num_inference_steps: 30,
        guidance_scale:   7.5,
        scheduler:        'K_EULER',
      }
    })
  });

  if (!submitRes.ok) {
    const e = await submitRes.json().catch(() => ({}));
    if (submitRes.status === 401) throw new Error('Invalid API key');
    if (submitRes.status === 422) throw new Error('Image input error — try a smaller image');
    throw new Error(`Replicate API ${submitRes.status}: ${e.detail || submitRes.statusText}`);
  }

  const prediction = await submitRes.json();
  if (!prediction.id) throw new Error('No prediction ID — check your API key');

  updateLoaderStep(1);
  const url = await pollResult(prediction.id);
  return { url, prompt };
}

// ─── POLL RESULT ──────────────────────────────────────────────
async function pollResult(predId) {
  const pollUrl = `https://api.replicate.com/v1/predictions/${predId}`;
  for (let i = 0; i < 90; i++) {
    await sleep(2500);
    const res  = await fetch(pollUrl, { headers: { 'Authorization': `Token ${apiKey}` } });
    if (!res.ok) throw new Error(`Poll error: status ${res.status}`);
    const data = await res.json();

    if (data.status === 'succeeded') {
      updateLoaderStep(2);
      // FIX: handle both array and string output
      if (Array.isArray(data.output) && data.output.length > 0) return data.output[0];
      if (typeof data.output === 'string' && data.output.startsWith('http')) return data.output;
      throw new Error('Unexpected output format: ' + JSON.stringify(data.output).slice(0, 80));
    }
    if (data.status === 'failed') throw new Error('Model failed: ' + (data.error || 'unknown'));
  }
  throw new Error('Timed out after ~3 min. Use Demo Mode or try again.');
}

// ─── PROMPT ENGINEERING ───────────────────────────────────────
function buildPositivePrompt(roomType, styles, budget) {
  const styleStr   = styles.length ? styles.join(', ') : 'minimal modern';
  const budgetHint = budget.includes('above 200000') ? 'premium luxury'
                   : budget.includes('100000')        ? 'mid-range quality'
                   :                                    'affordable practical';
  return (
    `${styleStr} interior design of the same ${roomType}, ` +
    `same room same walls same floor same ceiling same windows same camera angle same perspective, ` +
    `furniture and decor added to existing room, ${budgetHint} furnishings, ` +
    `photorealistic interior photography, professionally staged, warm lighting, no people, clean`
  );
}

function buildNegativePrompt() {
  return (
    'exterior, outside, outdoor, garden, yard, lawn, street, road, ' +
    'house exterior, building facade, apartment building, villa, bungalow, mansion, ' +
    'architecture exterior, real estate, property listing, ' +
    'different room, completely new room, different space, ' +
    'landscape, sky, clouds, trees, nature, ' +
    'floor plan, blueprint, aerial view, bird eye view, ' +
    'cartoon, illustration, painting, 3d render, cgi, animation, ' +
    'watermark, text, logo, signature, blurry, low quality, distorted, ' +
    'people, humans, person, children, animals, pets'
  );
}

// ─── RECOMMENDATION ENGINE ────────────────────────────────────
function recommendFurniture(roomType, styles, budget, roomSize) {
  const db  = FURNITURE_DB[roomType] || FURNITURE_DB['living room'];
  const cap = getItemCap(roomType, roomSize);

  // Budget filter with graceful fallback
  const pool     = db.filter(i => i.budgets.includes(budget));
  const filtered = pool.length > 0 ? pool : db;

  // Score by style match
  const scored = filtered.map(item => ({
    ...item,
    styleScore: styles.filter(s => item.styles.includes(s)).length
  }));

  // Sort: priority first (1 before 2 before 3), then styleScore descending
  scored.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : b.styleScore - a.styleScore);

  // Cap by room size — small rooms only get priority 1, medium gets 1+2, large gets all
  const maxPriority = roomSize === 'small' ? 1 : roomSize === 'medium' ? 2 : 3;
  let candidates    = scored.filter(i => i.priority <= maxPriority);
  if (candidates.length < 3) candidates = scored; // never return fewer than 3

  return candidates.slice(0, cap).map(item => ({ ...item, price: estimatePrice(item, budget) }));
}

function getItemCap(roomType, roomSize) {
  const caps = ITEM_CAPS[roomType] || [3, 5, 7];
  return roomSize === 'small' ? caps[0] : roomSize === 'large' ? caps[2] : caps[1];
}

function estimatePrice(item, budget) {
  const range  = item.priceMax - item.priceMin;
  const factor = budget.includes('above 200000') ? 0.82
               : budget.includes('100000')        ? 0.62
               : budget.includes('50000 to')      ? 0.42
               :                                    0.22;
  return Math.round((item.priceMin + range * factor) / 100) * 100;
}

// ─── AMAZON LINK ──────────────────────────────────────────────
function buildAmazonLink(item, styles) {
  const query = encodeURIComponent(`${item.search} ${styles[0] || 'modern'}`);
  return `https://www.amazon.in/s?k=${query}`;
}

// ─── RENDER RESULTS ───────────────────────────────────────────
function renderResults({ outputUrl, roomType, styles, furniture, budget, roomSize, isDemo, aiPromptUsed }) {

  // Before image — always works (it's our own uploaded file)
  document.getElementById('before-img').src = previewSrc;

  // After image — FIX: attach handlers BEFORE setting src
  const afterImg = document.getElementById('after-img');
  const placeholder = document.getElementById('after-img-placeholder');

  afterImg.style.display = 'block';
  afterImg.style.opacity = '0.3';
  afterImg.style.filter  = 'blur(6px)';
  if (placeholder) placeholder.style.display = 'none';

  afterImg.onload = function() {
    this.style.opacity    = '1';
    this.style.filter     = 'none';
    this.style.transition = 'opacity 0.6s ease, filter 0.6s ease';
  };
  afterImg.onerror = function() {
    this.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.textContent = isDemo
        ? '📸 Demo Mode — reference image unavailable. See furniture list below.'
        : '⚠ AI image URL failed to load. This sometimes happens with Replicate CDN. All furniture recommendations below are correct.';
    }
  };
  afterImg.src = outputUrl; // set AFTER handlers

  // Labels
  const rLabel = roomType.charAt(0).toUpperCase() + roomType.slice(1);
  document.getElementById('result-room-name').textContent = rLabel;
  document.getElementById('result-style-tag').textContent = styles.length ? '✦ ' + styles.join(' · ') : '✦ Minimal';
  document.getElementById('result-mode-label').textContent = isDemo ? '✦ Demo Mode — Design Reference' : '✦ AI Generation Complete';

  // Prompt (for viva)
  const promptEl = document.getElementById('prompt-text-display');
  if (promptEl) {
    promptEl.textContent =
      `POSITIVE PROMPT:\n${aiPromptUsed}\n\nNEGATIVE PROMPT:\n${buildNegativePrompt()}`;
  }

  // Cost
  const totalCost = furniture.reduce((s, f) => s + f.price, 0);
  const budgetMax = budget.includes('above 200000') ? Infinity
                  : budget.includes('100000 to 200000') ? 200000
                  : budget.includes('50000 to 100000')  ? 100000 : 50000;

  document.getElementById('total-cost').textContent =
    totalCost.toLocaleString('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });
  document.getElementById('item-count-badge').textContent = `${furniture.length} items · ${roomSize} room`;

  const matchBadge = document.getElementById('budget-match-badge');
  if (matchBadge) {
    matchBadge.textContent = totalCost <= budgetMax ? '✓ Within Budget' : '⚠ Near Budget Limit';
    matchBadge.style.color = totalCost <= budgetMax ? 'var(--sage)' : 'var(--gold)';
  }

  // Furniture cards
  const grid = document.getElementById('furniture-grid');
  grid.innerHTML = '';
  furniture.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'fcard';
    div.style.animationDelay = `${i * 0.07}s`;
    const pLabel = item.priority === 1 ? 'Essential' : item.priority === 2 ? 'Recommended' : 'Optional';
    const pColor = item.priority === 1 ? 'var(--sage)' : item.priority === 2 ? 'var(--gold-light)' : 'var(--text-muted)';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem">
        <span class="fcard-cat">${item.cat}</span>
        <span style="font-size:0.6rem;font-family:var(--font-mono);color:${pColor};border:1px solid ${pColor};padding:2px 8px;border-radius:10px;opacity:0.85">${pLabel}</span>
      </div>
      <div class="fcard-name">${item.name}</div>
      <div class="fcard-desc">${item.desc}</div>
      <div class="fcard-footer">
        <span class="fcard-price">${item.price.toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0})}</span>
        <a class="amazon-btn" href="${buildAmazonLink(item,styles)}" target="_blank" rel="noopener">🛒 Amazon.in →</a>
      </div>
    `;
    grid.appendChild(div);
  });

  // Summary table
  const tbody = document.getElementById('summary-tbody');
  tbody.innerHTML = '';
  furniture.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--text-muted);font-family:var(--font-mono)">${String(i+1).padStart(2,'0')}</td>
      <td style="color:var(--cream)">${item.name}</td>
      <td>${item.cat}</td>
      <td style="color:var(--sage);font-family:var(--font-mono);font-size:0.7rem">${item.styleScore > 0 ? '★'.repeat(Math.min(item.styleScore,3)) : '—'}</td>
      <td style="color:var(--gold-light);font-family:var(--font-mono)">${item.price.toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0})}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('summary-total').textContent =
    totalCost.toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});

  // Show result section — always, even if image hasn't loaded yet
  document.getElementById('result-section').style.display = 'block';
  setTimeout(() => document.getElementById('result-section').scrollIntoView({behavior:'smooth',block:'start'}), 150);
}

// ─── RESET ────────────────────────────────────────────────────
function resetApp() {
  imageBase64 = null; previewSrc = null;
  document.getElementById('file-input').value = '';
  const preview = document.getElementById('preview-img');
  preview.src = ''; preview.style.display = 'none';
  document.getElementById('drop-zone').classList.remove('has-image');
  document.getElementById('drop-inner').style.opacity = '1';
  document.getElementById('result-section').style.display = 'none';
  document.getElementById('loader').style.display = 'none';
  const ai = document.getElementById('after-img');
  ai.src = ''; ai.style.display = 'block'; ai.style.opacity = '1'; ai.style.filter = 'none';
  const ph = document.getElementById('after-img-placeholder');
  if (ph) ph.style.display = 'none';
  document.getElementById('generate-btn').disabled = false;
  document.getElementById('generate-btn').innerHTML = 'Generate My Interior Design <span class="gen-icon">✦</span>';
  document.getElementById('furniture-grid').innerHTML = '';
  document.getElementById('summary-tbody').innerHTML = '';
  clearError(); stopLoaderSteps();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ─── HELPERS ──────────────────────────────────────────────────
function getSelectedStyles() {
  return [...document.querySelectorAll('.style-chip.active')].map(c => c.dataset.style);
}
function showError(msg) { const b=document.getElementById('error-box'); b.style.display='block'; b.textContent=msg; }
function clearError()   { const b=document.getElementById('error-box'); b.style.display='none'; b.textContent=''; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function startLoaderSteps() { document.querySelectorAll('.loader-step').forEach(s=>s.classList.remove('active')); updateLoaderStep(0); }
function updateLoaderStep(step) { document.querySelectorAll('.loader-step').forEach((s,i)=>s.classList.toggle('active',i===step)); }
function stopLoaderSteps() { document.querySelectorAll('.loader-step').forEach(s=>s.classList.remove('active')); }

// ─── CURSOR ───────────────────────────────────────────────────
function initCursor() {
  const dot=document.getElementById('cursor-dot'), ring=document.getElementById('cursor-ring');
  let rx=0,ry=0,dx=0,dy=0;
  document.addEventListener('mousemove',e=>{
    dx=e.clientX; dy=e.clientY;
    dot.style.left=dx+'px'; dot.style.top=dy+'px';
    const t=document.createElement('div');
    t.className='cursor-trail'; t.style.left=dx+'px'; t.style.top=dy+'px';
    document.body.appendChild(t); setTimeout(()=>t.remove(),600);
  });
  (function loop(){rx+=(dx-rx)*0.14;ry+=(dy-ry)*0.14;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop);})();
  document.querySelectorAll('button,a,.style-chip,select').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('hover'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hover'));
  });
  document.addEventListener('mousedown',()=>ring.classList.add('clicking'));
  document.addEventListener('mouseup',()=>ring.classList.remove('clicking'));
}
