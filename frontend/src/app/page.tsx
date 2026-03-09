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
      <section className="bg-gradient-to-br from-brand-primary to-brand-dark text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <Badge className="bg-white/20 text-white border-none mb-4">
              🎓 Campus Commerce Platform
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Your Campus,{' '}
              <span className="text-brand-light">Your Marketplace</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Buy, sell, rent, and discover services across your campus. CampusHat
              connects students and faculty in one unified platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-brand-primary hover:bg-white/90">
                <ShoppingBag className="mr-2 h-5 w-5" /> Explore Mall
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/marketplace">
                  Visit Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Shop by Category</h2>
          <Link href="/categories" className="text-sm text-brand-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link key={cat.name} href={cat.href}>
                <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-center">{cat.name}</span>
                  </CardContent>
                </Card>
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
