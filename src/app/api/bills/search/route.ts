// src/app/api/bills/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { congressApi, getBillStatus, estimateImpactLevel } from '@/lib/congress-api'
import { Client } from '@elastic/elasticsearch'
import type { Bill } from '@/lib/congress-api';

const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'kunnu138',
  },
  tls: {
    rejectUnauthorized: false,
  },
})

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

    // If query is present, use Elasticsearch
    if (query) {
      const esResult = await esClient.search({
        index: 'bills',
        from: offset,
        size: limit,
        query: {
          multi_match: {
            query,
            fields: ['title', 'summary', 'sponsor', 'aiSummary', 'sectors'],
            fuzziness: 'AUTO',
          },
        },
        sort: sort === 'introducedDate' ? [{ introducedDate: { order: 'desc' } }] : undefined,
      })
      // Defensive mapping for summary and aiSummary
      const bills = esResult.hits.hits.map((hit) => {
        const bill = hit._source as Bill | undefined;
        return {
          ...(bill || {}),
          summary: typeof bill?.summary === 'string' ? bill?.summary : '',
          aiSummary: typeof bill?.aiSummary === 'string' ? bill?.aiSummary : '',
        };
      });
      if (bills.length > 0) {
        console.log('First bill from ES:', bills[0]);
        console.log('Type of summary:', typeof bills[0].summary, 'Type of aiSummary:', typeof bills[0].aiSummary);
      } else {
        console.log('No bills returned from ES');
      }
      // Safely get total hits
      let totalHits = 0;
      if (typeof esResult.hits.total === 'number') {
        totalHits = esResult.hits.total;
      } else if (esResult.hits.total && typeof esResult.hits.total.value === 'number') {
        totalHits = esResult.hits.total.value;
      }
      return NextResponse.json({
        bills,
        pagination: { count: totalHits, limit, offset },
        query,
        total: totalHits,
      })
    }

    // Fallback: Use API pagination only, no client-side filtering
    const response = await congressApi.searchBills(query, {
      limit,
      offset,
      congress,
      chamber,
      billType,
      sort
    });
    const bills = response.bills || [];
    const transformedBills = bills.map(bill => {
      const sponsor = bill.sponsors?.[0]
      const status = getBillStatus(bill)
      const impactLevel = estimateImpactLevel(bill)
      
      return {
        id: `${bill.type}${bill.number}-${bill.congress}`,
        title: bill.title,
        shortTitle: `${bill.type.toUpperCase()}. ${bill.number}`,
        summary: typeof bill?.summary === 'string' ? bill?.summary : '',
        aiSummary: typeof bill?.aiSummary === 'string' ? bill?.aiSummary : '',
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