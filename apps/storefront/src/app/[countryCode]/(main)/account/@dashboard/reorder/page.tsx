"use client"

import { useState } from "react"
import { usePantry } from "@lib/context/pantry-context"
import { addToCart } from "@lib/data/cart"
import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const TABS = [
  { key: "pantry", label: "My Pantry" },
  { key: "last-order", label: "Last Order" },
  { key: "list", label: "Shopping List" },
]

export default function ReorderPage() {
  const { items, toggleRunningLow, removeItem, runningLow, stocked } =
    usePantry()
  const [activeTab, setActiveTab] = useState("pantry")
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState("")

  const handleAddToCart = async (variantId: string, title: string) => {
    setAddingItems((s) => new Set(s).add(variantId))
    try {
      await addToCart({ variantId, quantity: 1, countryCode: "" })
      window.dispatchEvent(new Event("cart-updated"))
      setToast(`Added ${title}`)
      setTimeout(() => setToast(""), 2000)
    } catch {}
    setAddingItems((s) => {
      const n = new Set(s)
      n.delete(variantId)
      return n
    })
  }

  const handleAddAllRunningLow = async () => {
    for (const item of runningLow) {
      setAddingItems((s) => new Set(s).add(item.variantId))
      try {
        await addToCart({ variantId: item.variantId, quantity: 1, countryCode: "" })
      } catch {}
    }
    window.dispatchEvent(new Event("cart-updated"))
    setToast(`Added ${runningLow.length} items`)
    setTimeout(() => setToast(""), 2000)
    setAddingItems(new Set())
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Reorder</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-brand-orange text-white"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-stone-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}

      {/* My Pantry Tab */}
      {activeTab === "pantry" && (
        <div className="space-y-6">
          {/* Running Low */}
          {runningLow.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Running Low ({runningLow.length})
                </h2>
                <button
                  onClick={handleAddAllRunningLow}
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  Add All to Basket
                </button>
              </div>
              <div className="space-y-2">
                {runningLow.map((item) => (
                  <PantryRow
                    key={item.productId}
                    item={item}
                    onAdd={handleAddToCart}
                    onToggle={toggleRunningLow}
                    onRemove={removeItem}
                    adding={addingItems.has(item.variantId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stocked */}
          {stocked.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-stone-700 mb-3">
                Stocked ({stocked.length})
              </h2>
              <div className="space-y-2">
                {stocked.map((item) => (
                  <PantryRow
                    key={item.productId}
                    item={item}
                    onAdd={handleAddToCart}
                    onToggle={toggleRunningLow}
                    onRemove={removeItem}
                    adding={addingItems.has(item.variantId)}
                  />
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">🫘</span>
              <h3 className="text-lg font-semibold text-stone-700">
                Your pantry is empty
              </h3>
              <p className="text-sm text-stone-500 mt-1 max-w-xs mx-auto">
                Add products to your pantry from any product page to track when you need to reorder
              </p>
              <LocalizedClientLink href="/store">
                <button className="mt-4 px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90">
                  Browse Products
                </button>
              </LocalizedClientLink>
            </div>
          )}
        </div>
      )}

      {/* Last Order Tab */}
      {activeTab === "last-order" && (
        <div className="text-center py-12">
          <span className="text-3xl block mb-3">📦</span>
          <h3 className="text-lg font-semibold text-stone-700">
            View your last order
          </h3>
          <p className="text-sm text-stone-500 mt-1 mb-4">
            Go to order history to reorder from a previous purchase
          </p>
          <LocalizedClientLink href="/account/orders">
            <button className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90">
              View Orders
            </button>
          </LocalizedClientLink>
        </div>
      )}

      {/* Shopping List Tab */}
      {activeTab === "list" && (
        <ShoppingListTab />
      )}
    </div>
  )
}

function PantryRow({
  item,
  onAdd,
  onToggle,
  onRemove,
  adding,
}: {
  item: any
  onAdd: (variantId: string, title: string) => void
  onToggle: (productId: string) => void
  onRemove: (productId: string) => void
  adding: boolean
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <LocalizedClientLink href={`/products/${item.handle}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {item.thumbnail && (
            <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover bg-stone-100 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{item.title}</p>
            <p className="text-xs text-stone-400">
              {item.weight} · {formatGBP(item.price)}
            </p>
          </div>
        </div>
      </LocalizedClientLink>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onToggle(item.productId)}
          className={`text-[10px] font-medium px-2 py-1 rounded-full border ${
            item.status === "running-low"
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "border-stone-200 text-stone-400 hover:border-amber-300"
          }`}
        >
          {item.status === "running-low" ? "Low!" : "Stocked"}
        </button>
        <button
          onClick={() => onAdd(item.variantId, item.title)}
          disabled={adding}
          className="text-[11px] font-semibold text-brand-orange border border-brand-orange rounded-lg px-2.5 py-1.5 hover:bg-brand-orange hover:text-white disabled:opacity-50 transition-all"
        >
          {adding ? "..." : "+ Add"}
        </button>
        <button
          onClick={() => onRemove(item.productId)}
          className="text-stone-300 hover:text-red-500 text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function ShoppingListTab() {
  const [items, setItems] = useState<Array<{ id: string; text: string; checked: boolean }>>([])
  const [input, setInput] = useState("")

  const addListItem = () => {
    if (!input.trim()) return
    setItems((prev) => [...prev, { id: Date.now().toString(), text: input.trim(), checked: false }])
    setInput("")
  }

  const toggleCheck = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  const removeChecked = () => {
    setItems((prev) => prev.filter((i) => !i.checked))
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addListItem()}
          placeholder="Add item to your list..."
          className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange"
        />
        <button
          onClick={addListItem}
          className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-3xl block mb-3">📝</span>
          <p className="text-sm text-stone-500">Your shopping list is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-3 cursor-pointer hover:bg-stone-50"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheck(item.id)}
                className="accent-brand-orange"
              />
              <span
                className={`text-sm flex-1 ${
                  item.checked ? "line-through text-stone-400" : "text-stone-700"
                }`}
              >
                {item.text}
              </span>
            </label>
          ))}
          {items.some((i) => i.checked) && (
            <button
              onClick={removeChecked}
              className="text-xs text-stone-400 hover:text-red-500 underline mt-2"
            >
              Remove checked items
            </button>
          )}
        </div>
      )}
    </div>
  )
}
