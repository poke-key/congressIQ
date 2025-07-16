// scripts/bulk-index-bills.js
const { Client } = require('@elastic/elasticsearch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const esUrl = process.env.ELASTICSEARCH_URL;
const esApiKey = process.env.ELASTICSEARCH_API_KEY;
if (!esUrl || !esApiKey) {
  throw new Error('Elasticsearch environment variables are not set');
}

const client = new Client({
  node: esUrl,
  auth: {
    apiKey: esApiKey,
  },
});

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const CONGRESS_API_BASE_URL = process.env.CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3';

if (!CONGRESS_API_KEY) {
  console.error('Congress API key is required. Set CONGRESS_API_KEY in your .env file or environment.');
  process.exit(1);
}

async function fetchBills({ limit = 20, offset = 0, congress } = {}) {
  const url = new URL(`${CONGRESS_API_BASE_URL}/bill${congress ? `/${congress}` : ''}`);
  url.searchParams.append('api_key', CONGRESS_API_KEY);
  url.searchParams.append('format', 'json');
  url.searchParams.append('limit', limit);
  url.searchParams.append('offset', offset);
  url.searchParams.append('sort', 'updateDate');
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'CongressIQ/1.0' },
  });
  if (!res.ok) throw new Error(`Congress API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchBillDetail(congress, type, number, maxRetries = 5, retryDelay = 2000) {
  const endpoint = `${CONGRESS_API_BASE_URL}/bill/${congress}/${type}/${number}`;
  let attempt = 0;
  while (true) {
    const url = new URL(endpoint);
    url.searchParams.append('api_key', CONGRESS_API_KEY);
    url.searchParams.append('format', 'json');
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CongressIQ/1.0' },
    });
    if (res.status === 429) {
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(`Congress API rate limit exceeded after ${maxRetries} retries for bill detail.`);
      }
      const waitTime = retryDelay * Math.pow(2, attempt - 1);
      console.warn(`Rate limited on detail (429). Waiting ${waitTime / 1000}s before retrying (attempt ${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    if (!res.ok) throw new Error(`Congress API error (detail): ${res.status} ${res.statusText}`);
    return res.json();
  }
}

async function main() {
  const limit = 20;
  let offset = 0;
  let total = 0;
  let indexed = 0;
  let done = false;
  console.log('Starting bulk indexing of bills into Elasticsearch (with details)...');
  while (!done) {
    try {
      const response = await fetchBills({ limit, offset, congress: 119 });
      const bills = response.bills || [];
      if (bills.length === 0) {
        done = true;
        break;
      }
      // For each bill, fetch details and enrich
      const enrichedBills = [];
      for (const bill of bills) {
        // Parse type/number/congress for detail endpoint
        const congress = bill.congress;
        const type = bill.type;
        const number = bill.number;
        let sponsor = '';
        let introducedDate = '';
        try {
          const detail = await fetchBillDetail(congress, type, number);
          // Extract sponsor and introduced date
          sponsor = detail?.bill?.sponsors?.[0]?.fullName || '';
          introducedDate = detail?.bill?.introducedDate || '';
        } catch (err) {
          console.warn(`Failed to fetch details for ${type}${number}-${congress}:`, err.message);
        }
        // Add a delay between detail calls to avoid rate limit
        await new Promise(resolve => setTimeout(resolve, 1500));
        enrichedBills.push({
          ...bill,
          sponsor,
          introducedDate
        });
      }
      // Bulk index
      const body = enrichedBills.flatMap(bill => [
        { index: { _index: 'bills', _id: `${bill.type}${bill.number}-${bill.congress}` } },
        bill
      ]);
      const bulkResponse = await client.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.error('Bulk indexing errors:', bulkResponse.errors);
      }
      indexed += bills.length;
      total = response.pagination?.count || 0;
      console.log(`Indexed ${indexed}/${total} bills...`);
      offset += limit;
      // Add a delay between batches to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (indexed >= total) done = true;
    } catch (err) {
      console.error('Error during bulk indexing:', err);
      break;
    }
  }
  console.log('Bulk indexing complete.');
  process.exit(0);
}

main(); 