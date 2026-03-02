// /api/ghl-proxy.js
// Vercel Edge Function - Secure proxy for GHL API
// Add GHL_API_TOKEN and GHL_LOCATION_ID to Vercel environment variables

export const runtime = 'edge';

const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE = 'https://api.gohighlevel.com/v1';

export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { action, method = 'GET', endpoint, data } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build full URL with location ID
    const url = `${GHL_API_BASE}${endpoint}?locationId=${GHL_LOCATION_ID}`;

    // Prepare request options
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    // Add body if it's POST/PUT
    if ((method === 'POST' || method === 'PUT') && data) {
      options.body = JSON.stringify(data);
    }

    // Call GHL API
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseData }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}