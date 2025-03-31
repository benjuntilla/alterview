import { NextApiRequest, NextApiResponse } from 'next';
import { postToSupabase, fetchFromSupabase } from '../../services/supabaseService';

/**
 * Example API route that demonstrates using the Supabase service
 * 
 * POST: Creates a new record in the specified table
 * GET: Fetches records from the specified table
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the table name from the query parameters
  const { table } = req.query;
  
  if (!table || typeof table !== 'string') {
    return res.status(400).json({ error: 'Table name is required as a query parameter' });
  }
  
  try {
    // Handle different HTTP methods
    if (req.method === 'POST') {
      // Extract data from the request body
      const data = req.body;
      
      if (!data) {
        return res.status(400).json({ error: 'Request body is required' });
      }
      
      // Post data to Supabase
      const result = await postToSupabase(table, data);
      
      return res.status(201).json({ success: true, data: result });
    } 
    else if (req.method === 'GET') {
      // Extract query parameters
      const { filter, limit } = req.query;
      
      // Parse query parameters
      const query: any = {};
      
      if (filter && typeof filter === 'string') {
        try {
          query.filter = JSON.parse(filter);
        } catch (error) {
          return res.status(400).json({ error: 'Invalid filter parameter' });
        }
      }
      
      if (limit && typeof limit === 'string') {
        const parsedLimit = parseInt(limit);
        if (!isNaN(parsedLimit)) {
          query.limit = parsedLimit;
        }
      }
      
      // Fetch data from Supabase
      const data = await fetchFromSupabase(table, Object.keys(query).length > 0 ? query : undefined);
      
      return res.status(200).json({ success: true, data });
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in Supabase API route:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 