'use client'

// src/app/page.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Sparkles, 
  BookOpen,
  ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/search')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  return (
    <div className="min-h-screen constitution-bg flex flex-col">
      {/* Thinner Header */}
      <header className="border-b border-stone-400/30 bg-amber-100/60 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-6 py-2">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-amber-800 rounded-lg flex items-center justify-center ghibli-shadow">
                <BookOpen className="w-4 h-4 text-amber-50" />
              </div>
              <span className="text-lg font-bold text-amber-950">CongressIQ</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-amber-950 hover:bg-amber-200/50">
                Sign In
              </Button>
              <Button size="sm" className="ghibli-shadow bg-amber-800 hover:bg-amber-700">
                Sign Up
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Search Section - flex-1 to take remaining space */}
      <section className="flex-1 flex items-center justify-center px-6 py-20 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <Badge 
            variant="secondary" 
            className="mb-8 ghibli-shadow bg-amber-200/80 text-amber-900 border-amber-600/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Legislative Intelligence
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-amber-950 leading-tight">
            Understand Congress{" "}
            <span className="text-amber-800">Before It Impacts You</span>
          </h1>
          
          <p className="text-xl text-amber-700 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant AI-powered summaries of congressional bills, predict business impacts, 
            and stay ahead of regulatory changes that matter to your industry.
          </p>
          
          {/* Main Search Bar with Icon */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-600 w-6 h-6" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search bills, topics, or impact on your industry..." 
              className="pl-14 h-16 text-xl ghibli-shadow bg-amber-50/90 backdrop-blur-sm border-amber-300/50 rounded-2xl text-amber-950 placeholder:text-amber-600 focus:ring-2 focus:ring-amber-600"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleSearch}
              className="ghibli-shadow text-lg px-8 py-6 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50"
            >
              Search Bills
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="ghibli-shadow text-lg px-8 py-6 rounded-xl border-amber-600/50 text-amber-950 hover:bg-amber-200/50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - now at bottom */}
      <footer className="py-4 px-6 border-t border-stone-400/30 bg-amber-100/40 relative z-10">
        <div className="container mx-auto text-center">
          <p className="text-amber-700 text-xs">
            AI-powered legislative intelligence for the modern professional.
          </p>
        </div>
      </footer>
    </div>
  )
}