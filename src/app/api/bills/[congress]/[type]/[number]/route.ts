import { NextRequest, NextResponse } from 'next/server'
import { congressApi, getBillStatus, estimateImpactLevel } from '@/lib/congress-api'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ congress: string; type: string; number: string }> }
) {
  const { congress, type, number } = await context.params;
  try {
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
    let summary = bill.title
    if (summaryResponse.status === 'fulfilled' && summaryResponse.value?.summaries) {
      const summaries = summaryResponse.value.summaries
      // Get the most recent summary
      const latestSummary = summaries
        .sort((a: { updateDate: string }, b: { updateDate: string }) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime())[0]
      
      if (latestSummary?.text) {
        summary = latestSummary.text
      }
    }

    // Process bill text
    let fullText = ''
    console.log(`🔍 [DEBUG] Processing bill text response...`)
    if (textResponse.status === 'fulfilled' && textResponse.value?.textVersions) {
      const textVersions = textResponse.value.textVersions
      console.log(`📋 [DEBUG] Found ${textVersions.length} text versions`)
      
      // Get the most recent text version
      const latestText = textVersions
        .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      
      console.log(`📄 [DEBUG] Latest text version:`, latestText)
      
      if (latestText?.formats) {
        console.log(`📎 [DEBUG] Found ${latestText.formats.length} formats in latest version`)
        
        // Try to get XML format first (more commonly available), then fallback to Formatted Text or PDF
        const textFormat = latestText.formats.find((f: { type: string }) => f.type === 'Formatted XML') || 
                          latestText.formats.find((f: { type: string }) => f.type === 'Formatted Text') ||
                          latestText.formats[0]
        
        console.log(`🎯 [DEBUG] Selected format:`, textFormat)
        
        if (textFormat?.url) {
          console.log(`🔗 [DEBUG] Fetching text from URL: ${textFormat.url}`)
          if (textFormat.url.includes('.xml')) {
            console.log(`✅ [DEBUG] CONFIRMED: Using .XML URL for bill text: ${textFormat.url}`)
          } else if (textFormat.url.includes('.htm')) {
            console.log(`✅ [DEBUG] CONFIRMED: Using .HTM URL for bill text: ${textFormat.url}`)
          } else if (textFormat.url.includes('.pdf')) {
            console.log(`✅ [DEBUG] CONFIRMED: Using .PDF URL for bill text: ${textFormat.url}`)
          }
          
          try {
            const textContent = await fetch(textFormat.url)
            fullText = await textContent.text()
            console.log(`📝 [DEBUG] Successfully fetched ${fullText.length} characters of bill text`)
          } catch (error) {
            console.warn('Failed to fetch bill text:', error)
          }
        } else {
          console.log(`❌ [DEBUG] No URL found in selected format`)
        }
      } else {
        console.log(`❌ [DEBUG] No formats found in latest text version`)
      }
    } else {
      console.log(`❌ [DEBUG] Text response not fulfilled or no textVersions found`)
      if (textResponse.status === 'rejected') {
        console.log(`❌ [DEBUG] Text response rejected:`, textResponse.reason)
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
      summary,
      fullText: fullText.slice(0, 10000), // Limit text size for now
      aiSummary: generateDetailedAISummary(bill),
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
      subjects: bill.subjects?.legislativeSubjects?.map((s: { name: string }) => s.name) || [],
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

function estimatePassageProbability(bill: { cosponsors?: { count: number }, originChamber?: string }, status: string): number {
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

function generateDetailedAISummary(bill: { subjects?: { legislativeSubjects?: Array<{ name: string }> }, title: string, cosponsors?: { count: number } }): string {
  const sectors = extractSectors(bill)
  const cosponsors = bill.cosponsors?.count || 0
  let aiSummary = `**Business Impact Analysis:**\n\n`
  
  // Sector impact
  aiSummary += `**Affected Sectors:** ${sectors.join(', ')}\n\n`
  
  // Political analysis
  if (cosponsors > 100) {
    aiSummary += `**Political Momentum:** Very High - This bill has exceptional bipartisan support with ${cosponsors} cosponsors, indicating strong likelihood of advancement.\n\n`
  } else if (cosponsors > 50) {
    aiSummary += `**Political Momentum:** High - With ${cosponsors} cosponsors, this bill has significant support and good chances of passage.\n\n`
  } else if (cosponsors > 20) {
    aiSummary += `**Political Momentum:** Moderate - ${cosponsors} cosponsors suggest decent support, but may face challenges.\n\n`
  } else {
    aiSummary += `**Political Momentum:** Low - With only ${cosponsors} cosponsors, this bill currently lacks broad support.\n\n`
  }
  
  // Compliance implications
  aiSummary += `**Compliance Considerations:**\n`
  if (sectors.includes('Healthcare')) {
    aiSummary += `• Healthcare organizations should prepare for potential new regulatory requirements\n`
    aiSummary += `• Health tech companies may need to update privacy and security practices\n`
  }
  if (sectors.includes('Technology')) {
    aiSummary += `• Tech companies should monitor for new data protection or AI governance requirements\n`
    aiSummary += `• Software providers may need to implement new compliance features\n`
  }
  if (sectors.includes('Finance')) {
    aiSummary += `• Financial institutions should assess impact on reporting and operational requirements\n`
    aiSummary += `• Fintech companies may face new regulatory oversight\n`
  }
  if (sectors.includes('Energy')) {
    aiSummary += `• Energy companies should evaluate environmental compliance and reporting changes\n`
    aiSummary += `• Renewable energy firms may benefit from new incentives or requirements\n`
  }
  
  aiSummary += `\n**Economic Impact:** Preliminary analysis suggests this legislation could affect market dynamics in ${sectors.join(', ')} sectors. Full financial modeling will be available once final bill text is processed.\n\n`
  
  aiSummary += `**Recommendation:** ${getRecommendation(bill, sectors, cosponsors)}`
  
  return aiSummary
}

function getRecommendation(bill: { cosponsors?: { count: number } }, sectors: string[], cosponsors: number): string {
  if (cosponsors > 50 && sectors.length > 2) {
    return 'High priority monitoring recommended. Begin preliminary compliance assessment and stakeholder engagement.'
  } else if (cosponsors > 20) {
    return 'Moderate priority. Monitor progress and prepare for potential impact assessment.'
  } else {
    return 'Low immediate priority, but continue monitoring for momentum changes.'
  }
}