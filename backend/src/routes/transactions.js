const express = require('express');
const router = express.Router();

// Middleware to get Supabase client and authenticate user
const authenticate = async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

// Get transactions for a portfolio
router.get('/portfolio/:portfolioId', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const portfolioId = req.params.portfolioId;
    const userId = req.user.id;
    
    // Verify the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();
    
    if (portfolioError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      });
    }
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('portfolio_id', portfolioId)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      transactions: transactions || [] 
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get transactions',
      error: error.message 
    });
  }
});

// Create a new transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const {
      portfolio_id,
      asset_id,
      transaction_type,
      quantity,
      price,
      fees = 0,
      transaction_date,
      notes
    } = req.body;
    
    // Verify the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolio_id)
      .eq('user_id', userId)
      .single();
    
    if (portfolioError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      });
    }
    
    // Verify the asset exists
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id')
      .eq('id', asset_id)
      .single();
    
    if (assetError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }
    
    // Create the transaction
    // Note: The trigger in the database will automatically update holdings
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        portfolio_id,
        asset_id,
        transaction_type,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        fees: parseFloat(fees),
        transaction_date: transaction_date || new Date().toISOString(),
        notes
      })
      .select(`
        *,
        asset:assets(*)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Transaction created successfully',
      transaction 
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create transaction',
      error: error.message 
    });
  }
});

// Get transaction summary for a portfolio
router.get('/portfolio/:portfolioId/summary', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const portfolioId = req.params.portfolioId;
    const userId = req.user.id;
    const { start_date, end_date } = req.query;
    
    // Verify the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();
    
    if (portfolioError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      });
    }
    
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('portfolio_id', portfolioId);
    
    // Apply date filters if provided
    if (start_date) {
      query = query.gte('transaction_date', start_date);
    }
    
    if (end_date) {
      query = query.lte('transaction_date', end_date);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate summary
    let totalBuys = 0;
    let totalSells = 0;
    let totalFees = 0;
    
    transactions?.forEach(transaction => {
      const amount = transaction.quantity * transaction.price;
      
      if (transaction.transaction_type === 'buy') {
        totalBuys += amount;
      } else if (transaction.transaction_type === 'sell') {
        totalSells += amount;
      }
      
      totalFees += transaction.fees || 0;
    });
    
    const netFlow = totalSells - totalBuys;
    
    res.json({ 
      success: true, 
      summary: {
        totalBuys,
        totalSells,
        totalFees,
        netFlow,
        transactionCount: transactions?.length || 0,
        period: {
          start_date: start_date || 'all',
          end_date: end_date || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get transaction summary',
      error: error.message 
    });
  }
});

module.exports = router;