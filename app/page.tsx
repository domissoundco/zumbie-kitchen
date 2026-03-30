"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  ChefHat,
  ShoppingBasket,
  Heart,
  Trash2,
  Sparkles,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react"

const PROTEINS = [
  "Chicken",
  "Beef",
  "Turkey",
  "Pork",
  "Salmon",
  "White Fish",
  "Tofu",
  "Lentils",
  "Eggs",
]

const VEG = [
  "Broccoli",
  "Carrots",
  "Peppers",
  "Spinach",
  "Peas",
  "Sweetcorn",
  "Courgette",
  "Cauliflower",
  "Green Beans",
  "Tomatoes",
  "Mushrooms",
  "Onions",
]

const STYLES = ["Traybake", "Pasta", "Stir-fry", "Curry", "Bowl", "One-pot", "Wrap"]
const CARBS = ["Rice", "Pasta", "Potatoes", "Noodles", "Wraps", "Couscous"]
const PANTRY_DEFAULTS = ["Salt", "Pepper", "Olive oil", "Garlic"]

const PROTEIN_MAP: Record<string, { name: string; qty: number; unit: string }> = {
  Chicken: { name: "Chicken breast", qty: 180, unit: "g" },
  Beef: { name: "Beef strips", qty: 180, unit: "g" },
  Turkey: { name: "Turkey mince", qty: 180, unit: "g" },
  Pork: { name: "Pork mince", qty: 180, unit: "g" },
  Salmon: { name: "Salmon fillets", qty: 1, unit: "fillet" },
  "White Fish": { name: "White fish fillets", qty: 1, unit: "fillet" },
  Tofu: { name: "Firm tofu", qty: 160, unit: "g" },
  Lentils: { name: "Red lentils", qty: 100, unit: "g" },
  Eggs: { name: "Eggs", qty: 2, unit: "egg" },
}

const VEG_MAP: Record<string, { name: string; qty: number; unit: string }> = {
  Broccoli: { name: "Broccoli", qty: 0.5, unit: "head" },
  Carrots: { name: "Carrots", qty: 120, unit: "g" },
  Peppers: { name: "Bell peppers", qty: 1, unit: "pepper" },
  Spinach: { name: "Spinach", qty: 80, unit: "g" },
  Peas: { name: "Frozen peas", qty: 120, unit: "g" },
  Sweetcorn: { name: "Sweetcorn", qty: 0.5, unit: "tin" },
  Courgette: { name: "Courgette", qty: 1, unit: "courgette" },
  Cauliflower: { name: "Cauliflower", qty: 0.5, unit: "head" },
  "Green Beans": { name: "Green beans", qty: 120, unit: "g" },
  Tomatoes: { name: "Chopped tomatoes", qty: 1, unit: "tin" },
  Mushrooms: { name: "Mushrooms", qty: 150, unit: "g" },
  Onions: { name: "Onions", qty: 1, unit: "onion" },
}

const CARB_MAP: Record<string, { name: string; qty: number; unit: string }> = {
  Rice: { name: "Rice", qty: 75, unit: "g" },
  Pasta: { name: "Pasta", qty: 90, unit: "g" },
  Potatoes: { name: "Potatoes", qty: 250, unit: "g" },
  Noodles: { name: "Noodles", qty: 90, unit: "g" },
  Wraps: { name: "Wraps", qty: 2, unit: "wrap" },
  Couscous: { name: "Couscous", qty: 80, unit: "g" },
}

type Recipe = {
  id: string
  title: string
  protein: string
  veg: string[]
  carb: string
  style: string
  serves: { mum: number; dad: number; son: number }
  notes: string
  ingredients: { name: string; qty: number; unit: string; category: string }[]
}

function toggleItem(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function roundQty(value: number) {
  return Number.isInteger(value) ? value : Math.round(value * 10) / 10
}

function buildIngredients(recipe: Omit<Recipe, "ingredients">) {
  const totalPeople = recipe.serves.mum + recipe.serves.dad + recipe.serves.son
  const ingredients: Recipe["ingredients"] = []

  const protein = PROTEIN_MAP[recipe.protein]
  if (protein) {
    ingredients.push({
      name: protein.name,
      qty: protein.qty * totalPeople,
      unit: protein.unit,
      category: "Protein",
    })
  }

  recipe.veg.forEach((veg) => {
    const item = VEG_MAP[veg]
    if (item) {
      ingredients.push({
        name: item.name,
        qty: item.qty * totalPeople,
        unit: item.unit,
        category: "Veg",
      })
    }
  })

  const carb = CARB_MAP[recipe.carb]
  if (carb) {
    ingredients.push({
      name: carb.name,
      qty: carb.qty * totalPeople,
      unit: carb.unit,
      category: "Carbs",
    })
  }

  PANTRY_DEFAULTS.forEach((item) => {
    ingredients.push({ name: item, qty: 1, unit: "pantry", category: "Pantry" })
  })

  return ingredients
}

function generateRecipes({
  count,
  proteins,
  veg,
  styles,
  mum,
  dad,
  son,
}: {
  count: number
  proteins: string[]
  veg: string[]
  styles: string[]
  mum: number
  dad: number
  son: number
}): Recipe[] {
  const proteinPool = proteins.length ? proteins : PROTEINS
  const vegPool = veg.length ? veg : VEG
  const stylePool = styles.length ? styles : STYLES

  return Array.from({ length: count }).map((_, i) => {
    const protein = proteinPool[i % proteinPool.length]
    const vegA = vegPool[i % vegPool.length]
    const vegB = vegPool[(i + 3) % vegPool.length]
    const style = stylePool[i % stylePool.length]
    const carb = CARBS[i % CARBS.length]

    const base = {
      id: `${Date.now()}-${i}`,
      title: `${protein} ${style} with ${vegA}${vegA !== vegB ? ` & ${vegB}` : ""}`,
      protein,
      veg: vegA !== vegB ? [vegA, vegB] : [vegA],
      carb,
      style,
      serves: { mum, dad, son },
      notes: "Family-friendly idea generated from your selected ingredients.",
    }

    return { ...base, ingredients: buildIngredients(base) }
  })
}

function PillToggle({ value, active, onClick }: { value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      {value}
    </button>
  )
}

function Counter({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-3 text-sm font-medium text-slate-600">{label}</div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => setValue(Math.max(0, value - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-semibold">{value}</div>
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => setValue(value + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function Page() {
  const [selectedProteins, setSelectedProteins] = useState(["Chicken", "Beef"])
  const [selectedVeg, setSelectedVeg] = useState(["Broccoli", "Carrots", "Peppers", "Onions"])
  const [selectedStyles, setSelectedStyles] = useState(["Traybake", "Stir-fry", "Pasta"])
  const [recipeCount, setRecipeCount] = useState(5)
  const [mum, setMum] = useState(1)
  const [dad, setDad] = useState(1)
  const [son, setSon] = useState(1)
  const [liked, setLiked] = useState<Recipe[]>([])
  const [binned, setBinned] = useState<Recipe[]>([])
  const [pantryExcluded, setPantryExcluded] = useState(PANTRY_DEFAULTS)
  const [queue, setQueue] = useState<Recipe[]>(() =>
    generateRecipes({
      count: 5,
      proteins: ["Chicken", "Beef"],
      veg: ["Broccoli", "Carrots", "Peppers", "Onions"],
      styles: ["Traybake", "Stir-fry", "Pasta"],
      mum: 1,
      dad: 1,
      son: 1,
    })
  )
  const [index, setIndex] = useState(0)

  const currentRecipe = queue[index]
  const progress = queue.length ? Math.min(((index + 1) / queue.length) * 100, 100) : 0

  const shoppingList = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; unit: string; category: string }>()

    liked.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        if (ingredient.category === "Pantry" && pantryExcluded.includes(ingredient.name)) return
        const key = `${ingredient.name}-${ingredient.unit}-${ingredient.category}`
        const existing = map.get(key)
        if (existing) {
          existing.qty += ingredient.qty
        } else {
          map.set(key, { ...ingredient })
        }
      })
    })

    return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  }, [liked, pantryExcluded])

  const groupedShopping = useMemo(() => {
    return shoppingList.reduce<Record<string, typeof shoppingList>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [shoppingList])

  function makeNewBatch() {
    setQueue(
      generateRecipes({
        count: recipeCount,
        proteins: selectedProteins,
        veg: selectedVeg,
        styles: selectedStyles,
        mum,
        dad,
        son,
      })
    )
    setIndex(0)
    setLiked([])
    setBinned([])
  }

  function resetAll() {
    setSelectedProteins(["Chicken", "Beef"])
    setSelectedVeg(["Broccoli", "Carrots", "Peppers", "Onions"])
    setSelectedStyles(["Traybake", "Stir-fry", "Pasta"])
    setRecipeCount(5)
    setMum(1)
    setDad(1)
    setSon(1)
    setPantryExcluded(PANTRY_DEFAULTS)
    setQueue(
      generateRecipes({
        count: 5,
        proteins: ["Chicken", "Beef"],
        veg: ["Broccoli", "Carrots", "Peppers", "Onions"],
        styles: ["Traybake", "Stir-fry", "Pasta"],
        mum: 1,
        dad: 1,
        son: 1,
      })
    )
    setIndex(0)
    setLiked([])
    setBinned([])
  }

  function saveRecipe() {
    if (!currentRecipe) return
    setLiked((prev) => [...prev, currentRecipe])
    setIndex((prev) => prev + 1)
  }

  function binRecipe() {
    if (!currentRecipe) return
    setBinned((prev) => [...prev, currentRecipe])
    setIndex((prev) => prev + 1)
  }

  async function copyShoppingList() {
    const lines = shoppingList.map((item) => `${item.name} - ${roundQty(item.qty)} ${item.unit}`)
    await navigator.clipboard.writeText(lines.join("\n"))
  }

  function downloadCsv() {
    const rows = [
      ["Category", "Ingredient", "Quantity", "Unit"],
      ...shoppingList.map((item) => [item.category, item.name, String(roundQty(item.qty)), item.unit]),
    ]

    const csv = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "zumbie-kitchen-shopping-list.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm ring-1 ring-slate-200">
              <Sparkles className="h-4 w-4" />
              Family meal planner
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Zumbie Kitchen</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Pick proteins, veg and portions, generate a batch of family meals, then tick the ones worth cooking.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:w-[360px]">
            <Card className="rounded-2xl border-0 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Liked</div>
                <div className="mt-1 text-2xl font-semibold">{liked.length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Binned</div>
                <div className="mt-1 text-2xl font-semibold">{binned.length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Queue</div>
                <div className="mt-1 text-2xl font-semibold">{Math.max(queue.length - index, 0)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="rounded-3xl border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ChefHat className="h-5 w-5" />
                Build your batch
              </CardTitle>
              <CardDescription>Choose ingredients and family portions, then generate a fresh set of ideas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label>Number of recipes</Label>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">{recipeCount}</span>
                </div>
                <Input type="range" min={3} max={12} value={recipeCount} onChange={(e) => setRecipeCount(Number(e.target.value))} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Counter label="Mum" value={mum} setValue={setMum} />
                <Counter label="Dad" value={dad} setValue={setDad} />
                <Counter label="Son" value={son} setValue={setSon} />
              </div>

              <div>
                <Label className="mb-3 block">Proteins</Label>
                <div className="flex flex-wrap gap-2">
                  {PROTEINS.map((item) => (
                    <PillToggle key={item} value={item} active={selectedProteins.includes(item)} onClick={() => setSelectedProteins((prev) => toggleItem(prev, item))} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Veg</Label>
                <div className="flex flex-wrap gap-2">
                  {VEG.map((item) => (
                    <PillToggle key={item} value={item} active={selectedVeg.includes(item)} onClick={() => setSelectedVeg((prev) => toggleItem(prev, item))} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Styles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((item) => (
                    <label key={item} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                      <Checkbox checked={selectedStyles.includes(item)} onCheckedChange={() => setSelectedStyles((prev) => toggleItem(prev, item))} />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 rounded-2xl" onClick={makeNewBatch}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate batch
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={resetAll}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Recipe queue</CardTitle>
                    <CardDescription>Review one idea at a time. Tick good ones, bin the rest.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                    {Math.min(index + 1, queue.length)} / {queue.length || 0}
                  </Badge>
                </div>
                <Progress value={progress} className="mt-4" />
              </CardHeader>
              <CardContent>
                {currentRecipe ? (
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl bg-slate-900 p-6 text-white">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/15 text-white hover:bg-white/15">{currentRecipe.protein}</Badge>
                        <Badge className="rounded-full bg-white/15 text-white hover:bg-white/15">{currentRecipe.carb}</Badge>
                        <Badge className="rounded-full bg-white/15 text-white hover:bg-white/15">{currentRecipe.style}</Badge>
                      </div>
                      <h2 className="text-3xl font-semibold leading-tight">{currentRecipe.title}</h2>
                      <p className="mt-3 max-w-xl text-slate-300">{currentRecipe.notes}</p>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-white/10 p-4">
                          <div className="text-sm text-slate-300">Mum</div>
                          <div className="mt-1 text-2xl font-semibold">{currentRecipe.serves.mum}</div>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <div className="text-sm text-slate-300">Dad</div>
                          <div className="mt-1 text-2xl font-semibold">{currentRecipe.serves.dad}</div>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <div className="text-sm text-slate-300">Son</div>
                          <div className="mt-1 text-2xl font-semibold">{currentRecipe.serves.son}</div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button size="lg" className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={saveRecipe}>
                          <Heart className="mr-2 h-4 w-4" />
                          Big green tick
                        </Button>
                        <Button size="lg" variant="secondary" className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100" onClick={binRecipe}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Bin it
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-sm font-medium text-slate-500">Ingredients preview</div>
                      <div className="mt-4 space-y-2">
                        {currentRecipe.ingredients.map((item, idx) => (
                          <div key={`${item.name}-${idx}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
                            <span>{item.name}</span>
                            <span className="font-medium text-slate-600">
                              {roundQty(item.qty)} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                      <ChefHat className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Batch reviewed</h3>
                    <p className="mt-2 text-slate-600">Generate a new batch or head to the shopping list tab to export what you liked.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="liked" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
                <TabsTrigger value="liked" className="rounded-xl">Liked recipes</TabsTrigger>
                <TabsTrigger value="binned" className="rounded-xl">Binned</TabsTrigger>
                <TabsTrigger value="shopping" className="rounded-xl">Shopping list</TabsTrigger>
              </TabsList>

              <TabsContent value="liked" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {liked.length ? (
                    liked.map((recipe) => (
                      <Card key={recipe.id} className="rounded-3xl border-0 bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">{recipe.title}</CardTitle>
                          <CardDescription>{recipe.protein} · {recipe.carb} · {recipe.style}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {recipe.veg.map((item) => (
                              <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="rounded-3xl border-0 bg-white shadow-sm md:col-span-2">
                      <CardContent className="p-10 text-center text-slate-600">No winners yet. Start ticking recipes you like.</CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="binned" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {binned.length ? (
                    binned.map((recipe) => (
                      <Card key={recipe.id} className="rounded-3xl border-0 bg-white shadow-sm opacity-80">
                        <CardHeader>
                          <CardTitle className="text-lg">{recipe.title}</CardTitle>
                          <CardDescription>{recipe.protein} · {recipe.carb} · {recipe.style}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {recipe.veg.map((item) => (
                              <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="rounded-3xl border-0 bg-white shadow-sm md:col-span-2">
                      <CardContent className="p-10 text-center text-slate-600">Nothing binned yet.</CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="shopping" className="mt-4">
                <Card className="rounded-3xl border-0 bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <ShoppingBasket className="h-5 w-5" />
                          Shopping list
                        </CardTitle>
                        <CardDescription>Built only from recipes you have liked.</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="rounded-2xl" onClick={copyShoppingList} disabled={!shoppingList.length}>
                          Copy list
                        </Button>
                        <Button className="rounded-2xl" onClick={downloadCsv} disabled={!shoppingList.length}>
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Already in the cupboard</Label>
                      <div className="flex flex-wrap gap-2">
                        {PANTRY_DEFAULTS.map((item) => (
                          <PillToggle
                            key={item}
                            value={item}
                            active={pantryExcluded.includes(item)}
                            onClick={() => setPantryExcluded((prev) => toggleItem(prev, item))}
                          />
                        ))}
                      </div>
                    </div>

                    {shoppingList.length ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(groupedShopping).map(([category, items]) => (
                          <div key={category} className="rounded-3xl bg-slate-50 p-4">
                            <h3 className="mb-3 font-semibold">{category}</h3>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <div key={`${item.name}-${item.unit}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
                                  <span>{item.name}</span>
                                  <span className="font-medium text-slate-600">{roundQty(item.qty)} {item.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
                        Like a few recipes and your combined shopping list will appear here.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
