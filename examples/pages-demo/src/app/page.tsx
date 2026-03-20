"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

const spring = { type: "spring" as const, damping: 30, stiffness: 300 }
const stagger = { staggerChildren: 0.06 }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Page = "home" | "shop" | "cart"
type Category = "All" | "Running" | "Casual" | "Boots" | "Outdoor" | "Tops" | "Outerwear"

interface Product {
  id: number
  name: string
  price: number
  category: Category
  image: string
  type: "shoe" | "apparel"
}

interface CartItem {
  productId: number
  quantity: number
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const products: Product[] = [
  { id: 1, name: "Nike Air Max", price: 189, category: "Running", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 2, name: "White Sneakers", price: 129, category: "Casual", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 3, name: "Leather Boots", price: 249, category: "Boots", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 4, name: "Running Shoes", price: 159, category: "Running", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 5, name: "High Tops", price: 139, category: "Casual", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 6, name: "Hiking Boots", price: 219, category: "Outdoor", image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&h=400&fit=crop&q=80", type: "shoe" },
  { id: 7, name: "Hoodie", price: 89, category: "Tops", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&q=80", type: "apparel" },
  { id: 8, name: "Jacket", price: 199, category: "Outerwear", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&q=80", type: "apparel" },
  { id: 9, name: "T-Shirt", price: 39, category: "Tops", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80", type: "apparel" },
]

const categories: Category[] = ["All", "Running", "Casual", "Boots", "Outdoor", "Tops", "Outerwear"]

const HERO_IMAGE = "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&h=600&fit=crop&q=80"

const categoryCards = [
  { label: "Shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop&q=80", count: 6 },
  { label: "Apparel", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=400&fit=crop&q=80", count: 3 },
  { label: "Accessories", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=400&fit=crop&q=80", count: 0 },
]

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function getProduct(id: number): Product | undefined {
  return products.find(p => p.id === id)
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  onAddToCart,
  index = 0,
}: {
  product: Product
  onAddToCart: (productId: number) => void
  index?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ ...spring, delay: reduced ? 0 : index * 0.05 }}
      className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-md bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/50">
            {product.category}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-medium leading-tight text-foreground">{product.name}</h3>
          <span className="text-[15px] font-semibold text-foreground shrink-0 tabular-nums">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={() => onAddToCart(product.id)}
          className="w-full rounded-lg bg-primary px-3 py-2.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

function HomePage({
  onNavigate,
  onAddToCart,
}: {
  onNavigate: (page: Page) => void
  onAddToCart: (productId: number) => void
}) {
  const reduced = useReducedMotion()
  const newArrivals = products.slice(0, 4)

  return (
    <div className="space-y-16">
      {/* Hero */}
      <motion.section
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...spring, delay: 0.05 }}
        className="relative rounded-2xl overflow-hidden -mx-6 sm:mx-0"
      >
        <div className="relative h-[420px] sm:h-[500px]">
          <img
            src={HERO_IMAGE}
            alt="Premium footwear collection"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          <div className="relative flex flex-col justify-center h-full px-8 sm:px-14 max-w-2xl space-y-5">
            <motion.span
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 }}
              className="inline-flex self-start items-center rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-[12px] font-medium text-primary"
            >
              New Collection 2026
            </motion.span>
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.2 }}
              className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]"
            >
              Step Into Style
            </motion.h1>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.25 }}
              className="text-[15px] sm:text-[17px] text-white/70 leading-relaxed max-w-md"
            >
              Premium footwear &amp; apparel, curated for you. Designed for those who move with purpose.
            </motion.p>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              className="flex items-center gap-3 pt-2"
            >
              <button
                onClick={() => onNavigate("shop")}
                className="rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
              >
                Shop Now
              </button>
              <button
                onClick={() => onNavigate("shop")}
                className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/20 cursor-pointer"
              >
                View Collection
              </button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* New Arrivals */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">New Arrivals</h2>
            <p className="text-[13px] text-muted-foreground mt-1">Fresh drops, just for you</p>
          </div>
          <button
            onClick={() => onNavigate("shop")}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            View all &rarr;
          </button>
        </div>
        <div className="overflow-x-auto -mx-6 px-6 pb-2">
          <motion.div
            variants={{ visible: stagger }}
            initial="hidden"
            animate="visible"
            className="flex gap-5 min-w-max"
          >
            {newArrivals.map((p, i) => (
              <div key={p.id} className="w-[260px] shrink-0">
                <ProductCard product={p} onAddToCart={onAddToCart} index={i} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">Shop by Category</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Find exactly what you&apos;re looking for</p>
        </div>
        <motion.div
          variants={{ visible: stagger }}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:grid-cols-3"
        >
          {categoryCards.map((cat, i) => (
            <motion.button
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ ...spring, delay: i * 0.08 }}
              onClick={() => onNavigate("shop")}
              className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
            >
              <img
                src={cat.image}
                alt={cat.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative flex flex-col justify-end h-full p-5 text-left">
                <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                <p className="text-[13px] text-white/60">{cat.count > 0 ? `${cat.count} products` : "Coming soon"}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Brand banner */}
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-4"
      >
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Engineered for Performance</h2>
        <p className="text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Every product in our collection is selected for quality, durability, and style. No compromises.
        </p>
        <div className="grid grid-cols-3 gap-6 pt-4 max-w-md mx-auto">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary tabular-nums">50+</p>
            <p className="text-[12px] text-muted-foreground">Brands</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary tabular-nums">10K+</p>
            <p className="text-[12px] text-muted-foreground">Customers</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary tabular-nums">4.9</p>
            <p className="text-[12px] text-muted-foreground">Avg Rating</p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shop Page
// ---------------------------------------------------------------------------

function ShopPage({ onAddToCart }: { onAddToCart: (productId: number) => void }) {
  const [filter, setFilter] = useState<Category>("All")
  const reduced = useReducedMotion()

  const filtered = useMemo(
    () => filter === "All" ? products : products.filter(p => p.category === filter),
    [filter],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shop</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          variants={{ visible: stagger }}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          transition={spring}
          className="grid gap-5 grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40 mb-3">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-[14px] font-medium">No products found</p>
          <p className="text-[12px] text-muted-foreground mt-1">Try selecting a different category</p>
        </motion.div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cart Page
// ---------------------------------------------------------------------------

function CartPage({
  items,
  onUpdateQuantity,
  onRemove,
  onNavigate,
}: {
  items: CartItem[]
  onUpdateQuantity: (productId: number, delta: number) => void
  onRemove: (productId: number) => void
  onNavigate: (page: Page) => void
}) {
  const reduced = useReducedMotion()

  const resolvedItems = items
    .map(item => {
      const product = getProduct(item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null)

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 200 ? 0 : 12
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + shipping + tax
  const totalItems = resolvedItems.reduce((sum, item) => sum + item.quantity, 0)

  if (resolvedItems.length === 0) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          Looks like you haven&apos;t added anything yet. Browse our collection and find your next favorite pair.
        </p>
        <button
          onClick={() => onNavigate("shop")}
          className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
        >
          Continue Shopping
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Cart items */}
        <motion.div
          variants={{ visible: stagger }}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {resolvedItems.map(item => (
              <motion.div
                key={item.product.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={spring}
                layout
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                {/* Product image */}
                <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted/30">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold truncate">{item.product.name}</h3>
                  <p className="text-[12px] text-muted-foreground">{item.product.category}</p>
                  <p className="text-[13px] font-medium text-muted-foreground tabular-nums mt-0.5">
                    {formatPrice(item.product.price)} each
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-[13px] font-medium tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center text-[13px] font-medium transition-colors hover:bg-muted cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <span className="w-20 text-right text-[15px] font-bold tabular-nums">
                  {formatPrice(item.product.price * item.quantity)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => onRemove(item.product.id)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  aria-label={`Remove ${item.product.name} from cart`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Order summary */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 space-y-4 h-fit lg:sticky lg:top-20"
        >
          <h3 className="text-[15px] font-bold">Order Summary</h3>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">
                {shipping === 0 ? (
                  <span className="text-[var(--success)]">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span className="font-medium tabular-nums">{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-border pt-2.5 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-[16px] tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>

          {shipping > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Free shipping on orders over $200
            </p>
          )}

          <button className="w-full rounded-lg bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] cursor-pointer">
            Proceed to Checkout
          </button>

          <button
            onClick={() => onNavigate("shop")}
            className="w-full text-center text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Store
// ---------------------------------------------------------------------------

export default function StridePage() {
  const [page, setPage] = useState<Page>("home")
  const [cart, setCart] = useState<CartItem[]>([])
  const reduced = useReducedMotion()

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleAddToCart = useCallback((productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId)
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
  }, [])

  const handleUpdateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    )
  }, [])

  const handleRemove = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }, [])

  const navItems = useMemo(
    () => [
      { key: "home" as const, label: "Home" },
      { key: "shop" as const, label: "Shop" },
      { key: "cart" as const, label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` },
    ],
    [cartCount],
  )

  return (
    <div className="min-h-dvh bg-background font-sans flex flex-col">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <button
            onClick={() => setPage("home")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[18px] font-extrabold tracking-widest uppercase text-foreground">Fabrik Store</span>
          </button>
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer",
                  page === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ---- Content ---- */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={spring}
          >
            {page === "home" && (
              <HomePage onNavigate={setPage} onAddToCart={handleAddToCart} />
            )}
            {page === "shop" && (
              <ShopPage onAddToCart={handleAddToCart} />
            )}
            {page === "cart" && (
              <CartPage
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                onNavigate={setPage}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid gap-8 sm:grid-cols-3 text-[12px]">
            <div className="space-y-2">
              <h4 className="font-extrabold text-[14px] tracking-widest uppercase">Fabrik Store</h4>
              <p className="text-muted-foreground leading-relaxed">
                Premium footwear &amp; apparel. Designed for those who move with purpose.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-[13px]">Quick Links</h4>
              <div className="space-y-1 text-muted-foreground">
                <button onClick={() => setPage("home")} className="block hover:text-foreground transition-colors cursor-pointer">Home</button>
                <button onClick={() => setPage("shop")} className="block hover:text-foreground transition-colors cursor-pointer">Shop</button>
                <button onClick={() => setPage("cart")} className="block hover:text-foreground transition-colors cursor-pointer">Cart</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-[13px]">Built With</h4>
              <p className="text-muted-foreground leading-relaxed">
                AI-generated pages powered by Fabrik UI. React 19 + Next.js + Tailwind CSS.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-border text-center text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Fabrik Store. All rights reserved. &mdash; AI-generated demo by Fabrik UI
          </div>
        </div>
      </footer>
    </div>
  )
}
