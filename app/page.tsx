"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient { name: string; quantity: string; unit: string; }

interface Recipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  prepTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: Ingredient[];
  steps: string[];
  seasoningSuggestions: string[];
  childNotes?: string[];
  tags: string[];
  shoppingItems?: ShoppingItem[]; // stored with recipe so we can add later
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  recipeId?: string; // which recipe contributed this
  checked?: boolean;
}

type SortMode = "loved" | "alpha" | "cookTime" | "added";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ value, onChange, min = 0, max = 99 }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="counter">
      <button className="counter-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span className="counter-val">{value}</span>
      <button className="counter-btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

// ─── Swipe Card ───────────────────────────────────────────────────────────────

function SwipeCard({ recipe, onLike, onBin, onOpen, isTop, stackIndex }: {
  recipe: Recipe; onLike: () => void; onBin: () => void; onOpen: () => void;
  isTop: boolean; stackIndex: number;
}) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [exiting, setExiting] = useState<"like" | "bin" | null>(null);
  const THRESHOLD = 90;

  const handleStart = useCallback((x: number) => {
    if (!isTop) return;
    isDragging.current = true; hasMoved.current = false;
    startX.current = x; currentX.current = x;
  }, [isTop]);

  const handleMove = useCallback((x: number) => {
    if (!isDragging.current || !isTop) return;
    currentX.current = x;
    if (Math.abs(x - startX.current) > 5) hasMoved.current = true;
    setDragOffset(x - startX.current);
  }, [isTop]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = currentX.current - startX.current;
    if (delta > THRESHOLD) { setExiting("like"); setTimeout(onLike, 320); }
    else if (delta < -THRESHOLD) { setExiting("bin"); setTimeout(onBin, 320); }
    else setDragOffset(0);
  }, [onLike, onBin]);

  const rotation = dragOffset * 0.06;
  const likeOpacity = Math.min(Math.max(dragOffset / THRESHOLD, 0), 1);
  const binOpacity = Math.min(Math.max(-dragOffset / THRESHOLD, 0), 1);
  const transform = exiting === "like" ? "translateX(130%) rotate(18deg)"
    : exiting === "bin" ? "translateX(-130%) rotate(-18deg)"
    : `translateX(${dragOffset}px) rotate(${rotation}deg) translateY(${stackIndex * 6}px) scale(${1 - stackIndex * 0.03})`;

  const diffMap: Record<string, { bg: string; color: string }> = {
    Easy: { bg: "#e8f5e8", color: "#2d7a2d" },
    Medium: { bg: "#fef3c7", color: "#92400e" },
    Hard: { bg: "#fee2e2", color: "#991b1b" },
  };
  const diffKey = recipe.difficulty
    ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1).toLowerCase()
    : "Medium";
  const diff = diffMap[diffKey] ?? diffMap["Medium"];

  return (
    <div className="scard"
      style={{ transform, transition: isDragging.current ? "none" : exiting ? "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)" : "transform 0.18s ease", zIndex: 10 - stackIndex, cursor: isTop ? "grab" : "default" }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => { if (isDragging.current) handleMove(e.clientX); }}
      onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }}
      onTouchEnd={handleEnd}
    >
      <div className="stamp stamp-like" style={{ opacity: likeOpacity }}>LIKE</div>
      <div className="stamp stamp-bin" style={{ opacity: binOpacity }}>BIN</div>

      <div className="scard-body" onClick={() => { if (!hasMoved.current && isTop) onOpen(); }}>
        <h3 className="scard-title">{recipe.title}</h3>
        <p className="scard-desc">{recipe.description}</p>
        <div className="scard-chips">
          <span className="chip chip-neutral">⏱ {recipe.prepTime} prep</span>
          <span className="chip chip-neutral">🔥 {recipe.cookTime} cook</span>
          <span className="chip" style={{ background: diff.bg, color: diff.color }}>{diffKey}</span>
        </div>
        {recipe.seasoningSuggestions?.[0] && (
          <div className="scard-tip"><span>💡</span><span>{recipe.seasoningSuggestions[0]}</span></div>
        )}
        <div className="scard-tags">
          {recipe.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        {isTop && <p className="scard-tap-hint">Tap card to read full recipe</p>}
      </div>

      {isTop && (
        <div className="scard-actions">
          <button className="scard-btn scard-btn-bin" onClick={(e) => { e.stopPropagation(); onBin(); }}>✕ Bin</button>
          <button className="scard-btn scard-btn-like" onClick={(e) => { e.stopPropagation(); onLike(); }}>✓ Like</button>
        </div>
      )}
    </div>
  );
}

// ─── Saved Meal Card ──────────────────────────────────────────────────────────

function SavedCard({ recipe, isLoved, inShoppingList, onOpen, onRemove, onToggleLove, onAddToShop }: {
  recipe: Recipe; isLoved: boolean; inShoppingList: boolean;
  onOpen: () => void; onRemove: () => void;
  onToggleLove: () => void; onAddToShop: () => void;
}) {
  const diffMap: Record<string, { bg: string; color: string }> = {
    Easy: { bg: "#e8f5e8", color: "#2d7a2d" },
    Medium: { bg: "#fef3c7", color: "#92400e" },
    Hard: { bg: "#fee2e2", color: "#991b1b" },
  };
  const diffKey = recipe.difficulty
    ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1).toLowerCase()
    : "Medium";
  const diff = diffMap[diffKey] ?? diffMap["Medium"];

  return (
    <div className={`mcard ${isLoved ? "mcard-loved" : ""}`} onClick={onOpen}>
      <div className="mcard-top">
        <button className="mcard-love" title={isLoved ? "Un-love" : "Love it"}
          onClick={(e) => { e.stopPropagation(); onToggleLove(); }}>
          {isLoved ? "♥" : "♡"}
        </button>
        <button className="mcard-remove" title="Remove from plan"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
      </div>
      {isLoved && <div className="mcard-love-badge">♥ Loved</div>}
      <h3 className="mcard-title">{recipe.title}</h3>
      <p className="mcard-desc">{recipe.description}</p>
      <div className="mcard-chips">
        <span className="chip chip-neutral">⏱ {recipe.prepTime}</span>
        <span className="chip chip-neutral">🔥 {recipe.cookTime}</span>
        <span className="chip" style={{ background: diff.bg, color: diff.color }}>{diffKey}</span>
      </div>
      <div className="mcard-tags">
        {recipe.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
      <button
        className={`mcard-shop-btn ${inShoppingList ? "mcard-shop-btn-added" : ""}`}
        onClick={(e) => { e.stopPropagation(); onAddToShop(); }}
      >
        {inShoppingList ? "✕ Remove from list" : "＋ Add to shopping list"}
      </button>
    </div>
  );
}

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ recipe, childCount, onClose, onBin, onLove, onToggleLove, onAddToShop, isLoved, inShoppingList, isInPending }: {
  recipe: Recipe; childCount: number; onClose: () => void;
  onBin?: () => void; onLove?: () => void;
  onToggleLove?: () => void; onAddToShop?: () => void;
  isLoved?: boolean; inShoppingList?: boolean; isInPending?: boolean;
}) {
  const hasKids = childCount > 0;
  const printId = `print-${recipe.id}`;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const handlePrint = () => {
    const el = document.getElementById(printId);
    if (!el) return;
    const w = window.open("", "_blank", "width=820,height=960");
    if (!w) return;
    w.document.write(`<html><head><title>${recipe.title} — Zumbie Kitchen</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Sora:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;padding:1.8cm 2cm;color:#1a2e1a;font-size:11pt}
        .ph{display:flex;align-items:center;gap:.9rem;margin-bottom:1.4rem;padding-bottom:.9rem;border-bottom:2px solid #2d7a2d}
        .ph img{height:26px;width:auto}.ph span{font-family:'Sora',sans-serif;font-size:.95rem;font-weight:800}
        h1{font-family:'Sora',sans-serif;font-size:1.55rem;font-weight:800;margin-bottom:.35rem}
        .desc{color:#4a6741;font-size:.88rem;margin-bottom:1rem;line-height:1.5}
        .stats{display:flex;gap:1rem;margin-bottom:1.2rem;flex-wrap:wrap}
        .stat{background:#e8f5e8;border-radius:6px;padding:.35rem .65rem;font-size:.78rem;font-weight:600;color:#2d7a2d}
        .cols{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem}
        h2{font-family:'Sora',sans-serif;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8aaa82;margin-bottom:.55rem}
        .ing{display:flex;gap:.5rem;padding:.25rem 0;border-bottom:1px solid #d9ead9;font-size:.86rem}
        .ia{min-width:68px;color:#8aaa82;font-weight:600;font-size:.8rem}
        .step{display:flex;gap:.55rem;margin-bottom:.65rem;font-size:.86rem;line-height:1.55}
        .sn{background:#d97706;color:white;min-width:21px;height:21px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;flex-shrink:0;margin-top:.1rem}
        .cn{background:#fef3c7;border-left:3px solid #d97706;padding:.3rem .55rem;margin-top:.28rem;font-size:.78rem;color:#92400e;border-radius:0 4px 4px 0}
        .tip{padding-left:.65rem;border-left:3px solid #a8d5a8;font-size:.83rem;color:#4a6741;margin-bottom:.38rem;line-height:1.5}
      </style></head><body>
      <div class="ph"><img src="/zumbie-kitchen-logo.png" alt=""/><span>Zumbie Kitchen</span></div>
      <h1>${recipe.title}</h1><p class="desc">${recipe.description}</p>
      <div class="stats">
        <span class="stat">⏱ Prep: ${recipe.prepTime}</span>
        <span class="stat">🔥 Cook: ${recipe.cookTime}</span>
        <span class="stat">👥 Serves: ${recipe.servings}</span>
        <span class="stat">📊 ${recipe.difficulty}</span>
      </div>
      <div class="cols"><div>
        <h2>Ingredients</h2>
        ${recipe.ingredients.map(i => `<div class="ing"><span class="ia">${i.quantity} ${i.unit}</span><span>${i.name}</span></div>`).join("")}
        ${recipe.seasoningSuggestions?.length ? `<br><h2>Tips &amp; Seasoning</h2>${recipe.seasoningSuggestions.map(t => `<div class="tip">${t}</div>`).join("")}` : ""}
      </div><div>
        <h2>Method</h2>
        ${recipe.steps.map((s, i) => `<div class="step"><span class="sn">${i + 1}</span><div>${s}${hasKids && recipe.childNotes?.[i] ? `<div class="cn">🍼 Under 2s: ${recipe.childNotes[i]}</div>` : ""}</div></div>`).join("")}
      </div></div></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div className="modal-toolbar-left">
            {isInPending && onBin && (
              <button className="modal-bin-btn" onClick={() => { onBin(); onClose(); }}>✕ Bin it</button>
            )}
            {isInPending && onLove && (
              <button className="modal-love-btn" onClick={() => { onLove(); onClose(); }}>♥ Love it</button>
            )}
            {!isInPending && onToggleLove && (
              <button className={`modal-love-btn ${isLoved ? "modal-love-active" : ""}`} onClick={onToggleLove}>
                {isLoved ? "♥ Loved" : "♡ Love it"}
              </button>
            )}
            {!isInPending && onAddToShop && (
              <button
                className={`modal-shop-btn ${inShoppingList ? "modal-shop-added" : ""}`}
                onClick={onAddToShop}
              >
                {inShoppingList ? "✕ Remove" : "＋ Shopping list"}
              </button>
            )}
          </div>
          <div className="modal-toolbar-right">
            <button className="modal-print-btn" onClick={handlePrint}>🖨 Print</button>
            <button className="modal-x" onClick={onClose}>✕</button>
          </div>
        </div>

        <div id={printId}>
          <div className="modal-top">
            <h2 className="modal-title">{recipe.title}</h2>
            <p className="modal-desc">{recipe.description}</p>
            {hasKids && (
              <div className="child-banner">
                🍼 <strong>Cooking for little ones too.</strong> Child notes appear inline in the method steps — set aside a portion before adding spices, salt, or honey.
              </div>
            )}
            <div className="modal-stats">
              {[
                { icon: "⏱", label: "Prep", val: recipe.prepTime },
                { icon: "🔥", label: "Cook", val: recipe.cookTime },
                { icon: "👥", label: "Serves", val: String(recipe.servings) },
                { icon: "📊", label: "Level", val: recipe.difficulty },
              ].map((s) => (
                <div key={s.label} className="modal-stat">
                  <span className="ms-icon">{s.icon}</span>
                  <span className="ms-label">{s.label}</span>
                  <span className="ms-val">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-col">
              <h3 className="modal-h3">Ingredients</h3>
              <ul className="ing-list">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="ing-row">
                    <span className="ing-amt">{ing.quantity} {ing.unit}</span>
                    <span className="ing-name">{ing.name}</span>
                  </li>
                ))}
              </ul>
              {recipe.seasoningSuggestions?.length > 0 && (
                <>
                  <h3 className="modal-h3" style={{ marginTop: "1.5rem" }}>Tips &amp; Seasoning</h3>
                  <ul className="tips-list">
                    {recipe.seasoningSuggestions.map((tip, i) => <li key={i} className="tip-item">{tip}</li>)}
                  </ul>
                </>
              )}
            </div>
            <div className="modal-col">
              <h3 className="modal-h3">Method</h3>
              <ol className="steps-list">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="step-item">
                    <span className="step-n">{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span>{step}</span>
                      {hasKids && recipe.childNotes?.[i] && (
                        <div className="step-child-note">🍼 <strong>Under 2s:</strong> {recipe.childNotes[i]}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shopping List ────────────────────────────────────────────────────────────

function ShoppingList({ items, onRemoveRecipe, recipeTitles }: {
  items: ShoppingItem[];
  onRemoveRecipe: (recipeId: string) => void;
  recipeTitles: Record<string, string>;
}) {
  const [list, setList] = useState<ShoppingItem[]>([]);
  useEffect(() => { setList(items.map((i) => ({ ...i, checked: i.checked ?? false }))); }, [items]);

  const tick = (id: string) => {
    setList((p) => p.map((i) => (i.id === id ? { ...i, checked: true } : i)));
    setTimeout(() => setList((p) => p.filter((i) => i.id !== id)), 500);
  };

  const categories = [...new Set(list.map((i) => i.category))].sort();
  // Which recipe IDs are in the list
  const recipeIds = [...new Set(list.map((i) => i.recipeId).filter(Boolean))] as string[];

  return (
    <section className="shop-section">
      <div className="shop-header">
        <div>
          <h2 className="section-heading">Shopping List</h2>
          {recipeIds.length > 0 && (
            <div className="shop-recipes">
              {recipeIds.map((rid) => (
                <span key={rid} className="shop-recipe-pill">
                  {recipeTitles[rid] || rid}
                  <button className="shop-recipe-remove" title="Remove this recipe from list"
                    onClick={() => onRemoveRecipe(rid)}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="print-btn" onClick={() => window.print()}>🖨 Print list</button>
      </div>

      <div className="print-only">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zumbie-kitchen-logo.png" alt="Zumbie Kitchen" className="print-logo" />
        <p className="print-subtitle">Zumbie Kitchen — Shopping List</p>
      </div>

      {list.length === 0 ? (
        <p className="shop-empty">All items ticked off! 🎉</p>
      ) : (
        <div className="shop-grid">
          {categories.map((cat) => (
            <div key={cat} className="shop-cat">
              <p className="shop-cat-label">{cat}</p>
              {list.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className={`shop-item ${item.checked ? "shop-item-done" : ""}`}>
                  <span className="shop-item-text"><strong>{item.quantity} {item.unit}</strong> {item.name}</span>
                  <button className="got-btn" onClick={() => tick(item.id)} disabled={item.checked}>
                    {item.checked ? "✓" : "Got it"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZumbieKitchen() {
  // ── Persisted state (loaded from localStorage on mount) ──
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [loved, setLoved] = useState<Set<string>>(new Set());
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  // Which recipe IDs have been added to shopping list (to prevent duplicates)
  const [shopRecipeIds, setShopRecipeIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    const savedRecipes = lsGet<Recipe[]>("zk_saved", []);
    const lovedIds = lsGet<string[]>("zk_loved", []);
    const shoppingItems = lsGet<ShoppingItem[]>("zk_shopping", []);
    const shopIds = lsGet<string[]>("zk_shopIds", []);
    setSaved(savedRecipes);
    setLoved(new Set(lovedIds));
    setShopping(shoppingItems);
    setShopRecipeIds(new Set(shopIds));
    setHydrated(true);
  }, []);

  // Persist whenever they change
  useEffect(() => { if (hydrated) lsSet("zk_saved", saved); }, [saved, hydrated]);
  useEffect(() => { if (hydrated) lsSet("zk_loved", [...loved]); }, [loved, hydrated]);
  useEffect(() => { if (hydrated) lsSet("zk_shopping", shopping); }, [shopping, hydrated]);
  useEffect(() => { if (hydrated) lsSet("zk_shopIds", [...shopRecipeIds]); }, [shopRecipeIds, hydrated]);

  // ── Session-only state ──
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [suggestCount, setSuggestCount] = useState(3);
  const [fancyInput, setFancyInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [pending, setPending] = useState<Recipe[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("added");
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [openFromPending, setOpenFromPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const msgs = ["Thinking up ideas…", "Checking the cupboards…", "Sharpening knives…", "Almost ready…"];

  // ── API call — no longer auto-populates shopping list ──
  const callApi = async (mode: "suggest" | "fancy" | "make", input?: string, count?: number) => {
    setLoading(true); setError(null); setPending([]);
    let i = 0; setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 1600);
    try {
      const res = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, count, adults, childrenUnder2: children }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      // Attach shoppingItems to each recipe so we can add them later on demand
      const recipes: Recipe[] = (data.recipes || []).map((r: Recipe, idx: number) => ({
        ...r,
        shoppingItems: (data.shoppingList || [])
          .filter((_: ShoppingItem, i: number) => i % (data.recipes?.length || 1) === idx % (data.recipes?.length || 1))
          .map((s: ShoppingItem) => ({ ...s, recipeId: r.id })),
      }));
      // Better: just tag all shopping items with recipeId by splitting evenly isn't reliable
      // Instead store the full shoppingList on each recipe keyed by recipeId
      const allShopItems: ShoppingItem[] = (data.shoppingList || []).map((s: ShoppingItem) => ({ ...s }));
      const recipesWithShop = (data.recipes || []).map((r: Recipe) => ({
        ...r,
        // Each recipe gets the full shopping list tagged with its own id
        // The API returns consolidated — we'll just tag every item with the recipe and dedupe on add
        shoppingItems: r.ingredients.map((ing: Ingredient, idx: number) => ({
          id: `${r.id}-${idx}`,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: allShopItems.find((s) => s.name.toLowerCase().includes(ing.name.toLowerCase()))?.category ?? "Other",
          recipeId: r.id,
        })),
      }));
      setPending(recipesWithShop);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { clearInterval(interval); setLoading(false); }
  };

  // ── Add a recipe's ingredients to the shopping list ──
  const addToShoppingList = useCallback((recipe: Recipe) => {
    if (shopRecipeIds.has(recipe.id)) return;
    const items: ShoppingItem[] = (recipe.shoppingItems || recipe.ingredients.map((ing, idx) => ({
      id: `${recipe.id}-${idx}`,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: "Other",
      recipeId: recipe.id,
    }))).map((s) => ({ ...s, recipeId: recipe.id, checked: false }));

    setShopping((prev) => {
      // Merge: if same ingredient name exists, don't duplicate — just add new items
      const existingNames = new Set(prev.map((x) => x.name.toLowerCase()));
      const newItems = items.filter((x) => !existingNames.has(x.name.toLowerCase()));
      return [...prev, ...newItems];
    });
    setShopRecipeIds((prev) => new Set([...prev, recipe.id]));
  }, [shopRecipeIds]);

  // ── Remove a recipe's items from the shopping list ──
  const removeFromShoppingList = useCallback((recipeId: string) => {
    setShopping((prev) => prev.filter((i) => i.recipeId !== recipeId));
    setShopRecipeIds((prev) => { const n = new Set(prev); n.delete(recipeId); return n; });
  }, []);

  // ── Like / Love / Bin ──
  const handleLike = useCallback((recipe: Recipe) => {
    setSaved((p) => p.find((r) => r.id === recipe.id) ? p : [...p, recipe]);
    setPending((p) => p.filter((r) => r.id !== recipe.id));
  }, []);

  const handleLove = useCallback((recipe: Recipe) => {
    setSaved((p) => p.find((r) => r.id === recipe.id) ? p : [...p, recipe]);
    setLoved((p) => new Set([...p, recipe.id]));
    setPending((p) => p.filter((r) => r.id !== recipe.id));
  }, []);

  const handleBin = useCallback((recipe: Recipe) => {
    setPending((p) => p.filter((r) => r.id !== recipe.id));
  }, []);

  const toggleLove = useCallback((id: string) => {
    setLoved((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const removeFromSaved = useCallback((id: string) => {
    setSaved((p) => p.filter((r) => r.id !== id));
    setLoved((p) => { const n = new Set(p); n.delete(id); return n; });
    removeFromShoppingList(id);
  }, [removeFromShoppingList]);

  // ── Sort ──
  const sortedSaved = [...saved].sort((a, b) => {
    if (sortMode === "loved") {
      const diff = (loved.has(a.id) ? 0 : 1) - (loved.has(b.id) ? 0 : 1);
      if (diff !== 0) return diff;
    }
    if (sortMode === "alpha") return a.title.localeCompare(b.title);
    if (sortMode === "cookTime") {
      const parse = (s: string) => parseInt(s.replace(/\D/g, "")) || 999;
      return parse(a.cookTime) - parse(b.cookTime);
    }
    return 0;
  });

  const recipeTitles: Record<string, string> = {};
  saved.forEach((r) => { recipeTitles[r.id] = r.title; });

  const showSwipe = !loading && pending.length > 0;
  const showSaved = saved.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f4f8f4;
          --surface: #ffffff;
          --border: #d4e8d4;
          --border-strong: #b0ceb0;
          --text: #1a2e1a;
          --text-2: #4a6741;
          --text-3: #8aaa82;
          --amber: #d97706;
          --amber-hover: #b45309;
          --amber-light: #fef3c7;
          --amber-border: #fcd34d;
          --green: #2d7a2d;
          --green-bg: #e8f5e8;
          --green-border: #a8d5a8;
          --love: #e11d48;
          --love-bg: #fff1f2;
          --love-border: #fecdd3;
          --red: #dc2626;
          --red-bg: #fee2e2;
          --radius: 14px;
          --radius-sm: 8px;
          --shadow: 0 1px 3px rgba(45,122,45,0.07), 0 4px 16px rgba(45,122,45,0.07);
          --shadow-lg: 0 8px 32px rgba(45,122,45,0.14);
        }

        body {
          font-family: 'Inter', system-ui, sans-serif;
          background-color: var(--bg);
          background-image: url('/zumbie-kitchen-logo.png');
          background-repeat: no-repeat;
          background-position: center 160px;
          background-size: 680px auto;
          background-attachment: fixed;
          color: var(--text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        @media (min-width: 1200px) {
          body { background-size: 860px auto; background-position: center 140px; }
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(244,248,244,0.90);
          pointer-events: none;
          z-index: 0;
        }
        .nav, .page { position: relative; z-index: 1; }

        /* Nav */
        .nav { background: rgba(255,255,255,0.97); border-bottom: 2px solid var(--border); padding: 0 2rem; height: 80px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 12px rgba(45,122,45,0.08); backdrop-filter: blur(8px); }
        .nav-logo-text { font-family: 'Sora', sans-serif; font-size: 1.7rem; font-weight: 800; color: var(--text); letter-spacing: -0.03em; }
        .nav-logo-text span { color: var(--amber); }
        .cooking-for { display: flex; align-items: center; gap: 0.5rem; background: var(--green-bg); border: 1.5px solid var(--green-border); border-radius: 12px; padding: 0.55rem 1rem; }
        .cooking-for-mobile { display: none; }
        .cooking-for-label { font-size: 0.78rem; font-weight: 700; color: var(--green); white-space: nowrap; }
        .cooking-for-divider { width: 1px; height: 20px; background: var(--green-border); margin: 0 0.25rem; }
        .people-ctrl { display: flex; align-items: center; gap: 0.5rem; }
        .people-label { font-size: 0.75rem; color: var(--text-2); font-weight: 600; white-space: nowrap; }

        /* Counter */
        .counter { display: flex; align-items: center; border: 1.5px solid var(--green-border); border-radius: var(--radius-sm); overflow: hidden; }
        .counter-btn { width: 28px; height: 28px; border: none; background: var(--green-bg); color: var(--green); font-size: 1.1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.1s; line-height: 1; }
        .counter-btn:hover:not(:disabled) { background: var(--green-border); }
        .counter-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .counter-val { min-width: 28px; height: 28px; text-align: center; font-size: 0.9rem; font-weight: 700; border-left: 1px solid var(--green-border); border-right: 1px solid var(--green-border); display: flex; align-items: center; justify-content: center; background: var(--surface); color: var(--text); }

        /* Page */
        .page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }

        /* Panels */
        .panels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem; align-items: stretch; }
        @media (max-width: 760px) {
          .panels { grid-template-columns: 1fr; }
          .nav { height: 64px; padding: 0 1rem; }
          .nav-logo-text { font-size: 1.35rem; }
          .cooking-for-desktop { display: none; }
          .cooking-for-mobile {
            display: flex !important;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 0.6rem;
            border-radius: 0;
            border: none;
            border-bottom: 2px solid var(--green-border);
            padding: 0.55rem 1rem;
            position: sticky;
            top: 64px;
            z-index: 49;
            width: 100%;
          }
        }
        .panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 1rem; }
        .panel-top { flex: 1; display: flex; flex-direction: column; gap: 1rem; }
        .panel-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
        .panel-title { font-family: 'Sora', sans-serif; font-size: 1.05rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; margin-top: -0.2rem; }
        .field { width: 100%; background: var(--bg); border: 1.5px solid var(--border-strong); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.875rem; color: var(--text); resize: none; outline: none; transition: border-color 0.15s, box-shadow 0.15s; line-height: 1.5; }
        .field:focus { border-color: var(--amber); box-shadow: 0 0 0 3px rgba(217,119,6,0.1); }
        .field::placeholder { color: var(--text-3); }
        .count-row { display: flex; align-items: center; gap: 0.75rem; }
        .count-label { font-size: 0.85rem; color: var(--text-2); }
        .gen-btn { width: 100%; padding: 0.72rem 1rem; border: none; border-radius: var(--radius-sm); font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.1s; background: var(--amber); color: #fff; }
        .gen-btn:hover:not(:disabled) { background: var(--amber-hover); }
        .gen-btn:active:not(:disabled) { transform: scale(0.98); }
        .gen-btn:disabled { background: #c9bfa0; color: #a09070; cursor: not-allowed; }

        /* Loader / Error */
        .loader { text-align: center; padding: 3.5rem 1rem; }
        .loader-ring { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-text { font-size: 0.875rem; color: var(--text-2); }
        .error-banner { background: var(--red-bg); border: 1px solid #fca5a5; color: var(--red); border-radius: var(--radius-sm); padding: 0.85rem 1rem; font-size: 0.875rem; margin-bottom: 1.5rem; display: flex; gap: 0.5rem; }

        /* Section */
        .section-heading { font-family: 'Sora', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--text); letter-spacing: -0.025em; }
        .section-sub { font-size: 0.8rem; color: var(--text-3); margin-top: 0.2rem; }
        .section-top { margin-bottom: 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .section-top-text { flex: 1; }

        /* Swipe */
        .swipe-wrap { margin-bottom: 3rem; }
        .card-stack { position: relative; height: 400px; max-width: 440px; margin: 0 auto; }
        .scard { position: absolute; inset: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: 18px; box-shadow: var(--shadow-lg); padding: 1.5rem; display: flex; flex-direction: column; user-select: none; touch-action: pan-y; overflow: hidden; }
        .scard-body { flex: 1; display: flex; flex-direction: column; gap: 0.7rem; overflow: hidden; cursor: pointer; }
        .scard-title { font-family: 'Sora', sans-serif; font-size: 1.15rem; font-weight: 800; color: var(--text); letter-spacing: -0.025em; line-height: 1.3; }
        .scard-desc { font-size: 0.845rem; color: var(--text-2); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scard-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .chip { font-size: 0.73rem; font-weight: 500; padding: 0.2rem 0.6rem; border-radius: 20px; white-space: nowrap; }
        .chip-neutral { background: var(--bg); color: var(--text-2); border: 1px solid var(--border); }
        .scard-tip { background: var(--amber-light); border: 1px solid var(--amber-border); border-radius: var(--radius-sm); padding: 0.45rem 0.7rem; font-size: 0.8rem; color: #92400e; display: flex; gap: 0.4rem; line-height: 1.5; }
        .scard-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
        .tag { font-size: 0.7rem; font-weight: 500; background: var(--green-bg); border: 1px solid var(--green-border); color: var(--green); border-radius: 20px; padding: 0.15rem 0.55rem; }
        .scard-tap-hint { font-size: 0.72rem; color: var(--text-3); text-align: center; margin-top: auto; padding-top: 0.25rem; }
        .stamp { position: absolute; font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: 0.06em; padding: 0.22rem 0.7rem; border-radius: 6px; border: 2.5px solid; pointer-events: none; top: 1.25rem; }
        .stamp-like { right: 1.25rem; color: var(--green); border-color: var(--green); background: var(--green-bg); transform: rotate(10deg); }
        .stamp-bin { left: 1.25rem; color: var(--red); border-color: var(--red); background: var(--red-bg); transform: rotate(-10deg); }
        .scard-actions { display: flex; gap: 0.6rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
        .scard-btn { flex: 1; padding: 0.6rem; border-radius: var(--radius-sm); font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1.5px solid; }
        .scard-btn-bin { background: #fff; border-color: #fca5a5; color: var(--red); }
        .scard-btn-bin:hover { background: var(--red-bg); border-color: var(--red); }
        .scard-btn-like { background: var(--green); border-color: var(--green); color: #fff; }
        .scard-btn-like:hover { background: #1f5c1f; }

        /* Meal plan grid */
        .meal-plan-wrap { margin-bottom: 2.5rem; }
        .sort-bar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .sort-label { font-size: 0.75rem; color: var(--text-3); font-weight: 600; }
        .sort-btn { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 0.25rem 0.7rem; font-size: 0.75rem; font-weight: 600; color: var(--text-2); cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { border-color: var(--amber); color: var(--amber); }
        .sort-btn.active { background: var(--amber); border-color: var(--amber); color: #fff; }
        .clear-btn { background: none; border: 1.5px solid #fca5a5; border-radius: 20px; padding: 0.25rem 0.7rem; font-size: 0.75rem; font-weight: 600; color: var(--red); cursor: pointer; transition: all 0.15s; }
        .clear-btn:hover { background: var(--red-bg); }

        .meal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1rem; margin-top: 1.25rem; }
        .mcard { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 1.1rem; cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 0.45rem; position: relative; }
        .mcard:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
        .mcard-loved { border-color: var(--love); background: linear-gradient(135deg, #fff 75%, var(--love-bg)); }
        .mcard-top { display: flex; justify-content: flex-end; gap: 0.4rem; }
        .mcard-love { background: none; border: none; font-size: 1.15rem; cursor: pointer; color: var(--love); line-height: 1; padding: 0.1rem; transition: transform 0.15s; }
        .mcard-love:hover { transform: scale(1.2); }
        .mcard-remove { background: none; border: none; font-size: 0.8rem; cursor: pointer; color: var(--text-3); padding: 0.15rem; border-radius: 4px; transition: color 0.1s, background 0.1s; line-height: 1; }
        .mcard-remove:hover { color: var(--red); background: var(--red-bg); }
        .mcard-love-badge { display: inline-flex; align-items: center; gap: 0.2rem; background: var(--love); color: #fff; font-size: 0.67rem; font-weight: 700; border-radius: 20px; padding: 0.1rem 0.5rem; width: fit-content; }
        .mcard-title { font-family: 'Sora', sans-serif; font-size: 0.92rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; line-height: 1.3; }
        .mcard-desc { font-size: 0.78rem; color: var(--text-2); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .mcard-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; }
        .mcard-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .mcard-shop-btn { margin-top: 0.4rem; width: 100%; padding: 0.45rem; border-radius: var(--radius-sm); border: 1.5px solid var(--amber); background: #fff; color: var(--amber); font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
        .mcard-shop-btn:hover:not(:disabled) { background: var(--amber); color: #fff; }
        .mcard-shop-btn-added { border-color: var(--red); color: var(--red); background: var(--red-bg); cursor: pointer; }
        .mcard-shop-btn-added:hover { background: var(--red); color: #fff; border-color: var(--red); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(6px); z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; overflow-y: auto; }
        .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; max-width: 720px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.18); overflow: hidden; margin: auto; }
        .modal-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border); background: var(--bg); gap: 0.75rem; flex-wrap: wrap; }
        .modal-toolbar-left { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .modal-toolbar-right { display: flex; align-items: center; gap: 0.5rem; }
        .modal-bin-btn { background: var(--red-bg); color: var(--red); border: 1.5px solid #fca5a5; border-radius: var(--radius-sm); padding: 0.4rem 0.9rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .modal-bin-btn:hover { background: var(--red); color: #fff; }
        .modal-love-btn { background: var(--love-bg); color: var(--love); border: 1.5px solid var(--love-border); border-radius: var(--radius-sm); padding: 0.4rem 0.9rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .modal-love-btn:hover, .modal-love-active { background: var(--love); color: #fff; border-color: var(--love); }
        .modal-shop-btn { background: var(--surface); color: var(--amber); border: 1.5px solid var(--amber); border-radius: var(--radius-sm); padding: 0.4rem 0.9rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .modal-shop-btn:hover:not(:disabled) { background: var(--amber); color: #fff; }
        .modal-shop-added { background: var(--red-bg); color: var(--red); border-color: var(--red); cursor: pointer; }
        .modal-shop-added:hover { background: var(--red); color: #fff; }
        .modal-print-btn { background: var(--amber); color: #fff; border: none; border-radius: var(--radius-sm); padding: 0.4rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .modal-print-btn:hover { background: var(--amber-hover); }
        .modal-x { background: var(--surface); border: 1px solid var(--border); color: var(--text-2); width: 30px; height: 30px; border-radius: 50%; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.1s; }
        .modal-x:hover { background: var(--border); }
        .modal-top { padding: 1.75rem 2rem 1.5rem; border-bottom: 1px solid var(--border); }
        .modal-title { font-family: 'Sora', sans-serif; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text); margin-bottom: 0.45rem; }
        .modal-desc { font-size: 0.875rem; color: var(--text-2); line-height: 1.6; margin-bottom: 1rem; }
        .child-banner { background: var(--amber-light); border: 1.5px solid var(--amber-border); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.845rem; color: #92400e; line-height: 1.55; margin-bottom: 1rem; }
        .modal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
        .modal-stat { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.65rem 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .ms-icon { font-size: 1.1rem; }
        .ms-label { font-size: 0.63rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); }
        .ms-val { font-size: 0.85rem; font-weight: 600; color: var(--text); }
        .modal-body { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 600px) { .modal-body { grid-template-columns: 1fr; } .modal-stats { grid-template-columns: repeat(2,1fr); } }
        .modal-col { padding: 1.5rem 2rem; }
        .modal-col:first-child { border-right: 1px solid var(--border); }
        .modal-h3 { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-3); margin-bottom: 0.9rem; }
        .ing-list { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
        .ing-row { display: flex; gap: 0.6rem; font-size: 0.87rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--border); }
        .ing-amt { color: var(--text-3); font-weight: 600; min-width: 68px; font-size: 0.82rem; }
        .ing-name { color: var(--text); }
        .tips-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
        .tip-item { font-size: 0.845rem; color: var(--text-2); padding-left: 0.75rem; border-left: 2.5px solid var(--green-border); line-height: 1.55; }
        .steps-list { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; }
        .step-item { display: flex; gap: 0.75rem; font-size: 0.875rem; color: var(--text); line-height: 1.6; align-items: flex-start; }
        .step-n { background: var(--amber); color: #fff; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; margin-top: 0.15rem; }
        .step-child-note { margin-top: 0.4rem; background: var(--amber-light); border-left: 3px solid var(--amber); border-radius: 0 6px 6px 0; padding: 0.35rem 0.65rem; font-size: 0.8rem; color: #92400e; line-height: 1.5; }

        /* Shopping */
        .shop-section { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 1.75rem; box-shadow: var(--shadow); }
        .shop-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }
        .shop-recipes { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
        .shop-recipe-pill { display: inline-flex; align-items: center; gap: 0.35rem; background: var(--green-bg); border: 1px solid var(--green-border); border-radius: 20px; padding: 0.18rem 0.4rem 0.18rem 0.65rem; font-size: 0.73rem; font-weight: 600; color: var(--green); }
        .shop-recipe-remove { background: none; border: none; cursor: pointer; color: var(--green); font-size: 0.7rem; line-height: 1; padding: 0; opacity: 0.65; }
        .shop-recipe-remove:hover { opacity: 1; color: var(--red); }
        .print-btn { background: var(--amber); color: #fff; border: none; border-radius: var(--radius-sm); padding: 0.45rem 0.9rem; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .print-btn:hover { background: var(--amber-hover); }
        .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0 2rem; }
        .shop-cat { margin-bottom: 1.25rem; break-inside: avoid; }
        .shop-cat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--amber); margin-bottom: 0.4rem; }
        .shop-item { display: flex; align-items: center; justify-content: space-between; padding: 0.38rem 0; border-bottom: 1px solid var(--border); gap: 0.75rem; transition: opacity 0.3s, transform 0.3s; }
        .shop-item-done { opacity: 0.3; text-decoration: line-through; transform: translateX(6px); }
        .shop-item-text { font-size: 0.845rem; color: var(--text); flex: 1; }
        .got-btn { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); border-radius: 6px; padding: 0.2rem 0.55rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.12s; flex-shrink: 0; }
        .got-btn:hover:not(:disabled) { background: var(--green-border); }
        .got-btn:disabled { opacity: 0.5; cursor: default; }
        .shop-empty { text-align: center; padding: 2rem; font-size: 0.875rem; color: var(--text-3); }

        /* Print */
        .print-only { display: none; }
        @media print {
          body { background: white; }
          .nav, .panels, .swipe-wrap, .meal-plan-wrap, .modal-overlay, .print-btn, .got-btn { display: none !important; }
          .print-only { display: flex !important; flex-direction: row; align-items: center; gap: 1rem; padding-bottom: 0.75rem; margin-bottom: 1rem; border-bottom: 2px solid #2d7a2d; }
          .print-logo { height: 44px; width: auto; }
          .print-subtitle { font-family: 'Sora', sans-serif; font-size: 1.1rem; font-weight: 800; color: #1a2e1a; }
          .shop-section { border: none; box-shadow: none; padding: 0; }
          .shop-recipes, .shop-header > div > .section-heading { display: block; }
          .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 2.5rem; }
          .shop-cat-label { color: #d97706; }
          .shop-item { padding: 0.25rem 0; font-size: 10pt; }
          .shop-item-text { font-size: 10pt; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo-text">Zumbie <span>Kitchen</span></span>
        <div className="cooking-for cooking-for-desktop">
          <span className="cooking-for-label">🍽 Cooking for</span>
          <div className="cooking-for-divider" />
          <div className="people-ctrl">
            <span className="people-label">👨‍👩‍👧 Adults</span>
            <Counter value={adults} onChange={setAdults} min={1} max={20} />
          </div>
          <div className="cooking-for-divider" />
          <div className="people-ctrl">
            <span className="people-label">🍼 Under 2s</span>
            <Counter value={children} onChange={setChildren} min={0} max={10} />
          </div>
        </div>
      </nav>
      {/* Mobile-only cooking-for bar */}
      <div className="cooking-for cooking-for-mobile">
        <span className="cooking-for-label">🍽 Cooking for</span>
        <div className="cooking-for-divider" />
        <div className="people-ctrl">
          <span className="people-label">👨‍👩‍👧 Adults</span>
          <Counter value={adults} onChange={setAdults} min={1} max={20} />
        </div>
        <div className="cooking-for-divider" />
        <div className="people-ctrl">
          <span className="people-label">🍼 Under 2s</span>
          <Counter value={children} onChange={setChildren} min={0} max={10} />
        </div>
      </div>

      <div className="page">

        {/* Panels */}
        <div className="panels">
          <div className="panel">
            <div className="panel-top">
              <div><p className="panel-label">Mode 1</p><p className="panel-title">Suggest me recipes</p></div>
              <div className="count-row">
                <Counter value={suggestCount} onChange={setSuggestCount} min={1} max={10} />
                <span className="count-label">recipes</span>
              </div>
            </div>
            <button className="gen-btn" disabled={loading} onClick={() => callApi("suggest", undefined, suggestCount)}>
              Suggest {suggestCount} recipe{suggestCount !== 1 ? "s" : ""}
            </button>
          </div>
          <div className="panel">
            <div className="panel-top">
              <div><p className="panel-label">Mode 2</p><p className="panel-title">I fancy this…</p></div>
              <textarea className="field" rows={3} placeholder="e.g. something spicy and comforting, a lighter pasta, Sunday roast vibes…" value={fancyInput} onChange={(e) => setFancyInput(e.target.value)} />
            </div>
            <button className="gen-btn" disabled={loading || !fancyInput.trim()} onClick={() => callApi("fancy", fancyInput)}>Find me 3 recipes</button>
          </div>
          <div className="panel">
            <div className="panel-top">
              <div><p className="panel-label">Mode 3</p><p className="panel-title">Make something with…</p></div>
              <textarea className="field" rows={3} placeholder="e.g. leftover chicken and sweet potato, tinned tomatoes and lentils…" value={makeInput} onChange={(e) => setMakeInput(e.target.value)} />
            </div>
            <button className="gen-btn" disabled={loading || !makeInput.trim()} onClick={() => callApi("make", makeInput)}>Cook something up</button>
          </div>
        </div>

        {error && <div className="error-banner"><span>⚠️</span><span>{error}</span></div>}
        {loading && <div className="loader"><div className="loader-ring" /><p className="loader-text">{loadingMsg}</p></div>}

        {/* Swipe zone */}
        {showSwipe && (
          <div className="swipe-wrap">
            <div className="section-top">
              <div className="section-top-text">
                <h2 className="section-heading">{pending.length} recipe{pending.length !== 1 ? "s" : ""} to review</h2>
                <p className="section-sub">Swipe or tap Like / Bin · Tap the card to read first</p>
              </div>
            </div>
            <div className="card-stack">
              {[...pending].reverse().map((recipe, revIdx) => (
                <SwipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isTop={revIdx === pending.length - 1}
                  stackIndex={pending.length - 1 - revIdx}
                  onLike={() => handleLike(recipe)}
                  onBin={() => handleBin(recipe)}
                  onOpen={() => { setOpenRecipe(recipe); setOpenFromPending(true); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Meal plan — shown alongside swipe zone if saved recipes exist, or replaces it once pending empty */}
        {showSaved && (
          <div className="meal-plan-wrap">
            <div className="section-top">
              <div className="section-top-text">
                <h2 className="section-heading">Your meal plan ({saved.length})</h2>
                <p className="section-sub">Tap a card to open · ♥ to love · ＋ to add to shopping list</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div className="sort-bar">
                  <span className="sort-label">Sort:</span>
                  {([["added","Added"],["loved","♥ Loved"],["alpha","A–Z"],["cookTime","Time"]] as [SortMode,string][]).map(([m,l]) => (
                    <button key={m} className={`sort-btn ${sortMode===m?"active":""}`} onClick={() => setSortMode(m)}>{l}</button>
                  ))}
                </div>
                <button className="clear-btn" onClick={() => { if (confirm("Clear all saved recipes?")) { setSaved([]); setLoved(new Set()); setShopping([]); setShopRecipeIds(new Set()); } }}>
                  Clear all
                </button>
              </div>
            </div>
            <div className="meal-grid">
              {sortedSaved.map((recipe) => (
                <SavedCard
                  key={recipe.id}
                  recipe={recipe}
                  isLoved={loved.has(recipe.id)}
                  inShoppingList={shopRecipeIds.has(recipe.id)}
                  onOpen={() => { setOpenRecipe(recipe); setOpenFromPending(false); }}
                  onRemove={() => removeFromSaved(recipe.id)}
                  onToggleLove={() => toggleLove(recipe.id)}
                  onAddToShop={() => shopRecipeIds.has(recipe.id) ? removeFromShoppingList(recipe.id) : addToShoppingList(recipe)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shopping list — only shows if items have been manually added */}
        {shopping.length > 0 && (
          <ShoppingList
            items={shopping}
            onRemoveRecipe={removeFromShoppingList}
            recipeTitles={recipeTitles}
          />
        )}
      </div>

      {/* Recipe modal */}
      {openRecipe && (
        <RecipeModal
          recipe={openRecipe}
          childCount={children}
          onClose={() => { setOpenRecipe(null); setOpenFromPending(false); }}
          isInPending={openFromPending}
          isLoved={loved.has(openRecipe.id)}
          inShoppingList={shopRecipeIds.has(openRecipe.id)}
          onBin={openFromPending ? () => handleBin(openRecipe) : undefined}
          onLove={openFromPending ? () => handleLove(openRecipe) : undefined}
          onToggleLove={!openFromPending ? () => toggleLove(openRecipe.id) : undefined}
          onAddToShop={!openFromPending ? () => shopRecipeIds.has(openRecipe.id) ? removeFromShoppingList(openRecipe.id) : addToShoppingList(openRecipe) : undefined}
        />
      )}
    </>
  );
}
