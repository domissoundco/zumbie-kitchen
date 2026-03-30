"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Heart, X, ShoppingBasket, BookOpen, Dice3, RotateCcw } from "lucide-react"

type GeneratedRecipe = {
  id: string
  title: string
  summary: string
  style: string
  prepTime: number
  cookTime: number
  ingredients: { name: string; amount: string; haveIt: boolean }[]
  steps: string[]
  littleOneTips: string[]
}

const MOCK_RECIPES: GeneratedRecipe[] = [
  {
    id: "1",
    title: "Creamy Chicken, Leek & Mushroom Pasta",
    summary: "Comforting midweek pasta with soft leeks, mushrooms and a mild creamy sauce.",
    style: "Pasta",
    prepTime: 10,
    cookTime: 20,
    ingredients: [
      { name: "Chicken breast", amount: "500g", haveIt: true },
      { name: "Leeks", amount: "2", haveIt: true },
      { name: "Mushrooms", amount: "250g", haveIt: true },
      { name: "Pasta", amount: "400g", haveIt: true },
      { name: "Single cream", amount: "200ml", haveIt: false },
      { name: "Parmesan", amount: "50g", haveIt: false },
      { name: "Thyme", amount: "1 tsp", haveIt: true },
    ],
    steps: [
      "Cook the pasta in salted water until tender.",
      "Slice the chicken, leeks and mushrooms.",
      "Cook the chicken in a pan until lightly golden.",
      "Add leeks and mushrooms and cook until soft.",
      "Add cream and thyme, then stir through the pasta.",
      "Serve with parmesan on top.",
    ],
    littleOneTips: [
      "Slice the leeks very finely.",
      "Keep the seasoning gentle.",
      "Cool slightly before serving.",
    ],
  },
  {
    id: "2",
    title: "Paprika Beef & Sweet Potato Traybake",
    summary: "One-tray family dinner with smoky paprika flavour and soft roasted veg.",
    style: "Traybake",
    prepTime: 15,
    cookTime: 35,
    ingredients: [
      { name: "Beef strips", amount: "450g", haveIt: true },
      { name: "Sweet potatoes", amount: "2 large", haveIt: false },
      { name: "Peppers", amount: "2", haveIt: true },
      { name: "Red onion", amount: "1", haveIt: false },
      { name: "Smoked paprika", amount: "2 tsp", haveIt: true },
      { name: "Olive oil", amount: "2 tbsp", haveIt: true },
    ],
    steps: [
      "Heat the oven to 200°C.",
      "Chop the sweet potatoes and peppers into even chunks.",
      "Toss everything with olive oil and paprika.",
      "Roast for 30 to 35 minutes, turning once.",
      "Serve once the beef is cooked and the veg is soft.",
    ],
    littleOneTips: [
      "Roast the little one’s veg extra soft.",
      "Use less paprika in their portion if needed.",
      "Cut beef into bite-size pieces.",
    ],
  },
  {
    id: "3",
    title: "Mild Coconut Lentil Curry",
    summary: "Cheap, filling and freezer-friendly with gentle spice and soft veg.",
    style: "Curry",
    prepTime: 10,
    cookTime: 25,
    ingredients: [
      { name: "Red lentils", amount: "250g", haveIt: true },
      { name: "Onion", amount: "1", haveIt: true },
      { name: "Carrots", amount: "2", haveIt: true },
      { name: "Coconut milk", amount: "1 tin", haveIt: false },
      { name: "Curry powder", amount: "1 tsp", haveIt: true },
      { name: "Rice", amount: "300g", haveIt: true },
    ],
    steps: [
      "Cook onion and carrot until soft.",
      "Add lentils and curry powder.",
      "Pour in coconut milk and water.",
      "Simmer until the lentils are soft.",
      "Serve with rice.",
    ],
    littleOneTips: [
      "Keep the curry powder light.",
      "Mash the curry slightly for a softer texture.",
      "Serve with plain yoghurt if helpful.",
    ],
  },
  {
    id: "4",
    title: "Cheesy Broccoli & Ham Pasta Bake",
    summary: "Family crowd-pleaser that uses up bits from the fridge.",
    style: "Pasta Bake",
    prepTime: 15,
    cookTime: 25,
    ingredients: [
      { name: "Pasta", amount: "400g", haveIt: true },
      { name: "Broccoli", amount: "1 head", haveIt: true },
      { name: "Cooked ham", amount: "200g", haveIt: false },
      { name: "Cheddar", amount: "150g", haveIt: true },
      { name: "Milk", amount: "250ml", haveIt: true },
      { name: "Butter", amount: "25g", haveIt: true },
    ],
    steps: [
      "Cook pasta and broccoli until just tender.",
      "Make a quick cheese sauce with butter, milk and cheddar.",
      "Mix everything with the ham.",
      "Bake until bubbling and golden.",
    ],
    littleOneTips: [
      "Cut broccoli florets small.",
      "Keep the top lightly baked, not too crisp.",
      "Let it cool before serving.",
    ],
  },
  {
    id: "5",
    title: "Garlic Butter Salmon Rice Bowls",
    summary: "Fresh and quick with soft rice, greens and buttery salmon.",
    style: "Bowl",
    prepTime: 10,
    cookTime: 18,
    ingredients: [
      { name: "Salmon fillets", amount: "4", haveIt: false },
      { name: "Rice", amount: "300g", haveIt: true },
      { name: "Spinach", amount: "100g", haveIt: true },
      { name: "Butter", amount: "20g", haveIt: true },
      { name: "Garlic", amount: "2 cloves", haveIt: true },
      { name: "Lemon", amount: "1", haveIt: false },
    ],
    steps: [
      "Cook the rice.",
      "Pan-fry the salmon in butter and garlic.",
      "Wilt the spinach.",
      "Serve in bowls with lemon over the top.",
    ],
    littleOneTips: [
      "Flake the salmon carefully and check for bones.",
      "Serve plain rice on the side if needed.",
      "Skip lemon on the little one’s portion if preferred.",
    ],
  },
]

export default function Page() {
  const [suggestCount, setSuggestCount] = useState(5)
  const [iFancy, setIFancy] = useState("")
  const [weHave, setWeHave] = useState("")
  const [generated, setGenerated] = useState<GeneratedRecipe[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [chosen, setChosen] = useState<GeneratedRecipe[]>([])
  const [storedRecipes, setStoredRecipes] = useState<GeneratedRecipe[]>([MOCK_RECIPES[0], MOCK_RECIPES[2]])
  const [activeRecipe, setActiveRecipe] = useState<GeneratedRecipe | null>(null)

  const current = generated[reviewIndex]

  function suggestMeals() {
    const next = MOCK_RECIPES.slice(0, suggestCount).map((recipe, idx) => ({
      ...recipe,
      id: `${recipe.id}-${Date.now()}-${idx}`,
      summary:
        iFancy || weHave
          ? `${recipe.summary} Built around: ${iFancy || "what you already have"}${weHave ? ` · using ${weHave}` : ""}.`
          : recipe.summary,
    }))
    setGenerated(next)
    setReviewIndex(0)
    setChosen([])
    setActiveRecipe(null)
  }

  function clearWeek() {
    setGenerated([])
    setReviewIndex(0)
    setChosen([])
    setActiveRecipe(null)
  }

  function chooseYes() {
    if (!current) return
    setChosen((prev) => [...prev, current])
    setReviewIndex((prev) => prev + 1)
  }

  function chooseNo() {
    setReviewIndex((prev) => prev + 1)
  }

  function randomDinner() {
    if (!chosen.length) return
    const pick = chosen[Math.floor(Math.random() * chosen.length)]
    setActiveRecipe(pick)
  }

  function addStoredRecipe(recipe: GeneratedRecipe) {
    setStoredRecipes((prev) => (prev.some((item) => item.title === recipe.title) ? prev : [...prev, recipe]))
  }

  const shoppingList = useMemo(() => {
    const needed = new Map<string, string>()
    chosen.forEach((recipe) => {
      recipe.ingredients.filter((item) => !item.haveIt).forEach((item) => {
        needed.set(item.name, item.amount)
      })
    })
    return Array.from(needed.entries()).map(([name, amount]) => ({ name, amount }))
  }, [chosen])

  return (
    <main className="min-h-screen bg-emerald-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-black shadow-lg">
              <img src="/zumbie-kitchen-logo.png" alt="Zumbie Kitchen logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-600">
                Start the week
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Zumbie Kitchen</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Suggest meals, yes/no the ones you want, build your week, then open a recipe card or produce the shopping list.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="rounded-2xl bg-cream-100 text-slate-900 hover:bg-emerald-50/90" onClick={randomDinner} disabled={!chosen.length}>
              <Dice3 className="mr-2 h-4 w-4" /> Pick tonight at random
            </Button>
            <Button variant="outline" className="rounded-2xl border-emerald-300 bg-transparent text-white hover:bg-emerald-50/10" onClick={clearWeek}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear week
            </Button>
          </div>
        </div>

        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-emerald-50 p-1 shadow-sm">
            <TabsTrigger value="planner" className="rounded-xl text-slate-700 data-[state=active]:bg-emerald-200 data-[state=active]:text-white">Planner</TabsTrigger>
            <TabsTrigger value="week" className="rounded-xl text-slate-700 data-[state=active]:bg-emerald-200 data-[state=active]:text-white">Chosen meals</TabsTrigger>
            <TabsTrigger value="shopping" className="rounded-xl text-slate-700 data-[state=active]:bg-emerald-200 data-[state=active]:text-white">Shopping list</TabsTrigger>
            <TabsTrigger value="stored" className="rounded-xl text-slate-700 data-[state=active]:bg-emerald-200 data-[state=active]:text-white">Stored recipes</TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="mt-6">
            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
                <CardHeader>
                  <CardTitle>Plan the week</CardTitle>
                  <CardDescription className="text-slate-500">Choose how many ideas you want, add what you fancy, or tell it what you already have in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-slate-600">How many recipes to suggest?</label>
                    <Input type="number" min={1} max={10} value={suggestCount} onChange={(e) => setSuggestCount(Number(e.target.value) || 1)} className="border-emerald-200 bg-emerald-100 text-slate-900" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">I fancy this...</label>
                    <Input value={iFancy} onChange={(e) => setIFancy(e.target.value)} placeholder="Something creamy, curry, pasta bake, comfort food..." className="border-emerald-200 bg-emerald-100 text-slate-900 placeholder:text-white/35" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">We have this in...</label>
                    <Input value={weHave} onChange={(e) => setWeHave(e.target.value)} placeholder="Chicken, leeks, mushrooms, rice, thyme..." className="border-emerald-200 bg-emerald-100 text-slate-900 placeholder:text-white/35" />
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 rounded-2xl bg-emerald-300 text-slate-950 hover:bg-amber-200" onClick={suggestMeals}>
                      <Sparkles className="mr-2 h-4 w-4" /> Suggest meals
                    </Button>
                    <Button variant="outline" className="rounded-2xl border-emerald-300 bg-transparent text-white hover:bg-emerald-50/10" onClick={clearWeek}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
                <CardHeader>
                  <CardTitle>Review suggestions</CardTitle>
                  <CardDescription className="text-slate-500">Say yes or no. When you confirm the week, they move into tiles.</CardDescription>
                </CardHeader>
                <CardContent>
                  {current ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <Badge className="rounded-full bg-emerald-50/10 text-white">{reviewIndex + 1} / {generated.length}</Badge>
                        <Badge className="rounded-full bg-emerald-50/10 text-white">{current.style}</Badge>
                      </div>

                      <div className="rounded-3xl bg-emerald-200 p-6">
                        <h2 className="text-3xl font-semibold">{current.title}</h2>
                        <p className="mt-3 text-slate-600">{current.summary}</p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {current.ingredients.slice(0, 6).map((item) => (
                            <Badge key={item.name} className="rounded-full bg-emerald-50/10 text-white">
                              {item.name}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
                          <div className="rounded-2xl bg-emerald-50/5 p-3">Prep {current.prepTime}m</div>
                          <div className="rounded-2xl bg-emerald-50/5 p-3">Cook {current.cookTime}m</div>
                          <div className="rounded-2xl bg-emerald-50/5 p-3">Spices included</div>
                          <div className="rounded-2xl bg-emerald-50/5 p-3">Little one friendly</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="rounded-2xl bg-emerald-400 text-white hover:bg-emerald-400" onClick={chooseYes}>
                          <Heart className="mr-2 h-4 w-4" /> Yes
                        </Button>
                        <Button variant="secondary" className="rounded-2xl bg-cream-100 text-slate-900 hover:bg-emerald-50/90" onClick={chooseNo}>
                          <X className="mr-2 h-4 w-4" /> No
                        </Button>
                        <Button variant="outline" className="rounded-2xl border-emerald-300 bg-transparent text-white hover:bg-emerald-50/10" onClick={() => setActiveRecipe(current)}>
                          <BookOpen className="mr-2 h-4 w-4" /> Open recipe
                        </Button>
                        <Button variant="outline" className="rounded-2xl border-emerald-300 bg-transparent text-white hover:bg-emerald-50/10" onClick={() => addStoredRecipe(current)}>
                          Save to stored recipes
                        </Button>
                      </div>
                    </div>
                  ) : generated.length ? (
                    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-200 p-10 text-center text-slate-600">
                      You have reviewed this batch. Head to <span className="font-medium text-white">Chosen meals</span> to confirm the week.
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-200 p-10 text-center text-slate-600">
                      Hit <span className="font-medium text-white">Suggest meals</span> to start your week.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {chosen.length ? chosen.map((recipe) => (
                <Card key={recipe.id} className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{recipe.title}</CardTitle>
                        <CardDescription className="text-slate-500">{recipe.summary}</CardDescription>
                      </div>
                      <Badge className="rounded-full bg-emerald-50/10 text-white">{recipe.style}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.slice(0, 4).map((item) => (
                        <Badge key={item.name} className="rounded-full bg-emerald-50/10 text-white">{item.name}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 rounded-2xl bg-cream-100 text-slate-900 hover:bg-emerald-50/90" onClick={() => setActiveRecipe(recipe)}>
                        Open recipe card
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900 md:col-span-2 xl:col-span-3">
                  <CardContent className="p-10 text-center text-slate-600">No chosen meals yet. Review suggestions and hit yes on the ones you want for the week.</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shopping" className="mt-6">
            <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-5 w-5" /> Shopping list</CardTitle>
                <CardDescription className="text-slate-500">Everything needed for the meals you have chosen this week.</CardDescription>
              </CardHeader>
              <CardContent>
                {shoppingList.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {shoppingList.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl bg-emerald-200 px-4 py-3 text-sm">
                        <span>{item.name}</span>
                        <Badge className="rounded-full bg-emerald-50/10 text-white">{item.amount}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-200 p-10 text-center text-slate-600">
                    Choose some meals first and your shopping list will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stored" className="mt-6">
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
              Stored recipes are your keepers. Open them anytime or delete the ones you do not want to keep.
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {storedRecipes.map((recipe) => (
                <Card key={recipe.title} className="rounded-3xl border-slate-200 bg-emerald-50 text-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle>{recipe.title}</CardTitle>
                    <CardDescription className="text-slate-600">Saved favourite to reuse in future weeks.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.slice(0, 4).map((item) => (
                        <Badge key={item.name} className="rounded-full bg-slate-100 text-slate-800">{item.name}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 rounded-2xl bg-emerald-200 text-white hover:bg-slate-800" onClick={() => setActiveRecipe(recipe)}>
                        Open recipe
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => setStoredRecipes((prev) => prev.filter((item) => item.title !== recipe.title))}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {activeRecipe ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl border border-emerald-200 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <Badge className="rounded-full bg-emerald-50/10 text-white">{activeRecipe.style}</Badge>
                  <h2 className="mt-3 text-3xl font-semibold">{activeRecipe.title}</h2>
                  <p className="mt-2 text-slate-600">{activeRecipe.summary}</p>
                </div>
                <Button variant="outline" className="rounded-2xl border-emerald-300 bg-transparent text-white hover:bg-emerald-50/10" onClick={() => setActiveRecipe(null)}>
                  Close
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
                  <CardHeader>
                    <CardTitle>Recipe card</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeRecipe.ingredients.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl bg-emerald-200 px-4 py-3 text-sm">
                        <div>
                          <div>{item.name}</div>
                          <div className="mt-1 text-xs text-white/45">{item.haveIt ? "In already" : "Need to buy"}</div>
                        </div>
                        <Badge className="rounded-full bg-emerald-50/10 text-white">{item.amount}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="rounded-3xl border-emerald-200 bg-emerald-100 text-slate-900">
                    <CardHeader>
                      <CardTitle>Cooking instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeRecipe.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 rounded-2xl bg-emerald-200 px-4 py-3 text-sm">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-xs font-semibold text-slate-950">{idx + 1}</div>
                          <div className="pt-1">{step}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-amber-300/20 bg-emerald-300/10 text-white">
                    <CardHeader>
                      <CardTitle>Little one tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activeRecipe.littleOneTips.map((tip, idx) => (
                        <div key={idx} className="rounded-2xl bg-emerald-200 px-4 py-3 text-sm text-white/85">
                          {tip}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
