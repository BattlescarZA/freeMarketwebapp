const express = require('express');
const router = express.Router();

// Middleware to get Supabase client
const getSupabase = (req) => req.app.locals.supabase;

// Test Supabase connection
router.get('/test', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Test query to check if Supabase is connected
    const { data, error } = await supabase
      .from('assets')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data 
    });
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Supabase connection failed',
      error: error.message 
    });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const supabase = getSupabase(req);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'User registered successfully',
      user: data.user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabase = getSupabase(req);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      session: data.session,
      user: data.user 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Set the session
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw error;
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }
    
    res.json({ 
      success: true, 
      user: {
        ...user,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user',
      error: error.message 
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed',
      error: error.message 
    });
  }
});

module.exports = router;