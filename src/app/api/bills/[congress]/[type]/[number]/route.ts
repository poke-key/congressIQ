import { NextRequest, NextResponse } from 'next/server'
import { congressApi, getBillStatus, estimateImpactLevel } from '@/lib/congress-api'

interface RouteParams {
  params: {
    congress: string
    type: string
    number: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { congress, type, number } = params
    const congressNum = parseInt(congress)

    console.log('Fetching bill details:', { congress: congressNum, type, number })

    // Fetch bill details
    const billResponse = await congressApi.getBill(congressNum, type, number)
    
    if (!billResponse.bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    const bill = billResponse.bill

    // Fetch additional data in parallel
    const [summaryResponse, textResponse] = await Promise.allSettled([
      congressApi.getBillSummary(congressNum, type, number),
      congressApi.getBillText(congressNum, type, number)
    ])

    // Process summaries
    let officialSummary = bill.title
    if (summaryResponse.status === 'fulfilled' && summaryResponse.value?.summaries) {
      const summaries = summaryResponse.value.summaries
      // Get the most recent summary
      const latestSummary = summaries
        .sort((a: any, b: any) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime())[0]
      
      if (latestSummary?.text) {
        officialSummary = latestSummary.text
      }
    }

    // Process bill text
    let fullText = ''
    if (textResponse.status === 'fulfilled' && textResponse.value?.textVersions) {
      const textVersions = textResponse.value.textVersions
      // Get the most recent text version
      const latestText = textVersions
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      
      if (latestText?.formats) {
        // Try to get text format, fallback to XML or PDF
        const textFormat = latestText.formats.find((f: any) => f.type === 'Formatted Text') || 
                          latestText.formats.find((f: any) => f.type === 'Formatted XML') ||
                          latestText.formats[0]
        
        if (textFormat?.url) {
          try {
            const textContent = await fetch(textFormat.url)
            fullText = await textContent.text()
          } catch (error) {
            console.warn('Failed to fetch bill text:', error)
          }
        }
      }
    }

    const sponsor = bill.sponsors?.[0]
    const status = getBillStatus(bill)
    const impactLevel = estimateImpactLevel(bill)

    // Transform the data
    const transformedBill = {
      id: `${bill.type}${bill.number}-${bill.congress}`,
      title: bill.title,
      shortTitle: `${bill.type.toUpperCase()}. ${bill.number}`,
      summary: officialSummary,
      fullText: fullText.slice(0, 10000), // Limit text size for now
      aiSummary: generateDetailedAISummary(bill, officialSummary),
      status,
      introducedDate: bill.introducedDate,
      sponsor: sponsor ? {
        name: sponsor.fullName,
        party: sponsor.party,
        state: sponsor.state,
        bioguideId: sponsor.bioguideId
      } : null,
      cosponsors: {
        count: bill.cosponsors?.count || 0,
        countIncludingWithdrawn: bill.cosponsors?.countIncludingWithdrawnCosponsors || 0
      },
      impactLevel,
      sectors: extractSectors(bill),
      probability: estimatePassageProbability(bill, status),
      url: bill.url,
      congress: bill.congress,
      type: bill.type,
      number: bill.number,
      originChamber: bill.originChamber,
      latestAction: bill.latestAction,
      subjects: bill.subjects?.legislativeSubjects || [],
      textVersions: bill.textVersions || [],
      relatedBills: [], // We can add this later
      amendments: [], // We can add this later
      actions: [] // We can fetch bill actions in a separate endpoint
    }

    return NextResponse.json({ bill: transformedBill })

  } catch (error) {
    console.error('Bill detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper functions (same as in search route, but we'll extract these to utils later)
function extractSectors(bill: any): string[] {
  const subjects = bill.subjects?.legislativeSubjects?.map((s: any) => s.name) || []
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

function estimatePassageProbability(bill: any, status: string): number {
  let baseProb = 15

  switch (status) {
    case 'Enacted': return 100
    case 'Passed Senate': return 85
    case 'Passed House': return 75
    case 'Committee Review': baseProb = 35; break
    case 'Introduced': baseProb = 15; break
    default: baseProb = 25
  }

  const cosponsors = bill.cosponsors?.count || 0
  if (cosponsors > 100) baseProb += 30
  else if (cosponsors > 50) baseProb += 20
  else if (cosponsors > 20) baseProb += 10
  else if (cosponsors > 5) baseProb += 5

  if (bill.originChamber === 'House' && cosponsors > 218) baseProb += 15
  if (bill.originChamber === 'Senate' && cosponsors > 51) baseProb += 15

  return Math.min(95, Math.max(5, baseProb))
}

function generateDetailedAISummary(bill: any, officialSummary: string): string {
  const sectors = extractSectors(bill)
  const cosponsors = bill.cosponsors?.count || 0
  const subjects = bill.subjects?.legislativeSubjects?.map((s: any) => s.name) || []
  
  let summary = `**Business Impact Analysis:**\n\n`
  
  // Sector impact
  summary += `**Affected Sectors:** ${sectors.join(', ')}\n\n`
  
  // Political analysis
  if (cosponsors > 100) {
    summary += `**Political Momentum:** Very High - This bill has exceptional bipartisan support with ${cosponsors} cosponsors, indicating strong likelihood of advancement.\n\n`
  } else if (cosponsors > 50) {
    summary += `**Political Momentum:** High - With ${cosponsors} cosponsors, this bill has significant support and good chances of passage.\n\n`
  } else if (cosponsors > 20) {
    summary += `**Political Momentum:** Moderate - ${cosponsors} cosponsors suggest decent support, but may face challenges.\n\n`
  } else {
    summary += `**Political Momentum:** Low - With only ${cosponsors} cosponsors, this bill currently lacks broad support.\n\n`
  }
  
  // Compliance implications
  summary += `**Compliance Considerations:**\n`
  if (sectors.includes('Healthcare')) {
    summary += `• Healthcare organizations should prepare for potential new regulatory requirements\n`
    summary += `• Health tech companies may need to update privacy and security practices\n`
  }
  if (sectors.includes('Technology')) {
    summary += `• Tech companies should monitor for new data protection or AI governance requirements\n`
    summary += `• Software providers may need to implement new compliance features\n`
  }
  if (sectors.includes('Finance')) {
    summary += `• Financial institutions should assess impact on reporting and operational requirements\n`
    summary += `• Fintech companies may face new regulatory oversight\n`
  }
  if (sectors.includes('Energy')) {
    summary += `• Energy companies should evaluate environmental compliance and reporting changes\n`
    summary += `• Renewable energy firms may benefit from new incentives or requirements\n`
  }
  
  summary += `\n**Economic Impact:** Preliminary analysis suggests this legislation could affect market dynamics in ${sectors.join(', ')} sectors. Full financial modeling will be available once final bill text is processed.\n\n`
  
  summary += `**Recommendation:** ${getRecommendation(bill, sectors, cosponsors)}`
  
  return summary
}

function getRecommendation(bill: any, sectors: string[], cosponsors: number): string {
  if (cosponsors > 50 && sectors.length > 2) {
    return 'High priority monitoring recommended. Begin preliminary compliance assessment and stakeholder engagement.'
  } else if (cosponsors > 20) {
    return 'Moderate priority. Monitor progress and prepare for potential impact assessment.'
  } else {
    return 'Low immediate priority, but continue monitoring for momentum changes.'
  }
}