'use client'

// src/app/search/page.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  Building,
  ChevronRight,
  Filter,
  Clock,
  FileText,
  AlertCircle
} from "lucide-react"

// Mock data for now - we'll replace this with real API data later
const mockBills = [
  {
    id: "hr-1234",
    title: "Clean Energy Innovation Act",
    shortTitle: "H.R. 1234",
    summary: "Establishes a comprehensive framework for clean energy innovation, including tax incentives for renewable energy projects and research grants for emerging technologies.",
    aiSummary: "This bill could significantly impact energy companies, manufacturing, and tech sectors. Estimated $50B in new market opportunities for clean tech companies.",
    status: "Passed House",
    introducedDate: "2024-03-15",
    sponsor: "Rep. Jane Smith (D-CA)",
    impactLevel: "High",
    sectors: ["Energy", "Technology", "Manufacturing"],
    probability: 75
  },
  {
    id: "s-567",
    title: "Small Business Digital Infrastructure Support Act",
    shortTitle: "S. 567",
    summary: "Provides funding and technical assistance to help small businesses upgrade their digital infrastructure and cybersecurity capabilities.",
    aiSummary: "Primary impact on small businesses, cybersecurity firms, and IT consultants. Could create compliance requirements for businesses with 50+ employees.",
    status: "Committee Review",
    introducedDate: "2024-02-28",
    sponsor: "Sen. John Doe (R-TX)",
    impactLevel: "Medium",
    sectors: ["Technology", "Small Business", "Cybersecurity"],
    probability: 45
  },
  {
    id: "hr-2468",
    title: "Healthcare Data Privacy Enhancement Act",
    shortTitle: "H.R. 2468",
    summary: "Strengthens privacy protections for healthcare data and establishes new requirements for healthcare providers and technology companies handling medical information.",
    aiSummary: "Major compliance changes for healthcare providers and health tech companies. Estimated implementation costs of $10-50M for large healthcare systems.",
    status: "Introduced",
    introducedDate: "2024-01-12",
    sponsor: "Rep. Sarah Johnson (D-NY)",
    impactLevel: "High",
    sectors: ["Healthcare", "Technology", "Privacy"],
    probability: 60
  }
]

export default function SearchResults() {
  const searchQuery = "clean energy" // This would come from URL params in real implementation

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
                <div className="w-7 h-7 bg-amber-800 rounded-lg flex items-center justify-center ghibli-shadow">
                  <BookOpen className="w-4 h-4 text-amber-50" />
                </div>
                <span className="text-lg font-bold text-amber-950">CongressIQ</span>
              </div>
              
              {/* Search Bar in Header */}
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-5 h-5" />
                <Input 
                  defaultValue={searchQuery}
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
                Search Results for "{searchQuery}"
              </h1>
              <p className="text-amber-700">Found {mockBills.length} bills matching your search</p>
            </div>

            {/* Results List */}
            <div className="space-y-6">
              {mockBills.map((bill) => (
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
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Bill Summary
                      </h4>
                      <p className="text-amber-800 leading-relaxed">{bill.summary}</p>
                    </div>
                    
                    <div className="bg-amber-100/60 p-4 rounded-lg border border-amber-200/50">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        AI Business Impact Analysis
                      </h4>
                      <p className="text-amber-800 leading-relaxed">{bill.aiSummary}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-amber-700">Affected Sectors:</span>
                        <div className="flex space-x-1">
                          {bill.sectors.map((sector) => (
                            <Badge key={sector} variant="secondary" className="text-xs bg-amber-200/60 text-amber-800">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="ghibli-shadow border-amber-400/50 text-amber-800 hover:bg-amber-200/50">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button className="ghibli-shadow bg-amber-800 hover:bg-amber-700 text-amber-50">
                Load More Results
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}