"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Playfair_Display, Inter } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sparkles,
  Heart,
  X,
  ShoppingBasket,
  BookOpen,
  Printer,
  RotateCcw,
  Star,
  ChefHat,
  WandSparkles,
} from "lucide-react"

const displayFont = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] })
const bodyFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] })

type ApiIngredient = {
  name: string
  amount: number | string
  unit: string
}

type ApiRecipe = {
  title: string
  summary: string
  style: string
  prep_time_minutes: number
  cook_time_minutes: number
  ingredients_used: ApiIngredient[]
  missing_ingredients: ApiIngredient[]
  steps: string[]
  little_one_tips: string[]
}

type Recipe = {
  id: string
  title: string
  summary: string
  style: string
  prepTime: number
  cookTime: number
  ingredientsUsed: { name: string; amount: string }[]
  missingIngredients: { name: string; amount: string }[]
  steps: string[]
  littleOneTips: string[]
}

function formatAmount(amount: number | string, unit: string) {
  return `${amount} ${unit}`.trim()
}

function mapRecipe(recipe: ApiRecipe, index: number): Recipe {
  return {
    id: `${Date.now()}-${index}-${recipe.title}`,
    title: recipe.title,
    summary: recipe.summary,
    style: recipe.style,
    prepTime: recipe.prep_time_minutes,
    cookTime: recipe.cook_time_minutes,
    ingredientsUsed: (recipe.ingredients_used || []).map((item) => ({
      name: item.name,
      amount: formatAmount(item.amount, item.unit),
    })),
    missingIngredients: (recipe.missing_ingredients || []).map((item) => ({
      name: item.name,
      amount: formatAmount(item.amount, item.unit),
    })),
    steps: recipe.steps || [],
    littleOneTips: recipe.little_one_tips || [],
  }
}

export default function Page() {
  const [mealCount, setMealCount] = useState(5)
  const [adults, setAdults] = useState(2)
  const [childrenUnder2, setChildrenUnder2] = useState(1)
  const [iFancy, setIFancy] = useState("")
  const [weHave, setWeHave] = useState("")
  const [suggested, setSuggested] = useState<Recipe[]>([])
  const [suggestedIndex, setSuggestedIndex] = useState(0)
  const [weekRecipes, setWeekRecipes] = useState<Recipe[]>([])
  const [lovedRecipes, setLovedRecipes] = useState<Recipe[]>([])
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiError, setApiError] = useState("")

  const currentRecipe = suggested[suggestedIndex]

  async function generateRecipes() {
    try {
      setIsGenerating(true)
      setApiError("")
      setSuggested([])
      setSuggestedIndex(0)
      setActiveRecipe(null)

      const inventory = weHave
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: mealCount,
          i_fancy: iFancy.trim(),
          inventory,
          family: { adults, children_under_2: childrenUnder2 },
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || "Could not generate recipes right now.")
      }

      const next = (data.recipes || []).map((recipe: ApiRecipe, idx: number) => mapRecipe(recipe, idx))
      if (!next.length) {
        throw new Error("No recipes came back. Try using fewer fields or just one idea in the boxes.")
      }
      setSuggested(next)
      setSuggestedIndex(0)
    } catch (error: any) {
      setApiError(error?.message || "Could not generate recipes right now.")
    } finally {
      setIsGenerating(false)
    }
  }

  function tryRecipe() {
    if (!currentRecipe) return
    setWeekRecipes((prev) => (prev.some((item) => item.title === currentRecipe.title) ? prev : [...prev, currentRecipe]))
    setSuggestedIndex((prev) => prev + 1)
  }

  function binRecipe() {
    if (!currentRecipe) return
    setSuggestedIndex((prev) => prev + 1)
  }

  function loveRecipe(recipe: Recipe) {
    setLovedRecipes((prev) => (prev.some((item) => item.title === recipe.title) ? prev : [...prev, recipe]))
  }

  function clearWorkflow() {
    setSuggested([])
    setSuggestedIndex(0)
    setWeekRecipes([])
    setActiveRecipe(null)
    setApiError("")
  }

  const shoppingList = useMemo(() => {
    const items = new Map<string, string>()
    weekRecipes.forEach((recipe) => {
      recipe.missingIngredients.forEach((item) => {
        items.set(item.name, item.amount)
      })
    })
    return Array.from(items.entries()).map(([name, amount]) => ({ name, amount }))
  }, [weekRecipes])

  return (
    <main className={`${bodyFont.className} min-h-screen bg-[#f6f2e9] text-[#2f382d]`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8 flex items-center gap-4 rounded-[2rem] border border-[#ddd8cb] bg-[#fbf8f1] px-5 py-5 shadow-[0_20px_60px_rgba(102,114,96,0.08)] md:px-8">
          <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] bg-[#f1ece0] ring-1 ring-[#ddd8cb] md:h-24 md:w-24">
            <Image src="/zumbie-kitchen-logo.png" alt="Zumbie Kitchen" fill className="object-contain p-2" />
          </div>
          <div className="min-w-0">
            <h1 className={`${displayFont.className} text-4xl text-[#314230] md:text-6xl`}>
              Zumbie Kitchen
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[#677061] md:text-lg">
              Curate the week. Suggest full recipes with quantities, cooking instructions and flavour built in.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] shadow-[0_20px_60px_rgba(102,114,96,0.08)]">
              <CardHeader>
                <CardTitle className={`${displayFont.className} text-3xl text-[#314230]`}>Workflow</CardTitle>
                <CardDescription className="text-[#6b7267]">
                  Pick one route: choose how many meals to build, or tell it what you fancy, or tell it what you already have in. You do not need to fill in every box.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#5f675c]">Number of meals</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={mealCount}
                    onChange={(e) => setMealCount(Number(e.target.value) || 1)}
                    className="h-14 rounded-2xl border-[#ddd8cb] bg-white text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#5f675c]">Adults</label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value) || 1)}
                      className="h-14 rounded-2xl border-[#ddd8cb] bg-white text-lg"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#5f675c]">Children (under 2)</label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={childrenUnder2}
                      onChange={(e) => setChildrenUnder2(Number(e.target.value) || 0)}
                      className="h-14 rounded-2xl border-[#ddd8cb] bg-white text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#5f675c]">I fancy this...</label>
                  <Input
                    value={iFancy}
                    onChange={(e) => setIFancy(e.target.value)}
                    placeholder="Optional: creamy, cosy curry, traybake, something fresh..."
                    className="h-14 rounded-2xl border-[#ddd8cb] bg-white text-base placeholder:text-[#a0a698]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#5f675c]">I have this in...</label>
                  <Input
                    value={weHave}
                    onChange={(e) => setWeHave(e.target.value)}
                    placeholder="Optional: peppers, paneer, greek wraps, yoghurt, garlic..."
                    className="h-14 rounded-2xl border-[#ddd8cb] bg-white text-base placeholder:text-[#a0a698]"
                  />
                </div>

                <div className="grid gap-3">
                  <Button
                    onClick={generateRecipes}
                    disabled={isGenerating}
                    className="h-14 rounded-2xl bg-[#7b8f70] text-white hover:bg-[#6f8265]"
                  >
                    <WandSparkles className="mr-2 h-5 w-5" />
                    {isGenerating ? "Curating your week..." : "Suggest full recipes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearWorkflow}
                    className="h-14 rounded-2xl border-[#d8cfbe] bg-[#fffdf8] text-[#556052] hover:bg-[#f3eee2]"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" /> Clear
                  </Button>
                </div>

                {apiError ? (
                  <div className="rounded-2xl border border-[#e6c8bb] bg-[#fff7f2] px-4 py-3 text-sm text-[#8e5b4d]">
                    {apiError}
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] bg-[#f1efe7] px-4 py-4 text-sm leading-7 text-[#6b7267]">
                  <div className="font-medium text-[#556052]">Workflow</div>
                  <div className="mt-2">1. Choose a number of meals.</div>
                  <div>2. Optionally add what you fancy.</div>
                  <div>3. Optionally add what you have in.</div>
                  <div>4. Hit <span className="font-medium">Suggest full recipes</span>.</div>
                  <div>5. Try or Bin each idea.</div>
                  <div>6. Your chosen recipes build the week and shopping list automatically.</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] shadow-[0_20px_60px_rgba(102,114,96,0.08)]">
              <CardHeader>
                <CardTitle className={`${displayFont.className} flex items-center gap-2 text-3xl text-[#314230]`}>
                  <ShoppingBasket className="h-6 w-6" /> Shopping list
                </CardTitle>
                <CardDescription className="text-[#6b7267]">
                  Built automatically from everything you chose for the week.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shoppingList.length ? (
                  <div className="space-y-3">
                    {shoppingList.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl border border-[#e5dfd3] bg-white px-4 py-3 shadow-sm">
                        <span>{item.name}</span>
                        <Badge className="bg-[#ede7d8] text-[#596456] hover:bg-[#ede7d8]">{item.amount}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[#ddd8cb] bg-[#f8f4ea] px-4 py-8 text-center text-sm text-[#7b8378]">
                    Pick some recipes for the week and your shopping list will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] shadow-[0_20px_60px_rgba(102,114,96,0.08)]">
              <CardHeader>
                <CardTitle className={`${displayFont.className} text-3xl text-[#314230]`}>Suggested recipes</CardTitle>
                <CardDescription className="text-[#6b7267]">
                  Premium, full recipes with quantities, flavour, cooking instructions and family-friendly details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentRecipe ? (
                  <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-[2rem] border border-[#ddd8cb] bg-gradient-to-b from-[#f0ebdf] to-[#f8f5ee] p-7 shadow-[0_24px_60px_rgba(92,103,88,0.10)]">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Badge className="bg-white text-[#576351] hover:bg-white">{currentRecipe.style}</Badge>
                        <Badge className="bg-[#e7eedf] text-[#576351] hover:bg-[#e7eedf]">Prep {currentRecipe.prepTime}m</Badge>
                        <Badge className="bg-[#f3e3c8] text-[#735d35] hover:bg-[#f3e3c8]">Cook {currentRecipe.cookTime}m</Badge>
                      </div>

                      <h2 className={`${displayFont.className} text-4xl leading-tight text-[#314230] md:text-5xl`}>
                        {currentRecipe.title}
                      </h2>
                      <p className="mt-4 text-lg leading-8 text-[#61685d]">{currentRecipe.summary}</p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {currentRecipe.ingredientsUsed.slice(0, 6).map((item) => (
                          <Badge key={item.name} className="bg-white text-[#576351] shadow-sm hover:bg-white">
                            {item.name}
                          </Badge>
                        ))}
                        {currentRecipe.missingIngredients.slice(0, 3).map((item) => (
                          <Badge key={item.name} className="bg-[#f9efe8] text-[#8b5c4b] hover:bg-[#f9efe8]">
                            Need {item.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <Button onClick={tryRecipe} className="h-14 rounded-2xl bg-[#7b8f70] px-6 text-white hover:bg-[#6f8265]">
                          <Heart className="mr-2 h-5 w-5" /> Try
                        </Button>
                        <Button onClick={binRecipe} variant="secondary" className="h-14 rounded-2xl bg-white px-6 text-[#344133] hover:bg-[#f4efe5]">
                          <X className="mr-2 h-5 w-5" /> Bin
                        </Button>
                        <Button onClick={() => setActiveRecipe(currentRecipe)} variant="outline" className="h-14 rounded-2xl border-[#d8cfbe] bg-[#fffdf8] px-6 text-[#556052] hover:bg-[#f3eee2]">
                          <BookOpen className="mr-2 h-5 w-5" /> Open recipe card
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-[#e5dfd3] bg-white p-5 shadow-sm">
                      <div className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-[#879181]">What is included</div>
                      <ScrollArea className="h-[380px] pr-3">
                        <div className="space-y-3">
                          {currentRecipe.ingredientsUsed.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[#fbfaf6] px-4 py-3 text-sm">
                              <span>{item.name}</span>
                              <span className="text-[#677061]">{item.amount}</span>
                            </div>
                          ))}
                          {currentRecipe.missingIngredients.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[#fff7f2] px-4 py-3 text-sm">
                              <span>{item.name}</span>
                              <span className="text-[#8b5c4b]">{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-[#ddd8cb] bg-[#f8f4ea] px-6 py-16 text-center">
                    <ChefHat className="mx-auto h-8 w-8 text-[#90a083]" />
                    <p className="mt-4 text-lg text-[#6b7267]">Generate a set of recipes and they will appear here ready to Try or Bin.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="week" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-[1.5rem] border border-[#ddd8cb] bg-[#fbf8f1] p-1 shadow-sm">
                <TabsTrigger value="week" className="rounded-[1rem] text-base text-slate-700 data-[state=active]:bg-[#7b8f70] data-[state=active]:text-white">
                  Recipes for week
                </TabsTrigger>
                <TabsTrigger value="loved" className="rounded-[1rem] text-base text-slate-700 data-[state=active]:bg-[#c99d59] data-[state=active]:text-white">
                  Loved recipes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="week" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {weekRecipes.length ? (
                    weekRecipes.map((recipe) => (
                      <Card key={recipe.id} className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] shadow-[0_18px_50px_rgba(102,114,96,0.08)]">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className={`${displayFont.className} text-2xl text-[#314230]`}>{recipe.title}</CardTitle>
                              <CardDescription className="mt-2 text-[#6b7267]">{recipe.summary}</CardDescription>
                            </div>
                            <Badge className="bg-[#ede7d8] text-[#596456] hover:bg-[#ede7d8]">{recipe.style}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredientsUsed.slice(0, 4).map((item) => (
                              <Badge key={item.name} className="bg-white text-[#576351] shadow-sm hover:bg-white">{item.name}</Badge>
                            ))}
                          </div>
                          <div className="grid gap-2">
                            <Button onClick={() => setActiveRecipe(recipe)} className="h-12 rounded-2xl bg-[#7b8f70] text-white hover:bg-[#6f8265]">
                              Open recipe card
                            </Button>
                            <Button onClick={() => loveRecipe(recipe)} variant="outline" className="h-12 rounded-2xl border-[#d8cfbe] bg-[#fffdf8] text-[#556052] hover:bg-[#f3eee2]">
                              <Star className="mr-2 h-4 w-4" /> Loved it
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] md:col-span-2 xl:col-span-3">
                      <CardContent className="px-6 py-12 text-center text-[#6b7267]">
                        Your chosen recipes for the week will land here after you hit Try.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="loved" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {lovedRecipes.length ? (
                    lovedRecipes.map((recipe) => (
                      <Card key={recipe.title} className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] shadow-[0_18px_50px_rgba(102,114,96,0.08)]">
                        <CardHeader>
                          <CardTitle className={`${displayFont.className} text-2xl text-[#314230]`}>{recipe.title}</CardTitle>
                          <CardDescription className="text-[#6b7267]">Saved because it worked beautifully.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredientsUsed.slice(0, 4).map((item) => (
                              <Badge key={item.name} className="bg-white text-[#576351] shadow-sm hover:bg-white">{item.name}</Badge>
                            ))}
                          </div>
                          <Button onClick={() => setActiveRecipe(recipe)} className="h-12 w-full rounded-2xl bg-[#c99d59] text-white hover:bg-[#b48a4c]">
                            Open loved recipe
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="rounded-[2rem] border-[#ddd8cb] bg-[#fbf8f1] md:col-span-2 xl:col-span-3">
                      <CardContent className="px-6 py-12 text-center text-[#6b7267]">
                        Mark recipes as loved and they will build your favourites collection here.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        {activeRecipe ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] border border-[#ddd8cb] bg-[#fbf8f1] p-6 shadow-[0_30px_90px_rgba(70,78,66,0.18)] md:p-8">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="bg-[#ede7d8] text-[#596456] hover:bg-[#ede7d8]">{activeRecipe.style}</Badge>
                  <h2 className={`${displayFont.className} mt-3 text-4xl text-[#314230] md:text-5xl`}>{activeRecipe.title}</h2>
                  <p className="mt-3 max-w-2xl text-lg leading-8 text-[#6b7267]">{activeRecipe.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      if (!activeRecipe) return
                      const printWindow = window.open("", "_blank", "width=900,height=1200")
                      if (!printWindow) return
                      const ingredients = [
                        ...activeRecipe.ingredientsUsed.map((item) => `<li>${item.name} — ${item.amount}</li>`),
                        ...activeRecipe.missingIngredients.map((item) => `<li>${item.name} — ${item.amount} <em>(need to buy)</em></li>`),
                      ].join("")
                      const steps = activeRecipe.steps.map((step, idx) => `<li>${step}</li>`).join("")
                      const tips = activeRecipe.littleOneTips.map((tip) => `<li>${tip}</li>`).join("")
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>${activeRecipe.title}</title>
                            <style>
                              body { font-family: Georgia, serif; color: #2f382d; padding: 40px; line-height: 1.6; }
                              h1, h2 { color: #314230; }
                              .meta { margin: 12px 0 24px; color: #6b7267; }
                              .card { border: 1px solid #ddd8cb; border-radius: 18px; padding: 24px; margin-bottom: 24px; background: #fbf8f1; }
                              ul, ol { padding-left: 22px; }
                            </style>
                          </head>
                          <body>
                            <h1>${activeRecipe.title}</h1>
                            <div class="meta">${activeRecipe.style} • Prep ${activeRecipe.prepTime}m • Cook ${activeRecipe.cookTime}m</div>
                            <p>${activeRecipe.summary}</p>
                            <div class="card">
                              <h2>Ingredients</h2>
                              <ul>${ingredients}</ul>
                            </div>
                            <div class="card">
                              <h2>Cooking instructions</h2>
                              <ol>${steps}</ol>
                            </div>
                            <div class="card">
                              <h2>Little one tips</h2>
                              <ul>${tips}</ul>
                            </div>
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.focus()
                      printWindow.print()
                    }}
                    variant="outline"
                    className="h-12 rounded-2xl border-[#d8cfbe] bg-[#fffdf8] text-[#556052] hover:bg-[#f3eee2]"
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                  <Button onClick={() => loveRecipe(activeRecipe)} className="h-12 rounded-2xl bg-[#c99d59] text-white hover:bg-[#b48a4c]">
                    <Star className="mr-2 h-4 w-4" /> Loved it
                  </Button>
                  <Button onClick={() => setActiveRecipe(null)} variant="outline" className="h-12 rounded-2xl border-[#d8cfbe] bg-[#fffdf8] text-[#556052] hover:bg-[#f3eee2]">
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="rounded-[2rem] border-[#e5dfd3] bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className={`${displayFont.className} text-3xl text-[#314230]`}>Recipe card</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeRecipe.ingredientsUsed.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl border border-[#ece6da] bg-[#fbfaf6] px-4 py-3">
                        <span>{item.name}</span>
                        <Badge className="bg-[#e8ede3] text-[#586456] hover:bg-[#e8ede3]">{item.amount}</Badge>
                      </div>
                    ))}
                    {activeRecipe.missingIngredients.length ? (
                      <div className="pt-2">
                        <div className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#8b5c4b]">Need to buy</div>
                        <div className="space-y-3">
                          {activeRecipe.missingIngredients.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-2xl border border-[#f0ddd4] bg-[#fff7f2] px-4 py-3">
                              <span>{item.name}</span>
                              <Badge className="bg-[#f9e5db] text-[#8b5c4b] hover:bg-[#f9e5db]">{item.amount}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="rounded-[2rem] border-[#e5dfd3] bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className={`${displayFont.className} text-3xl text-[#314230]`}>Cooking instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeRecipe.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 rounded-2xl border border-[#ece6da] bg-[#fbfaf6] px-4 py-4 text-base leading-7">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b8f70] text-sm font-semibold text-white">
                            {idx + 1}
                          </div>
                          <div>{step}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] border-[#ead9bd] bg-[#fcf4e7] shadow-sm">
                    <CardHeader>
                      <CardTitle className={`${displayFont.className} text-3xl text-[#8a6a38]`}>Little one tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeRecipe.littleOneTips.map((tip, idx) => (
                        <div key={idx} className="rounded-2xl border border-[#f0e3cb] bg-white px-4 py-4 text-base leading-7 text-[#6a624e]">
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
