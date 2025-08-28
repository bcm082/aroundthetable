// Vercel serverless function to proxy The Odds API requests
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.VITE_ODDS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  try {
    const { endpoint, ...queryParams } = req.query;
    
    // Build the API URL
    const baseUrl = 'https://api.the-odds-api.com/v4';
    let apiUrl = `${baseUrl}/sports/americanfootball_nfl`;
    
    if (endpoint === 'odds') {
      apiUrl += '/odds';
    } else if (endpoint === 'scores') {
      apiUrl += '/scores';
    } else {
      res.status(400).json({ error: 'Invalid endpoint' });
      return;
    }

    // Add API key and other query parameters
    const urlParams = new URLSearchParams({
      apiKey,
      ...queryParams
    });

    const response = await fetch(`${apiUrl}?${urlParams}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
