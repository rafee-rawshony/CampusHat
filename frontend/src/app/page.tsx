'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import {
  ShoppingBag,
  Shirt,
  Laptop,
  BookOpen,
  Coffee,
  Wrench,
  Home as HomeIcon,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  { name: 'Electronics', icon: Laptop, href: '/categories/electronics', color: 'bg-blue-50 text-blue-600' },
  { name: 'Clothing', icon: Shirt, href: '/categories/clothing', color: 'bg-pink-50 text-pink-600' },
  { name: 'Books', icon: BookOpen, href: '/categories/books', color: 'bg-amber-50 text-amber-600' },
  { name: 'Food', icon: Coffee, href: '/categories/food', color: 'bg-orange-50 text-orange-600' },
  { name: 'Services', icon: Wrench, href: '/categories/services', color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Housing', icon: HomeIcon, href: '/categories/housing', color: 'bg-green-50 text-green-600' },
]

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 mt-6">
        <div className="bg-surface-muted rounded-3xl overflow-hidden shadow-sm border border-surface-border">
          <div className="px-6 sm:px-10 lg:px-16 py-12 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">
                  Student Exclusive Offer
                </span>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-6 mb-4 leading-[1.2]">
                  Gear up for success with the best campus essentials
                </h1>
                <p className="text-lg text-gray-600 mb-8 max-w-lg font-medium">
                  Massive discounts on laptops, academic books, and trendy apparel for university students.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <Button size="lg" className="rounded-xl px-8 shadow-md">
                    Shop Now
                  </Button>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-red-500">৳1,250</span>
                      <span className="text-lg text-gray-400 font-bold line-through">৳3,000</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Limited time discount</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-full aspect-[4/3] bg-white rounded-3xl shadow-xl flex items-center justify-center p-2 border border-gray-100 rotate-2 hover:rotate-0 transition-all duration-500">
                  <img src="https://placehold.co/600x400/634C9F/white?text=Campus+Essentials" alt="Student Essentials" className="w-full h-full object-cover rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Categories</h2>
            <p className="text-gray-500 text-sm mt-1">New products with updated stocks.</p>
          </div>
          <Link href="/categories" className="hidden sm:inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm font-bold text-brand-primary hover:bg-gray-50 transition-colors">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="flex flex-col items-center text-center p-4 border border-gray-200 rounded-2xl hover:shadow-lg hover:border-brand-primary transition-all group bg-white h-full"
              >
                <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-xl mb-3 group-hover:bg-brand-primary/10 transition-colors">
                  <Icon className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-gray-700 group-hover:text-brand-primary leading-tight mt-1">
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products Skeleton */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Featured Products</h2>
          <Link href="/shop" className="text-sm text-brand-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Products will appear here once sellers start listing items.
        </p>
      </section>
    </MainLayout>
  )
}
