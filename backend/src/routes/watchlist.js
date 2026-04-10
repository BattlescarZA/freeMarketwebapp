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

// Get user's watchlist
router.get('/', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    
    const { data: watchlist, error } = await supabase
      .from('watchlist')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      watchlist: watchlist || [] 
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get watchlist',
      error: error.message 
    });
  }
});

// Add asset to watchlist
router.post('/', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { asset_id, target_price, notes } = req.body;
    
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
    
    // Check if already in watchlist
    const { data: existing, error: checkError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('asset_id', asset_id)
      .single();
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset already in watchlist' 
      });
    }
    
    // Add to watchlist
    const { data: watchlistItem, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: userId,
        asset_id,
        target_price: target_price ? parseFloat(target_price) : null,
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
      message: 'Asset added to watchlist',
      watchlistItem 
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to watchlist',
      error: error.message 
    });
  }
});

// Remove asset from watchlist
router.delete('/:assetId', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const assetId = req.params.assetId;
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('asset_id', assetId);
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Asset removed from watchlist' 
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove from watchlist',
      error: error.message 
    });
  }
});

// Update watchlist item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const watchlistId = req.params.id;
    const { target_price, notes } = req.body;
    
    // Verify the watchlist item belongs to the user
    const { data: existing, error: verifyError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('id', watchlistId)
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Watchlist item not found' 
      });
    }
    
    const updates = {};
    if (target_price !== undefined) updates.target_price = parseFloat(target_price);
    if (notes !== undefined) updates.notes = notes;
    
    const { data: watchlistItem, error } = await supabase
      .from('watchlist')
      .update(updates)
      .eq('id', watchlistId)
      .select(`
        *,
        asset:assets(*)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Watchlist item updated',
      watchlistItem 
    });
  } catch (error) {
    console.error('Update watchlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update watchlist',
      error: error.message 
    });
  }
});

// Check if asset is in watchlist
router.get('/check/:assetId', authenticate, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const assetId = req.params.assetId;
    
    const { data: watchlistItem, error } = await supabase
      .from('watchlist')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('user_id', userId)
      .eq('asset_id', assetId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({ 
      success: true, 
      inWatchlist: !!watchlistItem,
      watchlistItem: watchlistItem || null
    });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check watchlist',
      error: error.message 
    });
  }
});

module.exports = router;