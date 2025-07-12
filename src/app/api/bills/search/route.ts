// src/app/api/bills/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { congressApi, getBillStatus, estimateImpactLevel } from '@/lib/congress-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const congress = searchParams.get('congress') ? parseInt(searchParams.get('congress')!) : undefined
    const chamber = searchParams.get('chamber') as 'house' | 'senate' | undefined
    const billType = searchParams.get('billType') as 'hr' | 's' | 'hjres' | 'sjres' | 'hconres' | 'sconres' | 'hres' | 'sres' | undefined
    const sort = searchParams.get('sort') as 'latestAction' | 'introducedDate' | 'updateDate' | undefined || 'updateDate'

    console.log('Search request:', { query, limit, offset, congress, chamber, billType, sort })
    console.log('Congress parameter:', congress, 'Type:', typeof congress)

    const response = await congressApi.searchBills(query, {
      limit,
      offset,
      congress,
      chamber,
      billType,
      sort
    })

    // Debug: print first 5 bills returned by the API before filtering
    if (response.bills && response.bills.length > 0) {
      console.log('First 5 bills from API:', response.bills.slice(0, 5).map(bill => ({
        congress: bill.congress,
        title: bill.title
      })))
    } else {
      console.log('No bills returned from API at all.')
    }

    // Filter bills by congress if specified (in case API ignores it)
    let filteredBills = response.bills || [];
    if (congress) {
      filteredBills = filteredBills.filter(bill => bill.congress === congress);
    }

    // Transform the data to match our frontend expectations
    const transformedBills = filteredBills.map(bill => {
      const sponsor = bill.sponsors?.[0]
      const status = getBillStatus(bill)
      const impactLevel = estimateImpactLevel(bill)
      
      return {
        id: `${bill.type}${bill.number}-${bill.congress}`,
        title: bill.title,
        shortTitle: `${bill.type.toUpperCase()}. ${bill.number}`,
        summary: bill.title, // We'll get better summaries from bill text later
        aiSummary: generatePlaceholderAISummary(bill), // Placeholder until we add LLM
        status,
        introducedDate: bill.introducedDate,
        sponsor: sponsor ? `${sponsor.fullName} (${sponsor.party}-${sponsor.state})` : 'Unknown',
        impactLevel,
        sectors: extractSectors(bill),
        probability: estimatePassageProbability(bill, status),
        url: bill.url,
        congress: bill.congress,
        type: bill.type,
        number: bill.number,
        latestAction: bill.latestAction,
        cosponsorsCount: bill.cosponsors?.count || 0
      }
    }) || []

    return NextResponse.json({
      bills: transformedBills,
      pagination: response.pagination,
      query,
      total: response.pagination?.count || 0
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search bills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to extract sectors from bill subjects
function extractSectors(bill: { subjects?: { legislativeSubjects?: Array<{ name: string }> }, title: string }): string[] {
  const subjects = bill.subjects?.legislativeSubjects?.map((s) => s.name) || []
  const sectorMap: Record<string, string[]> = {
    'Technology': ['science', 'technology', 'internet', 'telecommunications', 'cybersecurity', 'artificial intelligence', 'data'],
    'Healthcare': ['health', 'medical', 'medicare', 'medicaid', 'hospital', 'pharmaceutical', 'drug'],
    'Energy': ['energy', 'oil', 'gas', 'renewable', 'solar', 'wind', 'nuclear', 'coal', 'electricity'],
    'Finance': ['banking', 'financial', 'securities', 'investment', 'credit', 'loan', 'mortgage'],
    'Manufacturing': ['manufacturing', 'production', 'industrial', 'factory', 'supply chain'],
    'Agriculture': ['agriculture', 'farming', 'food', 'crop', 'livestock', 'rural'],
    'Transportation': ['transportation', 'aviation', 'railroad', 'highway', 'shipping', 'automotive'],
    'Education': ['education', 'school', 'university', 'student', 'teacher', 'learning'],
    'Environment': ['environment', 'climate', 'pollution', 'conservation', 'wildlife', 'water'],
    'Defense': ['defense', 'military', 'armed forces', 'security', 'veterans']
  }

  const detectedSectors: string[] = []
  const searchText = `${bill.title} ${subjects.join(' ')}`.toLowerCase()

  for (const [sector, keywords] of Object.entries(sectorMap)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      detectedSectors.push(sector)
    }
  }

  return detectedSectors.length > 0 ? detectedSectors : ['General']
}

// Helper function to estimate passage probability
function estimatePassageProbability(bill: { cosponsors?: { count: number }, originChamber?: string }, status: string): number {
  let baseProb = 15 // Base probability for introduced bills

  // Adjust based on status
  switch (status) {
    case 'Enacted': return 100
    case 'Passed Senate': return 85
    case 'Passed House': return 75
    case 'Committee Review': baseProb = 35; break
    case 'Introduced': baseProb = 15; break
    default: baseProb = 25
  }

  // Adjust based on cosponsors
  const cosponsors = bill.cosponsors?.count || 0
  if (cosponsors > 100) baseProb += 30
  else if (cosponsors > 50) baseProb += 20
  else if (cosponsors > 20) baseProb += 10
  else if (cosponsors > 5) baseProb += 5

  // Adjust based on chamber
  if (bill.originChamber === 'House' && cosponsors > 218) baseProb += 15 // Majority threshold
  if (bill.originChamber === 'Senate' && cosponsors > 51) baseProb += 15

  return Math.min(95, Math.max(5, baseProb))
}

// Placeholder AI summary generator (we'll replace this with real LLM later)
function generatePlaceholderAISummary(bill: { subjects?: { legislativeSubjects?: Array<{ name: string }> }, title: string, cosponsors?: { count: number } }): string {
  const sectors = extractSectors(bill)
  const cosponsors = bill.cosponsors?.count || 0
  
  let summary = `This bill could impact ${sectors.join(', ')} sectors. `
  
  if (cosponsors > 50) {
    summary += `With ${cosponsors} cosponsors, it has strong bipartisan support and higher chances of passage. `
  } else if (cosponsors > 20) {
    summary += `With ${cosponsors} cosponsors, it has moderate support. `
  } else {
    summary += `With ${cosponsors} cosponsors, it currently has limited support. `
  }
  
  if (sectors.includes('Healthcare')) {
    summary += 'Healthcare providers and insurance companies should monitor compliance requirements. '
  }
  if (sectors.includes('Technology')) {
    summary += 'Tech companies may face new regulations or benefit from innovation incentives. '
  }
  if (sectors.includes('Energy')) {
    summary += 'Energy companies should assess potential costs and opportunities. '
  }
  
  summary += 'Full AI analysis will be available once the bill text is processed.'
  
  return summary
}