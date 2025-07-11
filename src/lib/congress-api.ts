export interface Bill {
    number: string
    title: string
    type: string
    congress: number
    introducedDate: string
    latestAction?: {
      actionDate: string
      text: string
    }
    sponsors?: Array<{
      bioguideId: string
      fullName: string
      party: string
      state: string
    }>
    cosponsors?: {
      count: number
      countIncludingWithdrawnCosponsors: number
    }
    subjects?: {
      legislativeSubjects: Array<{
        name: string
      }>
    }
    textVersions?: Array<{
      type: string
      date: string
      formats: Array<{
        type: string
        url: string
      }>
    }>
    url: string
    originChamber: string
  }
  
  export interface CongressApiResponse<T> {
    bills?: T[]
    bill?: T
    pagination?: {
      count: number
      next?: string
      prev?: string
    }
  }
  
  class CongressApiService {
    private readonly baseURL: string
    private readonly apiKey: string
  
    constructor() {
      this.baseURL = process.env.CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3'
      this.apiKey = process.env.CONGRESS_API_KEY || ''
      
      if (!this.apiKey) {
        throw new Error('Congress API key is required')
      }
    }
  
    private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
      const url = new URL(`${this.baseURL}${endpoint}`)
      
      // Add API key and format
      url.searchParams.append('api_key', this.apiKey)
      url.searchParams.append('format', 'json')
      
      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
  
      try {
        console.log('Fetching from Congress API:', url.toString())
        
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'CongressIQ/1.0',
          },
          // Add caching for better performance
          next: { revalidate: 300 } // Cache for 5 minutes
        })
  
        if (!response.ok) {
          throw new Error(`Congress API error: ${response.status} ${response.statusText}`)
        }
  
        const data = await response.json()
        return data
      } catch (error) {
        console.error('Congress API request failed:', error)
        throw error
      }
    }
  
    async searchBills(query: string, options: {
      limit?: number
      offset?: number
      congress?: number
      chamber?: 'house' | 'senate'
      sort?: 'latestAction' | 'introducedDate' | 'updateDate'
      billType?: 'hr' | 's' | 'hjres' | 'sjres' | 'hconres' | 'sconres' | 'hres' | 'sres'
    } = {}): Promise<CongressApiResponse<Bill>> {
      const params: Record<string, string> = {}
      
      // Add search query
      if (query) {
        params.q = query
      }
      
      // Add options
      if (options.limit) params.limit = options.limit.toString()
      if (options.offset) params.offset = options.offset.toString()
      if (options.congress) params.congress = options.congress.toString()
      if (options.chamber) params.chamber = options.chamber
      if (options.sort) params.sort = options.sort
      if (options.billType) params.billType = options.billType
  
      return this.makeRequest<CongressApiResponse<Bill>>('/bill', params)
    }
  
    async getBill(congress: number, billType: string, billNumber: string): Promise<CongressApiResponse<Bill>> {
      const endpoint = `/bill/${congress}/${billType}/${billNumber}`
      return this.makeRequest<CongressApiResponse<Bill>>(endpoint)
    }
  
    async getBillText(congress: number, billType: string, billNumber: string): Promise<any> {
      const endpoint = `/bill/${congress}/${billType}/${billNumber}/text`
      return this.makeRequest(endpoint)
    }
  
    async getBillSummary(congress: number, billType: string, billNumber: string): Promise<any> {
      const endpoint = `/bill/${congress}/${billType}/${billNumber}/summaries`
      return this.makeRequest(endpoint)
    }
  
    async getRecentBills(options: {
      limit?: number
      congress?: number
      chamber?: 'house' | 'senate'
    } = {}): Promise<CongressApiResponse<Bill>> {
      const params: Record<string, string> = {
        sort: 'updateDate' // Get most recently updated bills
      }
      
      if (options.limit) params.limit = options.limit.toString()
      if (options.congress) params.congress = options.congress.toString()
      if (options.chamber) params.chamber = options.chamber
  
      return this.makeRequest<CongressApiResponse<Bill>>('/bill', params)
    }
  
    // Helper method to get current Congress number (118th Congress as of 2023-2024)
    getCurrentCongress(): number {
      const currentYear = new Date().getFullYear()
      // Congress numbers: 118th (2023-2024), 119th (2025-2026), etc.
      return Math.floor((currentYear - 1789) / 2) + 1
    }
  
    // Helper to parse bill identifier from various formats
    parseBillId(billId: string): { congress: number, type: string, number: string } | null {
      // Examples: "hr1234-118", "s567-118", "H.R. 1234", "S. 567"
      const patterns = [
        /^([a-z]+)(\d+)-(\d+)$/i, // hr1234-118
        /^([a-z]+)\.?\s*(\d+)$/i, // H.R. 1234 or HR 1234
      ]
  
      for (const pattern of patterns) {
        const match = billId.match(pattern)
        if (match) {
          const [, typeRaw, numberStr, congressStr] = match
          const type = typeRaw.toLowerCase()
          const number = numberStr
          const congress = congressStr ? parseInt(congressStr) : this.getCurrentCongress()
          
          return { congress, type, number }
        }
      }
  
      return null
    }
  }
  
  export const congressApi = new CongressApiService()
  
  // Helper function to format bill status from latest action
  export function getBillStatus(bill: Bill): string {
    if (!bill.latestAction) return 'Introduced'
    
    const actionText = bill.latestAction.text.toLowerCase()
    
    if (actionText.includes('enacted') || actionText.includes('became public law')) {
      return 'Enacted'
    } else if (actionText.includes('passed senate')) {
      return 'Passed Senate'
    } else if (actionText.includes('passed house')) {
      return 'Passed House'
    } else if (actionText.includes('committee')) {
      return 'Committee Review'
    } else if (actionText.includes('introduced')) {
      return 'Introduced'
    }
    
    return 'In Progress'
  }
  
  // Helper to estimate impact level (we'll enhance this with AI later)
  export function estimateImpactLevel(bill: Bill): 'High' | 'Medium' | 'Low' {
    const title = bill.title.toLowerCase()
    const subjects = bill.subjects?.legislativeSubjects?.map(s => s.name.toLowerCase()) || []
    
    const highImpactKeywords = [
      'tax', 'healthcare', 'energy', 'infrastructure', 'defense', 'budget',
      'immigration', 'banking', 'financial', 'climate', 'education'
    ]
    
    const hasHighImpactKeyword = highImpactKeywords.some(keyword => 
      title.includes(keyword) || subjects.some(subject => subject.includes(keyword))
    )
    
    const cosponsorsCount = bill.cosponsors?.count || 0
    
    if (hasHighImpactKeyword && cosponsorsCount > 50) return 'High'
    if (hasHighImpactKeyword || cosponsorsCount > 20) return 'Medium'
    return 'Low'
  }