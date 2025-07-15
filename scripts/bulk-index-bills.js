// scripts/bulk-index-bills.js
const { Client } = require('@elastic/elasticsearch');
// Use dynamic import for node-fetch (ESM only)
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

async function fetchBills({ limit = 100, offset = 0, congress } = {}) {
  // Use congress in the URL path if provided
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

async function main() {
  const limit = 100;
  let offset = 0;
  let total = 0;
  let indexed = 0;
  let done = false;
  console.log('Starting bulk indexing of bills into Elasticsearch...');
  while (!done) {
    try {
      const response = await fetchBills({ limit, offset, congress: 119 });
      const bills = response.bills || [];
      if (bills.length === 0) {
        done = true;
        break;
      }
      const body = bills.flatMap(bill => [
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