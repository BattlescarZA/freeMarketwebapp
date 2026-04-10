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

// Get all portfolios for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      portfolios: portfolios || [] 
    });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get portfolios',
      error: error.message 
    });
  }
});

// Get portfolio by ID with holdings
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const portfolioId = req.params.id;
    const userId = req.user.id;
    
    // First verify the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();
    
    if (portfolioError) {
      if (portfolioError.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Portfolio not found' 
        });
      }
      throw portfolioError;
    }
    
    // Get holdings for this portfolio
    const { data: holdings, error: holdingsError } = await supabase
      .from('holdings')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('portfolio_id', portfolioId);
    
    if (holdingsError) {
      throw holdingsError;
    }
    
    // Get transactions for this portfolio
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('portfolio_id', portfolioId)
      .order('transaction_date', { ascending: false })
      .limit(50);
    
    if (transactionsError) {
      throw transactionsError;
    }
    
    // Calculate portfolio value
    let totalValue = 0;
    let totalCost = 0;
    
    if (holdings && holdings.length > 0) {
      holdings.forEach(holding => {
        // For demo, we'll use average cost as current price
        // In production, you'd fetch current prices from an API
        const currentValue = holding.quantity * holding.average_cost;
        totalValue += currentValue;
        totalCost += holding.quantity * holding.average_cost;
      });
    }
    
    const performance = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    
    res.json({ 
      success: true, 
      portfolio: {
        ...portfolio,
        holdings: holdings || [],
        transactions: transactions || [],
        summary: {
          totalValue,
          totalCost,
          performance,
          holdingCount: holdings?.length || 0,
          transactionCount: transactions?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get portfolio',
      error: error.message 
    });
  }
});

// Create a new portfolio
router.post('/', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { name, description, is_default } = req.body;
    
    // If this is set as default, unset any existing default
    if (is_default) {
      await supabase
        .from('portfolios')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }
    
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: name || 'New Portfolio',
        description: description || '',
        is_default: is_default || false
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Portfolio created successfully',
      portfolio 
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create portfolio',
      error: error.message 
    });
  }
});

// Update portfolio
router.put('/:id', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const { name, description, is_default } = req.body;
    
    // Verify the portfolio belongs to the user
    const { data: existingPortfolio, error: verifyError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      });
    }
    
    // If setting as default, unset any existing default
    if (is_default) {
      await supabase
        .from('portfolios')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', portfolioId);
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (is_default !== undefined) updates.is_default = is_default;
    
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .update(updates)
      .eq('id', portfolioId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Portfolio updated successfully',
      portfolio 
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update portfolio',
      error: error.message 
    });
  }
});

// Delete portfolio
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const portfolioId = req.params.id;
    const userId = req.user.id;
    
    // Verify the portfolio belongs to the user
    const { data: existingPortfolio, error: verifyError } = await supabase
      .from('portfolios')
      .select('id, is_default')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      });
    }
    
    // Don't allow deletion of default portfolio if it's the only one
    if (existingPortfolio.is_default) {
      const { data: otherPortfolios } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .neq('id', portfolioId);
      
      if (!otherPortfolios || otherPortfolios.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the only portfolio. Please create another portfolio first.' 
        });
      }
    }
    
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Portfolio deleted successfully' 
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete portfolio',
      error: error.message 
    });
  }
});

module.exports = router;