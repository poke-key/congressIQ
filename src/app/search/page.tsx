'use client'

// src/app/search/page.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  Building,
  ChevronRight,
  Filter,
  FileText,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

interface Bill {
  id: string
  title: string
  shortTitle: string
  summary: string
  aiSummary: string
  status: string
  introducedDate: string
  sponsor: string
  impactLevel: string
  sectors: string[]
  probability: number
  cosponsorsCount: number
  congress: string
  type: string
  number: string
}

interface SearchResponse {
  bills: Bill[]
  total: number
  query: string
  pagination?: {
    count: number
    next?: string
    prev?: string
  }
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [selectedCongress, setSelectedCongress] = useState('119')
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch bills from API
  const fetchBills = useCallback(async (query: string = '', congressOverride?: string, offsetOverride?: number, append: boolean = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      params.append('limit', '20')
      params.append('congress', congressOverride || selectedCongress)
      if (offsetOverride) params.append('offset', offsetOverride.toString());
      
      const response = await fetch(`/api/bills/search?${params}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const data: SearchResponse = await response.json()
      if (append) {
        setBills(prev => [...prev, ...data.bills]);
      } else {
        setBills(data.bills);
      }
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch bills:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bills')
      if (!append) setBills([])
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [selectedCongress])

  // Fetch bills on component mount and when search params or selectedCongress change
  useEffect(() => {
    const query = searchParams.get('q') || ''
    setSearchQuery(query)
    setOffset(0);
    fetchBills(query, undefined, 0, false)
  }, [searchParams, selectedCongress, fetchBills])

  const handleSearch = () => {
    const query = searchQuery.trim()
    if (query !== (searchParams.get('q') || '')) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCongressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCongress(e.target.value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Passed House": return "bg-green-100 text-green-800 border-green-200"
      case "Committee Review": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Introduced": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case "High": return "bg-red-100 text-red-800 border-red-200"
      case "Medium": return "bg-orange-100 text-orange-800 border-orange-200"
      case "Low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen constitution-bg">
      {/* Header */}
      <header className="border-b border-stone-400/30 bg-amber-100/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-amber-800 rounded-lg flex items-center justify-center ghibli-shadow cursor-pointer" onClick={() => router.push('/')}>
                  <BookOpen className="w-4 h-4 text-amber-50" />
                </div>
                <span className="text-lg font-bold text-amber-950">CongressIQ</span>
              </div>
              
              {/* Search Bar in Header */}
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-5 h-5" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search bills, topics, or impact on your industry..." 
                  className="pl-10 h-10 ghibli-shadow bg-amber-50/90 backdrop-blur-sm border-amber-300/50 rounded-xl text-amber-950 placeholder:text-amber-600"
                />
              </div>
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

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-80 space-y-6">
            <Card className="ghibli-shadow bg-amber-50/80 border-amber-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-amber-950">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Status</label>
                  <div className="space-y-2">
                    {["All", "Introduced", "Committee Review", "Passed House", "Passed Senate", "Enacted"].map((status) => (
                      <label key={status} className="flex items-center space-x-2 text-sm text-amber-800">
                        <input type="checkbox" className="rounded border-amber-300" defaultChecked={status === "All"} />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-amber-200" />
                
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Impact Level</label>
                  <div className="space-y-2">
                    {["All", "High", "Medium", "Low"].map((level) => (
                      <label key={level} className="flex items-center space-x-2 text-sm text-amber-800">
                        <input type="checkbox" className="rounded border-amber-300" defaultChecked={level === "All"} />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator className="bg-amber-200" />

                {/* Congress Filter */}
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Congress</label>
                  <div className="space-y-2">
                    {[
                      { label: '119th (Current)', value: '119' },
                      { label: '118th', value: '118' },
                      { label: '117th', value: '117' },
                      { label: '116th', value: '116' },
                    ].map((cong) => (
                      <label key={cong.value} className="flex items-center space-x-2 text-sm text-amber-800">
                        <input
                          type="radio"
                          name="congress"
                          value={cong.value}
                          checked={selectedCongress === cong.value}
                          onChange={handleCongressChange}
                          className="rounded border-amber-300"
                        />
                        <span>{cong.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator className="bg-amber-200" />

                <div>
                  <label className="text-sm font-medium text-amber-900 mb-2 block">Sectors</label>
                  <div className="space-y-2">
                    {["Technology", "Healthcare", "Energy", "Finance", "Manufacturing", "Agriculture"].map((sector) => (
                      <label key={sector} className="flex items-center space-x-2 text-sm text-amber-800">
                        <input type="checkbox" className="rounded border-amber-300" />
                        <span>{sector}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Results */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-amber-950 mb-2">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Recent Bills'}
              </h1>
              {loading ? (
                <Skeleton className="h-4 w-48 bg-amber-200" />
              ) : error ? (
                <p className="text-red-600">Error: {error}</p>
              ) : (
                <div className="text-amber-700">
                  <p>Found {total} bills {searchQuery ? 'matching your search' : ''} in the {selectedCongress}th Congress</p>
                  <p className="text-sm text-amber-600 mt-1">Showing bills from the current Congress (2025-2027)</p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="ghibli-shadow bg-amber-50/80 border-amber-200/50">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-3">
                          <Skeleton className="h-6 w-16 bg-amber-200" />
                          <Skeleton className="h-6 w-24 bg-amber-200" />
                          <Skeleton className="h-6 w-20 bg-amber-200" />
                        </div>
                        <Skeleton className="h-6 w-32 bg-amber-200" />
                      </div>
                      <Skeleton className="h-8 w-3/4 bg-amber-200" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-48 bg-amber-200" />
                        <Skeleton className="h-4 w-32 bg-amber-200" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-amber-200 mb-4" />
                      <Skeleton className="h-16 w-full bg-amber-200" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="ghibli-shadow bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <p>Failed to load bills. Please try again.</p>
                  </div>
                  <Button 
                    onClick={() => fetchBills(searchQuery)} 
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!loading && !error && bills.length === 0 && (
              <Card className="ghibli-shadow bg-amber-50/80 border-amber-200/50">
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-amber-600 mb-4" />
                  <h3 className="text-lg font-semibold text-amber-950 mb-2">No Bills Found</h3>
                  <p className="text-amber-700 mb-4">
                    {searchQuery 
                      ? `No bills found matching "${searchQuery}". Try a different search term.`
                      : 'No recent bills available at the moment.'
                    }
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      router.push('/search')
                    }}
                    variant="outline"
                    className="border-amber-400/50 text-amber-800 hover:bg-amber-200/50"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Results List */}
            {!loading && !error && bills.length > 0 && (
              <div className="space-y-6">
                {bills.map((bill) => (
                  <Card key={bill.id} className="ghibli-shadow bg-amber-50/80 border-amber-200/50 hover:bg-amber-100/80 transition-all duration-300 cursor-pointer">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-xs font-mono text-amber-800 border-amber-400">
                            {bill.shortTitle}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </Badge>
                          <Badge className={`text-xs ${getImpactColor(bill.impactLevel)}`}>
                            {bill.impactLevel} Impact
                          </Badge>
                        </div>
                        <div className="flex items-center text-amber-700 text-sm">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {bill.probability}% passage probability
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl text-amber-950 hover:text-amber-800 transition-colors">
                        {bill.title}
                      </CardTitle>
                      
                      <div className="flex items-center space-x-4 text-sm text-amber-700">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {bill.sponsor}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(bill.introducedDate).toLocaleDateString()}
                        </div>
                        {bill.cosponsorsCount > 0 && (
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {bill.cosponsorsCount} cosponsors
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Bill Summary
                        </h4>
                        <p className="text-amber-800 leading-relaxed">
                          {bill.summary.length > 300 ? `${bill.summary.slice(0, 300)}...` : bill.summary}
                        </p>
                      </div>
                      
                      <div className="bg-amber-100/60 p-4 rounded-lg border border-amber-200/50">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          AI Business Impact Analysis
                        </h4>
                        <p className="text-amber-800 leading-relaxed">
                          {bill.aiSummary.length > 200 ? `${bill.aiSummary.slice(0, 200)}...` : bill.aiSummary}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-amber-700">Affected Sectors:</span>
                          <div className="flex space-x-1">
                            {bill.sectors.slice(0, 3).map((sector) => (
                              <Badge key={sector} variant="secondary" className="text-xs bg-amber-200/60 text-amber-800">
                                {sector}
                              </Badge>
                            ))}
                            {bill.sectors.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-amber-200/60 text-amber-800">
                                +{bill.sectors.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ghibli-shadow border-amber-400/50 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => router.push(`/bill/${bill.congress}/${bill.type}/${bill.number}`)}
                        >
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && !error && bills.length > 0 && bills.length < total && (
              <div className="text-center mt-8">
                <Button 
                  className="ghibli-shadow bg-amber-800 hover:bg-amber-700 text-amber-50"
                  disabled={loadingMore}
                  onClick={() => {
                    const newOffset = offset + bills.length;
                    setOffset(newOffset);
                    fetchBills(searchQuery, undefined, newOffset, true);
                  }}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Results'
                  )}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}