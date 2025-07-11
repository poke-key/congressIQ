// src/app/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" //Card Content is not used
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  FileText, 
  TrendingUp, 
  Users, 
  Bell, 
  ChevronRight,
  Star,
  ArrowRight,
  BookOpen,
  Building,
  Shield,
  Zap
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">CongressIQ</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
              <Button variant="ghost">About</Button>
              <Button variant="outline">Sign In</Button>
              <Button>Get Started</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Legislative Intelligence
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Understand Congress
            <span className="text-blue-600 block">Before It Impacts You</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Get instant AI-powered summaries of congressional bills, predict business impacts, 
            and stay ahead of regulatory changes that matter to your industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
          
          {/* Search Bar Preview */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search bills, topics, or impact on your industry..."
                className="pl-10 pr-4 py-6 text-lg bg-white shadow-lg border-2 border-blue-200 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Everything You Need to Track Congress
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From real-time bill summaries to predictive business impact analysis, 
            we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>AI Bill Summaries</CardTitle>
              <CardDescription>
                Get instant, plain-English summaries of complex legislation in 30 seconds or less.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Business Impact Analysis</CardTitle>
              <CardDescription>
                Predict how new legislation will affect your industry, company size, and business model.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Stakeholder Mapping</CardTitle>
              <CardDescription>
                Understand who's affected by legislation and track lobbying activity in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Custom AI agents monitor bills based on your industry and interests.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-red-200">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Compliance Timeline</CardTitle>
              <CardDescription>
                Generate actionable roadmaps to prepare for new regulations before they take effect.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Building className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Enterprise Integration</CardTitle>
              <CardDescription>
                White-label solutions and API access for seamless integration with your existing tools.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-slate-600">
              Join thousands of professionals who rely on CongressIQ for legislative intelligence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-slate-700 mb-4">
                "CongressIQ helped us identify regulatory risks 6 months before our competitors. 
                The business impact analysis is incredibly accurate."
              </blockquote>
              <div className="font-semibold text-slate-900">Sarah Chen</div>
              <div className="text-sm text-slate-500">Chief Compliance Officer, TechCorp</div>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-slate-700 mb-4">
                "The AI summaries save our legal team hours every week. We can now track 
                100+ bills that impact our industry effortlessly."
              </blockquote>
              <div className="font-semibold text-slate-900">Michael Rodriguez</div>
              <div className="text-sm text-slate-500">General Counsel, FinanceFirst</div>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-slate-700 mb-4">
                "The predictive insights have transformed our government relations strategy. 
                We're always one step ahead now."
              </blockquote>
              <div className="font-semibold text-slate-900">Emily Johnson</div>
              <div className="text-sm text-slate-500">VP of Government Affairs, MedDevice Inc</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Stay Ahead of Congress?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who use CongressIQ to turn legislative 
            uncertainty into competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Start Free Trial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">CongressIQ</span>
              </div>
              <p className="text-slate-400">
                AI-powered legislative intelligence for the modern business.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Enterprise</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-slate-800" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400">
              © 2025 CongressIQ. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}