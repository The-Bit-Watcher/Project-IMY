const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');
const path = require('path');
const cors = require("cors");
const highlight = require('highlight.js');

const app = express();
const PORT = process.env.PORT || 5000;

// const uri = process.env.MONGODB_URI || "mongodb+srv://shaunmarx05_db_user:shaun@imy220.eacjjp4.mongodb.net/codecollab?retryWrites=true&w=majority";
const uri = process.env.MONGODB_URI || "mongodb://admin:password@version-control-db:27017/codecollab?authSource=admin";
let db;
let client;

// ========== MIDDLEWARE CONFIGURATION ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
  origin: ["http://localhost:3000", "http://frontend:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://frontend:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('*', cors());

app.use(session({
  secret: 'codecollab-secret-key',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  },
  name: 'connect.sid',
  store: new (require('express-session').MemoryStore)()
}));

// Session debug middleware
app.use((req, res, next) => {
  console.log('🔐 SESSION DEBUG MIDDLEWARE:');
  console.log('  - Path:', req.path);
  console.log('  - Method:', req.method);
  console.log('  - Session ID:', req.sessionID);
  console.log('  - Session userId:', req.session.userId);
  console.log('  - Session exists:', !!req.session);
  console.log('  - Cookies present:', !!req.headers.cookie);
  console.log('  - Has connect.sid cookie:', req.headers.cookie && req.headers.cookie.includes('connect.sid'));
  
  if (req.headers.cookie) {
    console.log('  - All cookies:', req.headers.cookie);
  }
  
  next();
});

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' http://localhost:5000; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Session restoration middleware
app.use(async (req, res, next) => {
  if (req.path === '/api/auth/login' || req.path === '/api/auth/signup') {
    return next();
  }
  
  if (!req.session.userId && req.headers['x-user-id']) {
    console.log('🔄 Attempting to restore session from header');
    const userId = req.headers['x-user-id'];
    
    try {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { _id: 1 } }
      );
      
      if (user) {
        req.session.userId = userId;
        console.log('✅ Session restored for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error restoring session:', error);
    }
  }
  
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Version Control API Server is running', 
    timestamp: new Date().toISOString(),
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects'
    }
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Version Control API', 
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication middleware
function requireAuth(req, res, next){
  console.log('🔐 Auth check - Session:', req.session);
  console.log('🔐 Auth check - UserId in session:', req.session.userId);
  console.log('🔐 Auth check - Headers:', req.headers);
  
  if (!req.session.userId){
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
}

// Admin middleware - checks database for isAdmin field
function requireAdmin(req, res, next) {
  console.log('🔐 Admin check - Session userId:', req.session.userId);
  
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is admin in database
  db.collection('users').findOne(
    { _id: new ObjectId(req.session.userId) },
    { projection: { isAdmin: 1, email: 1, name: 1 } }
  ).then(user => {
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🔐 Admin check - User found:', user.name, 'isAdmin:', user.isAdmin);

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    req.user = user;
    next();
  }).catch(error => {
    console.error('❌ Error in admin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification'
    });
  });
}

// Helper functions for file type detection
function getLanguageFromExtension(extension) {
  const extensionMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.xml': 'xml',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.ps1': 'powershell',
    '.bat': 'batch',
    '.dockerfile': 'dockerfile',
    '.docker': 'dockerfile',
    '.yml': 'yaml',
    '.yaml': 'yaml'
  };
  
  return extensionMap[extension] || null;
}

function isTextFile(mimeType) {
  const textMimeTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml'
  ];
  
  return textMimeTypes.includes(mimeType);
}

function isCodeFile(extension) {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
    '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html',
    '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml',
    '.yml', '.md', '.sql', '.sh', '.bash', '.ps1', '.bat', '.dockerfile'
  ];
  
  return codeExtensions.includes(extension);
}

// ========== AUTHENTICATION ROUTES ==========

// app.post('/api/auth/login', async (req, res) => {
//   try{
//     const {email, password} = req.body;

//     if (!email || !password){
//       return res.status(400).json({
//         success: false,
//         message: "Email and Password required"
//       });
//     }

//     const user = await db.collection('users').findOne({email, password});

//     if (user){
//       req.session.userId = user._id.toString();
//       console.log('🔑 Login successful - Setting session userId:', req.session.userId);
//       console.log('🔑 User admin status:', user.isAdmin);

//       res.json({
//         success: true,
//         message: "Login success",
//         user: {
//           id: user._id,
//           email: user.email,
//           name: user.name,
//           profilePic: user.profilePic,
//           isAdmin: user.isAdmin || false
//         }
//       });
//     } else{
//       res.status(401).json({
//         success: false, 
//         message: "Invalid email or password"
//       });
//     }
//   }catch (error){
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login'
//     });
//   }
// });

app.post('/api/auth/login', async (req, res) => {
  try{
    const {email, password} = req.body;

    console.log('🔐 Login attempt for email:', email);
    console.log('🔐 Password provided:', password ? '***' + password.slice(-2) : 'none');

    if (!email || !password){
      return res.status(400).json({
        success: false,
        message: "Email and Password required"
      });
    }

    // Find user by email only first
    const user = await db.collection('users').findOne({email: email.trim().toLowerCase()});

    console.log('🔍 User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('🔍 Stored password:', user.password);
      console.log('🔍 Provided password:', password);
      console.log('🔍 Password match:', user.password === password);
    }

    if (user && user.password === password){
      req.session.userId = user._id.toString();
      console.log('✅ Login successful - Setting session userId:', req.session.userId);
      console.log('✅ User admin status:', user.isAdmin);

      res.json({
        success: true,
        message: "Login success",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          profilePic: user.profilePic,
          isAdmin: user.isAdmin || false
        }
      });
    } else{
      console.log('❌ Login failed - invalid credentials');
      res.status(401).json({
        success: false, 
        message: "Invalid email or password"
      });
    }
  }catch (error){
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and name are required'
      });
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const newUser = {
      email,
      password,
      name,
      profilePic: '',
      friends: [],
      friendRequests: [],
      sentFriendRequests: [],
      createdAt: new Date(),
      isAdmin: false,
      isVerified: false,
      verificationRequested: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    req.session.userId = result.insertedId.toString();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.insertedId,
        email: newUser.email,
        name: newUser.name,
        profilePic: newUser.profilePic
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during signup"
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    console.log('🔍 GET /api/auth/me - Session userId:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) }, 
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('✅ GET /api/auth/me - User found:', user.name, 'Admin:', user.isAdmin);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        skills: user.skills || [],
        location: user.location || '',
        website: user.website || '',
        createdAt: user.createdAt,
        friends: user.friends || [],
        updatedAt: user.updatedAt || user.createdAt,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error("❌ Error in GET /api/auth/me:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ========== USER MANAGEMENT ROUTES ==========

app.get('/api/users/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    console.log('🔍 GET /api/users/me - Session userId:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) }, 
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('✅ GET /api/users/me - User found:', user.name, 'Admin:', user.isAdmin);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        skills: user.skills || [],
        location: user.location || '',
        website: user.website || '',
        createdAt: user.createdAt,
        friends: user.friends || [],
        updatedAt: user.updatedAt || user.createdAt,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error("❌ Error in GET /api/users/me:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.put('/api/users/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateData = req.body;

    console.log('🔐 Session userId:', userId);
    console.log('📝 Update data received:', updateData);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated - no session found"
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.password;
    delete updateData.isAdmin;
    delete updateData.email;
    delete updateData.createdAt;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Format skills properly if it's a string
    if (typeof updateData.skills === 'string') {
      updateData.skills = updateData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    console.log('🔄 Updating user with data:', updateData);

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    console.log('📊 MongoDB result:', result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made"
      });
    }

    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    console.log('✅ Profile updated successfully for user:', updatedUser._id);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic || '',
        bio: updatedUser.bio || '',
        skills: updatedUser.skills || [],
        location: updatedUser.location || '',
        website: updatedUser.website || '',
        createdAt: updatedUser.createdAt,
        friends: updatedUser.friends || [],
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Error in /api/users/me PUT:", error);
    res.status(500).json({
      success: false,
      message: "Server error during update: " + error.message
    });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) }, 
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        skills: user.skills || [],
        location: user.location || '',
        website: user.website || '',
        createdAt: user.createdAt,
        friends: user.friends || [],
        updatedAt: user.updatedAt || user.createdAt
      }
    });
  } catch (error) {
    console.error("Error in /api/users/:id:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.get('/api/users/bulk', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "User IDs are required"
      });
    }

    const userIds = Array.isArray(ids) ? ids : ids.split(',');
    const validIds = userIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    const users = await db.collection('users')
      .find({ _id: { $in: validIds } })
      .project({ password: 0 })
      .toArray();

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio || '',
        skills: user.skills || [],
        location: user.location || '',
        website: user.website || '',
        createdAt: user.createdAt,
        friends: user.friends || []
      }))
    });
  } catch (error) {
    console.error("Error in /api/users/bulk:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.get('/api/users/:userId/friends', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await db.collection('users').findOne(
      {_id: new ObjectId(userId)},
      {projection: {friends: 1}}
    );
    
    const friendIds = user?.friends || [];
    const friends = await db.collection('users').find(
      {_id: {$in: friendIds}},
      {projection: {password: 0}}
    ).toArray();

    res.json({
      success: true,
      friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/api/users/:userId/projects', async (req, res) => {
  try {
    const userId = req.params.userId;
    const projects = await db.collection('projects').find({
      $or: [
        {owner: new ObjectId(userId)},
        {members: new ObjectId(userId)}
      ]
    }).toArray();

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/api/users/:userId/languages', async (req, res) => {
  try {
    res.json({
      success: true,
      languages: []
    });
  } catch (error) {
    console.error("Error in /api/users/:userId/languages:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try{
    const userId = req.params.id;

    if (userId !== req.session.userId){
      return res.status(403).json({
        success: false, 
        message: "Not authorized to delete"
      });
    }

    const result = await db.collection('users').deleteOne(
      { _id: new ObjectId(userId) }
    );

    if (result.deletedCount === 0){
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.session.destroy();
    res.json({
      success: true, 
      message: "User deleted successfully"
    });
  }catch (error){
    res.status(500).json({
      success: false, 
      message: "Server error"
    });
  }
});

// Simple profile update endpoint
app.put('/api/users/update-profile', async (req, res) => {
  try {
    const { userId, updateData } = req.body;
    
    console.log('🔄 Simple profile update request');
    console.log('👤 User ID from request:', userId);
    console.log('📝 Update data:', updateData);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (!updateData || !updateData.name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    // Remove any protected fields
    const cleanUpdateData = { ...updateData };
    delete cleanUpdateData._id;
    delete cleanUpdateData.password;
    delete cleanUpdateData.isAdmin;
    delete cleanUpdateData.email;

    // Add updatedAt timestamp
    cleanUpdateData.updatedAt = new Date();

    // Format skills properly
    if (cleanUpdateData.skills && typeof cleanUpdateData.skills === 'string') {
      cleanUpdateData.skills = cleanUpdateData.skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);
    }

    console.log('💾 Updating user in database...');

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(String(userId)) },
      { $set: cleanUpdateData }
    );

    console.log('📊 Database update result:', result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made"
      });
    }

    // Get the updated user
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { password: 0 } }
    );

    console.log('✅ Profile updated successfully');

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic || '',
        bio: updatedUser.bio || '',
        skills: updatedUser.skills || [],
        location: updatedUser.location || '',
        website: updatedUser.website || '',
        createdAt: updatedUser.createdAt,
        friends: updatedUser.friends || [],
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error during update: " + error.message
    });
  }
});

// ========== FRIEND SYSTEM ROUTES ==========

app.post('/api/friends/request', async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: "Friend ID is required"
      });
    }

    if (friendId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself"
      });
    }

    // Check if users exist
    const [user, friend] = await Promise.all([
      db.collection('users').findOne({ _id: new ObjectId(userId) }),
      db.collection('users').findOne({ _id: new ObjectId(friendId) })
    ]);

    if (!user || !friend) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already friends
    if (user.friends && user.friends.some(f => f.toString() === friendId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user"
      });
    }

    // Check if request already sent
    if (user.sentFriendRequests && user.sentFriendRequests.some(req => req.toString() === friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent"
      });
    }

    // Check if you have a pending request from this user
    if (user.friendRequests && user.friendRequests.some(req => req.toString() === friendId)) {
      return res.status(400).json({
        success: false,
        message: "This user has already sent you a friend request. Please check your incoming requests."
      });
    }

    // Add to user's sent requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $addToSet: { sentFriendRequests: new ObjectId(friendId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Add to friend's incoming requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(friendId) },
      { 
        $addToSet: { friendRequests: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`📤 Friend request sent: ${userId} -> ${friendId}`);

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

app.post('/api/friends/accept', async (req, res) => {
  try {
    const { requesterId } = req.body;
    const userId = req.session.userId;

    if (!requesterId) {
      return res.status(400).json({
        success: false,
        message: "Requester ID is required"
      });
    }

    // Get current user
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    // Check if request exists
    if (!user.friendRequests || !user.friendRequests.some(req => req.toString() === requesterId)) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found"
      });
    }

    // Remove from friend requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { friendRequests: new ObjectId(requesterId) },
        $addToSet: { friends: new ObjectId(requesterId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Remove from requester's sent requests and add to friends
    await db.collection('users').updateOne(
      { _id: new ObjectId(requesterId) },
      { 
        $pull: { sentFriendRequests: new ObjectId(userId) },
        $addToSet: { friends: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ Friend request accepted: ${requesterId} <-> ${userId}`);

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Decline friend request
app.post('/api/friends/decline', async (req, res) => {
  try {
    const { requesterId } = req.body;
    const userId = req.session.userId;

    if (!requesterId) {
      return res.status(400).json({
        success: false,
        message: "Requester ID is required"
      });
    }

    // Remove from friend requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { friendRequests: new ObjectId(requesterId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Remove from requester's sent requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(requesterId) },
      { 
        $pull: { sentFriendRequests: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`❌ Friend request declined: ${requesterId} -> ${userId}`);

    res.json({
      success: true,
      message: 'Friend request declined successfully'
    });
  } catch (error) {
    console.error("Error declining friend request:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Cancel sent friend request
app.post('/api/friends/cancel', async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: "Friend ID is required"
      });
    }

    // Remove from user's sent requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { sentFriendRequests: new ObjectId(friendId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Remove from friend's incoming requests
    await db.collection('users').updateOne(
      { _id: new ObjectId(friendId) },
      { 
        $pull: { friendRequests: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`🚫 Friend request cancelled: ${userId} -> ${friendId}`);

    res.json({
      success: true,
      message: 'Friend request cancelled successfully'
    });
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get friend requests (incoming)
app.get('/api/friends/requests', async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { friendRequests: 1 } }
    );

    const requestIds = user?.friendRequests || [];
    
    // Get user details for each request
    const requests = await Promise.all(
      requestIds.map(async (requesterId) => {
        const requester = await db.collection('users').findOne(
          { _id: requesterId },
          { projection: { name: 1, email: 1, profilePic: 1, bio: 1 } }
        );
        return {
          id: requesterId,
          name: requester?.name || 'Unknown User',
          email: requester?.email,
          profilePic: requester?.profilePic,
          bio: requester?.bio
        };
      })
    );

    res.json({
      success: true,
      requests: requests.filter(req => req.name !== 'Unknown User')
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get sent friend requests
app.get('/api/friends/sent-requests', async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { sentFriendRequests: 1 } }
    );

    const sentRequestIds = user?.sentFriendRequests || [];
    
    // Get user details for each sent request
    const sentRequests = await Promise.all(
      sentRequestIds.map(async (friendId) => {
        const friend = await db.collection('users').findOne(
          { _id: friendId },
          { projection: { name: 1, email: 1, profilePic: 1, bio: 1 } }
        );
        return {
          id: friendId,
          name: friend?.name || 'Unknown User',
          email: friend?.email,
          profilePic: friend?.profilePic,
          bio: friend?.bio
        };
      })
    );

    res.json({
      success: true,
      sentRequests: sentRequests.filter(req => req.name !== 'Unknown User')
    });
  } catch (error) {
    console.error("Error getting sent friend requests:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.delete('/api/friends/remove', async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    console.log('🗑️ Removing friend:', { userId, friendId });

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: "Friend ID is required"
      });
    }

    // Get users before removal for debugging
    const [userBefore, friendBefore] = await Promise.all([
      db.collection('users').findOne({ _id: new ObjectId(userId) }),
      db.collection('users').findOne({ _id: new ObjectId(friendId) })
    ]);

    console.log('📊 Before removal - User friends:', userBefore?.friends?.map(f => f.toString()));
    console.log('📊 Before removal - Friend friends:', friendBefore?.friends?.map(f => f.toString()));

    // Remove friend from current user's friends
    const userResult = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { friends: new ObjectId(friendId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Remove current user from friend's friends
    const friendResult = await db.collection('users').updateOne(
      { _id: new ObjectId(friendId) },
      { 
        $pull: { friends: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    console.log('📊 Remove results:', { 
      userModified: userResult.modifiedCount,
      friendModified: friendResult.modifiedCount 
    });

    // Get users after removal for debugging
    const [userAfter, friendAfter] = await Promise.all([
      db.collection('users').findOne({ _id: new ObjectId(userId) }),
      db.collection('users').findOne({ _id: new ObjectId(friendId) })
    ]);

    console.log('📊 After removal - User friends:', userAfter?.friends?.map(f => f.toString()));
    console.log('📊 After removal - Friend friends:', friendAfter?.friends?.map(f => f.toString()));

    res.json({
      success: true,
      message: "Friend removed successfully",
      debug: {
        userModified: userResult.modifiedCount,
        friendModified: friendResult.modifiedCount,
        userFriendsAfter: userAfter?.friends?.length || 0,
        friendFriendsAfter: friendAfter?.friends?.length || 0
      }
    });

  } catch (error) {
    console.error("❌ Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "Server error during friend removal: " + error.message
    });
  }
});

// ========== PROJECT MANAGEMENT ROUTES ==========

app.get('/api/projects', async (req, res) => {
  try{
    const projects = await db.collection('projects').find().toArray();
    res.json({
      success: true,
      projects
    });
  }catch (error){
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, hashtags, files, type } = req.body;
    const userId = req.session.userId;

    console.log('🆕 Creating new project:', { name, description, hashtags, files, type });

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Project name and description are required"
      });
    }

    // AUTO-HASHTAG GENERATION
    let autoGeneratedHashtags = [];
    if (files && files.length > 0) {
      const extensionToLanguage = {
        '.js': 'javascript',
        '.jsx': 'react',
        '.ts': 'typescript',
        '.tsx': 'react',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cplusplus',
        '.c': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'sass',
        '.sql': 'sql',
        '.json': 'json',
        '.xml': 'xml'
      };

      files.forEach(file => {
        const fileName = file.name || '';
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        const language = extensionToLanguage[extension];
        if (language && !autoGeneratedHashtags.includes(language)) {
          autoGeneratedHashtags.push(language);
        }
      });
    }

    console.log('🏷️ Auto-generated hashtags:', autoGeneratedHashtags);

    // Combine manual and auto hashtags
    const manualHashtags = Array.isArray(hashtags) ? hashtags : 
                          (hashtags ? hashtags.split(',').map(tag => tag.trim()).filter(tag => tag) : []);
    
    const allHashtags = [...new Set([...manualHashtags, ...autoGeneratedHashtags])];
    console.log('🏷️ All hashtags:', allHashtags);

    const newProject = {
      name: name.trim(),
      description: description.trim(),
      type: type || 'web-application',
      hashtags: allHashtags,
      files: files || [],
      owner: new ObjectId(String(userId)),
      members: [new ObjectId(String(userId))],
      isCheckedOut: false,
      checkedOutBy: null,
      version: '1.0.0',
      checkins: [],
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Saving project to database...');
    const result = await db.collection('projects').insertOne(newProject);

    // Create checkin activity for project creation
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: result.insertedId,
      action: "checked in",
      message: `Created new ${type || 'web-application'}: ${name}`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Project created and checkin activity recorded');

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: {
        id: result.insertedId,
        ...newProject
      }
    });
  } catch (error) {
    console.error("❌ Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Server error during project creation: " + error.message
    });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try{
    const projectId = req.params.id;
    const project = await db.collection('projects').findOne({
      _id : new ObjectId(projectId)
    });

    if (!project){
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true, 
      project
    });
  }catch (error){
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { name, description, hashtags, version, type } = req.body;

    console.log('✏️ Updating project:', projectId);

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { owner: new ObjectId(String(userId)) },
        { members: new ObjectId(String(userId)) }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to update it"
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (hashtags) updateData.hashtags = Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (version) updateData.version = version;
    if (type) updateData.type = type;

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found or no changes made"
      });
    }

    // Create checkin activity for project update
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "updated",
      message: `Updated ${type || project.type} project details${version ? ` to version ${version}` : ''}`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Project updated and checkin activity recorded');

    res.json({
      success: true,
      message: "Project updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Server error during project update: " + error.message
    });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.userId;

    console.log('🗑️ Deleting project:', projectId);

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      owner: new ObjectId(String(userId))
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to delete it"
      });
    }

    // Create checkin activity for project deletion
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "deleted",
      message: `Deleted project: ${project.name}`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);

    const result = await db.collection('projects').deleteOne({
      _id: new ObjectId(projectId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('✅ Project deleted and checkin activity recorded');

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: 'Server error during project deletion'
    });
  }
});

// ========== PROJECT FILE MANAGEMENT ROUTES ==========

app.post('/api/projects/:projectId/files', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { files } = req.body;

    console.log('📁 Adding files to project:', projectId);
    console.log('📄 Files to add:', files?.length || 0);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided"
      });
    }

    for (const file of files) {
      if (!file.name || !file.type || !file.content) {
        return res.status(400).json({
          success: false,
          message: "Each file must have name, type, and content properties"
        });
      }

      const base64Size = (file.content.length * 3) / 4;
      if (base64Size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `File ${file.name} exceeds 10MB size limit`
        });
      }
    }

    const fileMetadata = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size || Buffer.from(file.content, 'base64').length,
      content: file.content,
      uploadedBy: new ObjectId(String(userId)),
      uploadDate: new Date()
    }));

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $push: { files: { $each: fileMetadata } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Create checkin activity for file upload
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "updated",
      message: `Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Files added and checkin activity recorded');

    res.json({
      success: true,
      message: "Files added successfully",
      files: fileMetadata.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
  } catch (error) {
    console.error("❌ Error adding files:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file addition: " + error.message
    });
  }
});

app.get('/api/projects/:projectId/files/:fileIndex', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const fileIndex = parseInt(req.params.fileIndex);
    
    console.log('📥 Getting file:', { projectId, fileIndex });

    const project = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) },
      { projection: { files: 1 } }
    );

    if (!project || !project.files || !project.files[fileIndex]) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const file = project.files[fileIndex];
    
    res.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        content: file.content,
        uploadDate: file.uploadDate
      }
    });
  } catch (error) {
    console.error("❌ Error getting file:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting file"
    });
  }
});

// ========== PROJECT IMAGE ROUTES ==========

app.post('/api/projects/:projectId/image', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { image } = req.body;

    console.log('🖼️ Uploading project image:', projectId);

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image provided"
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileSizeInMB = buffer.length / (1024 * 1024);

    console.log(`📊 Image size: ${fileSizeInMB.toFixed(2)}MB`);

    if (fileSizeInMB > 2) {
      return res.status(400).json({
        success: false,
        message: "Image exceeds 2MB size limit. Please use a smaller image."
      });
    }

    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format"
      });
    }

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: { 
          image: {
            content: image,
            uploadDate: new Date(),
            size: fileSizeInMB
          },
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Create checkin activity for image upload
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "updated",
      message: "Updated project image",
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Project image uploaded and checkin activity recorded');

    res.json({
      success: true,
      message: "Project image uploaded successfully"
    });
  } catch (error) {
    console.error("❌ Error uploading project image:", error);
    res.status(500).json({
      success: false,
      message: "Server error during image upload: " + error.message
    });
  }
});

// ========== PROJECT VERSION CONTROL ROUTES ==========

app.post('/api/projects/:projectId/checkout', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;

    console.log('🔒 Checking out project:', projectId);

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { owner: new ObjectId(String(userId)) },
        { members: new ObjectId(String(userId)) }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to check it out"
      });
    }

    if (project.isCheckedOut && project.checkedOutBy.toString() !== userId) {
      return res.status(409).json({
        success: false,
        message: "Project is already checked out by another user"
      });
    }

    const newCheckoutStatus = !project.isCheckedOut;
    const checkoutUser = newCheckoutStatus ? new ObjectId(String(userId)) : null;

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: { 
          isCheckedOut: newCheckoutStatus,
          checkedOutBy: checkoutUser,
          updatedAt: new Date()
        }
      }
    );

    // Create checkin activity for checkout/checkin
    const action = newCheckoutStatus ? "checked out" : "checked in";
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: action,
      message: `${action} project for editing`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log(`✅ Project ${action} and checkin activity recorded`);

    res.json({
      success: true,
      message: `Project ${action} successfully`,
      isCheckedOut: newCheckoutStatus
    });
  } catch (error) {
    console.error("❌ Error during checkout:", error);
    res.status(500).json({
      success: false,
      message: "Server error during checkout: " + error.message
    });
  }
});

// ========== PROJECT COMMENTS ROUTES ==========

app.post('/api/projects/:projectId/comments', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { comment } = req.body;

    console.log('💬 Adding comment to project:', projectId);

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required"
      });
    }

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Create checkin activity for comment
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "commented",
      message: comment.trim(),
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    const result = await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Comment added and checkin activity recorded');

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: {
        id: result.insertedId,
        ...checkinData
      }
    });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error during comment addition: " + error.message
    });
  }
});

// ========== ACTIVITY FEED ROUTES ==========

// Get global file activities (all files from all projects)
app.get('/api/activity/global', async (req, res) => {
  try {
    console.log('🌍 Global file activity request');
    
    // Get current user ID from session
    let currentUserId = req.session.userId;
    let excludedUserIds = [];

    if (currentUserId && ObjectId.isValid(currentUserId)) {
      console.log('👤 Current user detected:', currentUserId);
      
      // Get current user's friends to exclude them
      const currentUser = await db.collection('users').findOne(
        { _id: new ObjectId(currentUserId) },
        { projection: { friends: 1 } }
      );
      
      if (currentUser && currentUser.friends) {
        // Add current user and their friends to exclusion list
        excludedUserIds = [new ObjectId(currentUserId), ...currentUser.friends.map(id => new ObjectId(id))];
        console.log('🚫 Excluding users from global feed:', excludedUserIds.map(id => id.toString()));
      } else {
        excludedUserIds = [new ObjectId(currentUserId)];
        console.log('🚫 Excluding only current user from global feed');
      }
    } else {
      console.log('👤 No current user session - showing all activities in global feed');
    }

    // Get ALL projects with files
    const projects = await db.collection('projects')
      .find({ 
        'files.0': { $exists: true } // Projects that have at least one file
      })
      .project({
        name: 1,
        description: 1,
        image: 1,
        files: 1,
        owner: 1,
        members: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ updatedAt: -1 })
      .toArray();

    console.log(`📁 Found ${projects.length} projects with files`);

    // Flatten all files with project context
    const allFiles = [];
    
    for (const project of projects) {
      if (project.files && project.files.length > 0) {
        // Get project owner info
        let owner = null;
        let ownerId = null;
        
        if (project.owner && ObjectId.isValid(project.owner)) {
          try {
            owner = await db.collection('users').findOne(
              { _id: new ObjectId(project.owner) },
              { projection: { name: 1, email: 1, profilePic: 1 } }
            );
            ownerId = project.owner;
          } catch (error) {
            console.error(`   ❌ Error fetching owner:`, error);
          }
        }

        // Process each file in the project
        for (const file of project.files) {
          // Check if this file should be excluded
          if (file.uploadedBy && excludedUserIds.length > 0) {
            const isExcluded = excludedUserIds.some(excludedId => 
              excludedId.toString() === file.uploadedBy.toString()
            );
            if (isExcluded) {
              console.log(`   🚫 Excluding file ${file.name} - uploaded by excluded user`);
              continue; // Skip file
            }
          }

          // Get file uploader info
          let uploader = null;
          let uploaderId = null;
          
          if (file.uploadedBy && ObjectId.isValid(file.uploadedBy)) {
            try {
              uploader = await db.collection('users').findOne(
                { _id: new ObjectId(file.uploadedBy) },
                { projection: { name: 1, email: 1, profilePic: 1 } }
              );
              uploaderId = file.uploadedBy;
            } catch (error) {
              console.error(`   ❌ Error fetching uploader:`, error);
            }
          }

          // Determine the display user
          const displayUser = uploader || owner;
          const displayUserId = uploaderId || ownerId;
          const displayUserName = displayUser?.name || 'Unknown User';
          const displayUserAvatar = displayUser?.profilePic;

          allFiles.push({
            _id: `${project._id}-${file.name}`,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadDate: file.uploadDate || project.updatedAt,
            projectId: project._id,
            projectName: project.name,
            projectDescription: project.description,
            projectImage: project.image,
            ownerName: displayUserName,
            ownerAvatar: displayUserAvatar,
            ownerId: displayUserId
          });
        }
      }
    }
    
    // Sort by upload date (newest first)
    allFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    console.log(`📄 Global feed files: ${allFiles.length}`);
    
    res.json({ 
      success: true, 
      files: allFiles.slice(0, 100),
      stats: {
        totalFiles: allFiles.length,
        excludedUsers: excludedUserIds.length,
        currentUser: currentUserId
      }
    });
    
  } catch (error) {
    console.error('❌ Error in global file activity:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/activity/local', async (req, res) => {
  try {
    console.log('🏠 Local activity request received');
    console.log('🔐 Session userId:', req.session.userId);
    
    // Get user ID from session
    let userId = req.session.userId;
    
    if (!userId) {
      console.log('👤 No user ID found - local feed requires authentication');
      return res.json({ 
        success: true, 
        activities: [],
        message: 'Authentication required for local feed'
      });
    }

    // Validate user ID format
    if (!ObjectId.isValid(userId)) {
      console.log('❌ Invalid user ID format:', userId);
      return res.json({ 
        success: true, 
        activities: [],
        message: 'Invalid user ID format'
      });
    }

    const userObjectId = new ObjectId(userId);
    console.log('👤 Processing LOCAL feed for user:', userId);

    // Get user with friends
    const user = await db.collection('users').findOne(
      { _id: userObjectId },
      { projection: { friends: 1, name: 1, email: 1 } }
    );
    
    if (!user) {
      console.log('❌ User not found in database:', userId);
      return res.json({ 
        success: true, 
        activities: [],
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.name);
    console.log('👥 Friends count:', user.friends ? user.friends.length : 0);

    // Get ONLY user and friends
    const friendIds = user.friends ? user.friends.map(friendId => {
      try {
        return new ObjectId(friendId.toString());
      } catch (e) {
        console.log('❌ Invalid friend ID:', friendId);
        return null;
      }
    }).filter(id => id !== null) : [];

    const includedUserIds = [userObjectId, ...friendIds];
    
    console.log('✅ LOCAL feed - INCLUDING users:', includedUserIds.map(id => id.toString()));

    // Get projects owned ONLY by user and friends
    const projects = await db.collection('projects')
      .find({
        $or: [
          { owner: { $in: includedUserIds } },
          { members: { $in: includedUserIds } }
        ]
      })
      .toArray();

    console.log(`📁 Found ${projects.length} projects for LOCAL feed (user + friends only)`);

    const projectIds = projects.map(project => project._id);

    // Get checkin activities
    const checkinActivities = await db.collection('checkins')
      .aggregate([
        {
          $match: {
            projectId: { $in: projectIds }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: 100
        }
      ])
      .toArray();

    console.log(`📊 Checkin activities found: ${checkinActivities.length}`);

    //Get file upload activities from projects
    const fileActivities = [];
    
    for (const project of projects) {
      if (project.files && project.files.length > 0) {
        // Get project owner info
        let projectOwner = null;
        if (project.owner && ObjectId.isValid(project.owner)) {
          projectOwner = await db.collection('users').findOne(
            { _id: new ObjectId(project.owner) },
            { projection: { name: 1, profilePic: 1 } }
          );
        }

        // Process each file in the project
        for (const file of project.files) {
          // Get file uploader info
          let fileUploader = null;
          if (file.uploadedBy && ObjectId.isValid(file.uploadedBy)) {
            fileUploader = await db.collection('users').findOne(
              { _id: new ObjectId(file.uploadedBy) },
              { projection: { name: 1, profilePic: 1 } }
            );
          }

          // Use file uploader if available, otherwise use project owner
          const displayUser = fileUploader || projectOwner;
          
          // Only include if the uploader is in our included users
          const uploaderId = fileUploader?._id || projectOwner?._id;
          if (uploaderId && includedUserIds.some(id => id.toString() === uploaderId.toString())) {
            fileActivities.push({
              _id: `${project._id}-${file.name}`, // Unique ID for file activity
              message: `Uploaded file: ${file.name}`,
              action: 'uploaded',
              timestamp: file.uploadDate || project.updatedAt,
              likes: 0,
              downloads: 0,
              files: [file], // Include the file for download
              userId: {
                _id: uploaderId,
                name: displayUser?.name || 'Unknown User',
                profilePic: displayUser?.profilePic
              },
              projectId: {
                _id: project._id,
                name: project.name,
                image: project.image,
                owner: project.owner
              },
              _source: 'file_upload' // Mark as file upload activity
            });
          }
        }
      }
    }

    console.log(`📄 File upload activities found: ${fileActivities.length}`);

    // Combine both types of activities
    const allActivities = [...checkinActivities, ...fileActivities];
    
    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter activities to ensure they're only from user or friends
    const filteredActivities = allActivities.filter(activity => {
      if (!activity.userId) return false;
      
      const activityUserId = activity.userId._id ? activity.userId._id.toString() : activity.userId.toString();
      const isFromIncludedUser = includedUserIds.some(id => 
        id.toString() === activityUserId
      );
      
      return isFromIncludedUser;
    });

    console.log(`🎯 Total LOCAL activities (checkins + files): ${filteredActivities.length}`);

    // Format the activities for frontend
    const formattedActivities = filteredActivities.map(activity => {
      // Handle both checkin activities and file upload activities
      if (activity._source === 'file_upload') {

        return activity;
      } else {
        // This is a checkin activity
        return {
          _id: activity._id,
          message: activity.message,
          action: activity.action,
          timestamp: activity.timestamp,
          likes: activity.likes || 0,
          downloads: activity.downloads || 0,
          files: activity.files || [],
          userId: activity.user && activity.user[0] ? {
            _id: activity.user[0]._id,
            name: activity.user[0].name,
            profilePic: activity.user[0].profilePic
          } : null,
          projectId: activity.project && activity.project[0] ? {
            _id: activity.project[0]._id,
            name: activity.project[0].name,
            image: activity.project[0].image,
            owner: activity.project[0].owner
          } : null
        };
      }
    });

    res.json({ 
      success: true, 
      activities: formattedActivities,
      debug: {
        userId,
        userName: user.name,
        friendCount: friendIds.length,
        projectCount: projects.length,
        checkinActivities: checkinActivities.length,
        fileActivities: fileActivities.length,
        totalActivities: formattedActivities.length,
        includedUsers: includedUserIds.map(id => id.toString())
      }
    });
    
  } catch (error) {
    console.error('❌ Error in local activity endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get activity for specific project
app.get('/api/projects/:projectId/activity', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log('📋 Project activity request for:', projectId);
    
    const activities = await db.collection('checkins')
      .aggregate([
        {
          $match: {
            projectId: new ObjectId(projectId)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: 50
        },
        {
          $project: {
            _id: 1,
            message: 1,
            action: 1,
            timestamp: 1,
            likes: 1,
            downloads: 1,
            files: 1,
            'user._id': 1,
            'user.name': 1,
            'user.profilePic': 1
          }
        }
      ])
      .toArray();

    // Format the activities
    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      message: activity.message,
      action: activity.action,
      timestamp: activity.timestamp,
      likes: activity.likes || 0,
      downloads: activity.downloads || 0,
      files: activity.files || [],
      userId: activity.user && activity.user[0] ? {
        _id: activity.user[0]._id,
        name: activity.user[0].name,
        profilePic: activity.user[0].profilePic
      } : null
    }));

    res.json({ 
      success: true, 
      activities: formattedActivities 
    });
  } catch (error) {
    console.error('❌ Error in project activity endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create new activity
app.post('/api/activity', async (req, res) => {
  try {
    const { userId, projectId, message, files, type } = req.body;
    
    const newActivity = {
      userId: new ObjectId(String(userId)),
      projectId: projectId ? new ObjectId(String(projectId)) : null,
      message: message,
      files: files || [],
      type: type || 'general',
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };
    
    const result = await db.collection('checkins').insertOne(newActivity);
    
    // Get the created activity with populated data
    const createdActivity = await db.collection('checkins')
      .aggregate([
        {
          $match: { _id: result.insertedId }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        }
      ])
      .next();

    res.json({ 
      success: true, 
      activity: createdActivity 
    });
  } catch (error) {
    console.error('❌ Error creating activity:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/activity/feed', async (req, res) => {
  try {
    const activities = await db.collection('checkins').find().sort({timestamp:-1}).toArray();
    res.json({
      success: true,
      activities
    });
  } catch(error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.get('/api/users/:userId/activity', async (req, res) => {
  try {
    const userId = req.params.userId;
    const activities = await db.collection('checkins').find({
      userId: new ObjectId(userId)
    }).sort({timestamp: -1}).toArray();

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.post('/api/activity/:activityId/like', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const userId = req.session.userId;

    console.log('👍 Liking activity:', activityId);

    const activity = await db.collection('checkins').findOne({
      _id: new ObjectId(activityId)
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    const newLikes = (activity.likes || 0) + 1;

    const result = await db.collection('checkins').updateOne(
      { _id: new ObjectId(activityId) },
      { $set: { likes: newLikes } }
    );

    console.log('✅ Activity liked');

    res.json({
      success: true,
      message: "Activity liked successfully",
      likes: newLikes
    });
  } catch (error) {
    console.error("❌ Error liking activity:", error);
    res.status(500).json({
      success: false,
      message: "Server error during like operation"
    });
  }
});

// ========== SEARCH FUNCTIONALITY ROUTES ==========

// General search (users and projects)
app.get('/api/search/all', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    console.log('🔍 Search request for:', query);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search users
    const users = await db.collection('users').find({
      $or: [
        { name: { $regex: query, $options: 'i' }},
        { email: { $regex: query, $options: 'i' }}
      ]
    }, { projection: { password: 0 } }).toArray();

    // Search projects
    const projects = await db.collection('projects').find({
      $or: [
        { name: { $regex: query, $options: 'i' }},
        { description: { $regex: query, $options: 'i' }},
        { hashtags: { $in: [new RegExp(query, 'i')] }}
      ]
    }).toArray();

    // Search activities/checkins
    const activities = await db.collection('checkins')
      .aggregate([
        {
          $match: {
            message: { $regex: query, $options: 'i' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: 20
        }
      ])
      .toArray();

    console.log(`📊 Search results - Users: ${users.length}, Projects: ${projects.length}, Activities: ${activities.length}`);

    res.json({
      success: true,
      results: {
        users,
        projects,
        activities
      }
    });

  } catch (error) {
    console.error('❌ Error in general search:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

//route for dynamic activity types
app.get('/api/activity/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { sort } = req.query;
    
    console.log(`📊 Dynamic activity request: ${type}, sort: ${sort}`);
    
    if (type === 'global') {
      // Call your existing global logic
      const projects = await db.collection('projects')
        .find({ 'files.0': { $exists: true } })
        .project({ name: 1, description: 1, image: 1, files: 1, owner: 1, createdAt: 1, updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .toArray();

      const allFiles = [];
      for (const project of projects) {
        if (project.files && project.files.length > 0) {
          const owner = await db.collection('users').findOne(
            { _id: project.owner },
            { projection: { name: 1, profilePic: 1 } }
          );
          
          project.files.forEach(file => {
            allFiles.push({
              _id: file._id || `${project._id}-${file.name}`,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              uploadDate: file.uploadDate || project.updatedAt,
              projectId: project._id,
              projectName: project.name,
              projectDescription: project.description,
              projectImage: project.image,
              ownerName: owner?.name || 'Unknown User',
              ownerAvatar: owner?.profilePic
            });
          });
        }
      }
      
      allFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      res.json({ 
        success: true, 
        files: allFiles.slice(0, 50)
      });
      
    } else if (type === 'local') {
      // Call your existing local logic
      let userId = req.session.userId;
      if (!userId && req.headers['x-user-id']) {
        userId = req.headers['x-user-id'];
      }
      
      if (!userId) {
        return res.json({ 
          success: true, 
          activities: [],
          message: 'No user session found'
        });
      }     
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type. Use "global" or "local"'
      });
    }
  } catch (error) {
    console.error('❌ Error in dynamic activity endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/activity/local-fixed', async (req, res) => {
  try {
    console.log('🏠 FIXED Local activity request received');
    
    let userId = req.session.userId;
    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }
    
    if (!userId) {
      return res.json({ 
        success: true, 
        activities: [],
        message: 'No user session found'
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.json({ 
        success: true, 
        activities: [],
        message: 'Invalid user ID format'
      });
    }

    const userObjectId = new ObjectId(userId);

    // Get user with friends
    const user = await db.collection('users').findOne(
      { _id: userObjectId },
      { projection: { friends: 1, name: 1 } }
    );
    
    if (!user) {
      return res.json({ 
        success: true, 
        activities: [],
        message: 'User not found'
      });
    }

    // Get valid friend IDs
    const friendIds = user.friends ? user.friends.map(friendId => {
      try {
        return new ObjectId(friendId.toString());
      } catch (e) {
        return null;
      }
    }).filter(id => id !== null) : [];

    const relevantUserIds = [userObjectId, ...friendIds];

    console.log('👤 User:', userId);
    console.log('👥 Friend IDs:', friendIds.map(id => id.toString()));
    console.log('📋 All relevant user IDs:', relevantUserIds.map(id => id.toString()));

    // Get ALL projects from relevant users (both owned and where they're members)
    const projects = await db.collection('projects')
      .find({
        $or: [
          { owner: { $in: relevantUserIds } },
          { members: { $in: relevantUserIds } }
        ]
      })
      .toArray();

    console.log(`📁 Found ${projects.length} total relevant projects`);

    const projectIds = projects.map(project => project._id);
    
    console.log('🔍 Looking for activities in projects:', projectIds.map(id => id.toString()));

    // Get activities from these projects with detailed population
    const activities = await db.collection('checkins')
      .aggregate([
        {
          $match: {
            projectId: { $in: projectIds }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: 100
        }
      ])
      .toArray();

    console.log(`📊 Found ${activities.length} total activities`);

    const formattedActivities = activities.map(activity => {
      const userData = activity.user && activity.user[0] ? {
        _id: activity.user[0]._id,
        name: activity.user[0].name,
        profilePic: activity.user[0].profilePic
      } : {
        _id: activity.userId,
        name: 'Unknown User',
        profilePic: null
      };

      const projectData = activity.project && activity.project[0] ? {
        _id: activity.project[0]._id,
        name: activity.project[0].name,
        image: activity.project[0].image,
        owner: activity.project[0].owner
      } : {
        _id: activity.projectId,
        name: 'Unknown Project',
        image: null,
        owner: null
      };

      const isFriendActivity = friendIds.some(fid => 
        fid.toString() === userData._id?.toString()
      );

      return {
        _id: activity._id,
        message: activity.message,
        action: activity.action,
        timestamp: activity.timestamp,
        likes: activity.likes || 0,
        downloads: activity.downloads || 0,
        files: activity.files || [],
        userId: userData,
        projectId: projectData,
        _debug: {
          isYourActivity: userData._id.toString() === userId,
          isFriendActivity: isFriendActivity,
          projectOwner: projectData.owner?.toString(),
          activityUserId: activity.userId?.toString()
        }
      };
    });

    // Count friend activities
    const friendActivities = formattedActivities.filter(a => a._debug.isFriendActivity);
    console.log(`👥 Found ${friendActivities.length} friend activities`);
    
    friendActivities.forEach(activity => {
      console.log(`🎯 Friend Activity: ${activity.userId.name} - ${activity.message} - Project: ${activity.projectId.name}`);
    });

    res.json({ 
      success: true, 
      activities: formattedActivities,
      debug: {
        userId,
        friendCount: friendIds.length,
        projectCount: projects.length,
        totalActivities: activities.length,
        friendActivityCount: friendActivities.length,
        friendActivities: friendActivities.map(a => ({
          user: a.userId.name,
          message: a.message,
          project: a.projectId.name
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error in fixed local activity endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ========== ADMIN ROUTES ==========

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await db.collection('users')
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalUsers = await db.collection('users').countDocuments(query);

    res.json({
      success: true,
      users: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error in admin users endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Get all projects (admin only)
app.get('/api/admin/projects', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', type = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add type filtering
    if (type) {
      query.type = type;
    }

    const projects = await db.collection('projects')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalProjects = await db.collection('projects').countDocuments(query);

    // Populate owner names
    const ownerIds = [...new Set(projects.map(p => p.owner))];
    const owners = await db.collection('users')
      .find({ _id: { $in: ownerIds } })
      .project({ name: 1, email: 1 })
      .toArray();

    const ownerMap = Object.fromEntries(owners.map(o => [o._id.toString(), o]));

    const projectsWithOwners = projects.map(project => ({
      ...project,
      ownerName: ownerMap[project.owner.toString()]?.name || 'Unknown User',
      ownerEmail: ownerMap[project.owner.toString()]?.email || 'Unknown Email'
    }));

    res.json({
      success: true,
      projects: projectsWithOwners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalProjects,
        pages: Math.ceil(totalProjects / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error in admin projects endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects'
    });
  }
});

// Get all activities (admin only)
app.get('/api/admin/activities', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (type !== 'all') {
      query = { action: type };
    }

    const activities = await db.collection('checkins')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $sort: { timestamp: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ])
      .toArray();

    const totalActivities = await db.collection('checkins').countDocuments(query);

    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      message: activity.message,
      action: activity.action,
      timestamp: activity.timestamp,
      likes: activity.likes || 0,
      downloads: activity.downloads || 0,
      userId: activity.user && activity.user[0] ? {
        _id: activity.user[0]._id,
        name: activity.user[0].name,
        email: activity.user[0].email
      } : null,
      projectId: activity.project && activity.project[0] ? {
        _id: activity.project[0]._id,
        name: activity.project[0].name
      } : null
    }));

    res.json({
      success: true,
      activities: formattedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalActivities,
        pages: Math.ceil(totalActivities / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error in admin activities endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activities'
    });
  }
});

// Admin delete user
app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.session.userId;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Delete user's projects
    await db.collection('projects').deleteMany({ owner: new ObjectId(userId) });

    // Remove user from other projects as member
    await db.collection('projects').updateMany(
      { members: new ObjectId(userId) },
      { $pull: { members: new ObjectId(userId) } }
    );

    // Delete user's activities
    await db.collection('checkins').deleteMany({ userId: new ObjectId(userId) });

    // Remove user from friends lists
    await db.collection('users').updateMany(
      { friends: new ObjectId(userId) },
      { $pull: { friends: new ObjectId(userId) } }
    );

    // Remove user from friend requests
    await db.collection('users').updateMany(
      { 
        $or: [
          { friendRequests: new ObjectId(userId) },
          { sentFriendRequests: new ObjectId(userId) }
        ]
      },
      { 
        $pull: { 
          friendRequests: new ObjectId(userId),
          sentFriendRequests: new ObjectId(userId)
        }
      }
    );

    // Finally delete the user
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

    console.log(`🗑️ Admin ${adminId} deleted user ${userId}`);

    res.json({
      success: true,
      message: "User and all associated data deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// Admin delete project
app.delete('/api/admin/projects/:projectId', requireAdmin, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Delete project activities
    await db.collection('checkins').deleteMany({ projectId: new ObjectId(projectId) });

    // Delete the project
    await db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });

    console.log(`🗑️ Admin deleted project ${projectId}`);

    res.json({
      success: true,
      message: "Project and all associated activities deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project'
    });
  }
});

// Admin delete activity
app.delete('/api/admin/activities/:activityId', requireAdmin, async (req, res) => {
  try {
    const activityId = req.params.activityId;

    const result = await db.collection('checkins').deleteOne({ _id: new ObjectId(activityId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    console.log(`🗑️ Admin deleted activity ${activityId}`);

    res.json({
      success: true,
      message: "Activity deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting activity'
    });
  }
});

// Admin update user
app.put('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;

    // Remove protected fields
    delete updateData._id;
    delete updateData.password;
    delete updateData.createdAt;

    updateData.updatedAt = new Date();

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made"
      });
    }

    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// Admin update project
app.put('/api/admin/projects/:projectId', requireAdmin, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const updateData = req.body;

    // Remove protected fields
    delete updateData._id;
    delete updateData.owner;
    delete updateData.createdAt;

    updateData.updatedAt = new Date();

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found or no changes made"
      });
    }

    const updatedProject = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) }
    );

    res.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project'
    });
  }
});

// Admin dashboard statistics
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalActivities,
      recentUsers,
      recentProjects
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('projects').countDocuments(),
      db.collection('checkins').countDocuments(),
      db.collection('users')
        .find({}, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      db.collection('projects')
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProjects,
        totalActivities,
        recentUsers,
        recentProjects
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// Admin make user admin
app.post('/api/admin/users/:userId/make-admin', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isAdmin: true, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`👑 Admin granted to user ${userId}`);

    res.json({
      success: true,
      message: "User granted admin privileges successfully"
    });
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error granting admin privileges'
    });
  }
});

// Admin remove admin privileges
app.post('/api/admin/users/:userId/remove-admin', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.session.userId;

    // Prevent admin from removing their own admin privileges
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin privileges"
      });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isAdmin: false, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`👑 Admin privileges removed from user ${userId}`);

    res.json({
      success: true,
      message: "Admin privileges removed successfully"
    });
  } catch (error) {
    console.error('❌ Error removing admin privileges:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing admin privileges'
    });
  }
});

// ========== PROJECT TYPE MANAGEMENT ROUTES ==========

async function initializeProjectTypes() {
  try {
    const defaultTypes = [
      { 
        name: 'web-application', 
        description: 'Web-based applications', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'mobile-application', 
        description: 'Mobile apps for iOS/Android', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'desktop-application', 
        description: 'Desktop software applications', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'framework', 
        description: 'Code frameworks and libraries', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'library', 
        description: 'Code libraries and packages', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'plugin', 
        description: 'Plugins and extensions', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'tool', 
        description: 'Development tools and utilities', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'game', 
        description: 'Games and interactive media', 
        category: 'entertainment',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'api', 
        description: 'APIs and web services', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'cli-tool', 
        description: 'Command line tools', 
        category: 'development',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Check if projectTypes collection exists and has data
    const existingTypes = await db.collection('projectTypes').countDocuments();
    
    if (existingTypes === 0) {
      console.log('📝 Initializing default project types...');
      await db.collection('projectTypes').insertMany(defaultTypes);
      console.log('✅ Default project types created');
    }
  } catch (error) {
    console.error('❌ Error initializing project types:', error);
  }
}

// Get all project types
app.get('/api/admin/project-types', requireAdmin, async (req, res) => {
  try {
    const types = await db.collection('projectTypes')
      .find()
      .sort({ name: 1 })
      .toArray();

    res.json({
      success: true,
      types
    });
  } catch (error) {
    console.error('❌ Error fetching project types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project types'
    });
  }
});

// Create new project type
app.post('/api/admin/project-types', requireAdmin, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
    }

    // Check if type already exists
    const existingType = await db.collection('projectTypes').findOne({
      name: name.toLowerCase().replace(/\s+/g, '-')
    });

    if (existingType) {
      return res.status(409).json({
        success: false,
        message: 'Project type already exists'
      });
    }

    const newType = {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      category: category.toLowerCase(),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('projectTypes').insertOne(newType);

    res.status(201).json({
      success: true,
      message: 'Project type created successfully',
      type: {
        _id: result.insertedId,
        ...newType
      }
    });
  } catch (error) {
    console.error('❌ Error creating project type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project type'
    });
  }
});

// Update project type
app.put('/api/admin/project-types/:typeId', requireAdmin, async (req, res) => {
  try {
    const typeId = req.params.typeId;
    const { name, description, category } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
    }

    // Check if type exists and is not default
    const existingType = await db.collection('projectTypes').findOne({
      _id: new ObjectId(typeId)
    });

    if (!existingType) {
      return res.status(404).json({
        success: false,
        message: 'Project type not found'
      });
    }

    if (existingType.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify default project types'
      });
    }

    const updateData = {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      category: category.toLowerCase(),
      updatedAt: new Date()
    };

    const result = await db.collection('projectTypes').updateOne(
      { _id: new ObjectId(typeId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project type not found or no changes made'
      });
    }

    res.json({
      success: true,
      message: 'Project type updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating project type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project type'
    });
  }
});

// Delete project type
app.delete('/api/admin/project-types/:typeId', requireAdmin, async (req, res) => {
  try {
    const typeId = req.params.typeId;

    // Check if type exists and is not default
    const existingType = await db.collection('projectTypes').findOne({
      _id: new ObjectId(typeId)
    });

    if (!existingType) {
      return res.status(404).json({
        success: false,
        message: 'Project type not found'
      });
    }

    if (existingType.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default project types'
      });
    }

    // Check if any projects are using this type
    const projectsUsingType = await db.collection('projects').countDocuments({
      type: existingType.name
    });

    if (projectsUsingType > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete project type. ${projectsUsingType} project(s) are using this type.`
      });
    }

    const result = await db.collection('projectTypes').deleteOne({
      _id: new ObjectId(typeId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project type not found'
      });
    }

    res.json({
      success: true,
      message: 'Project type deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting project type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project type'
    });
  }
});

// Get project type statistics
app.get('/api/admin/project-types/stats', requireAdmin, async (req, res) => {
  try {
    // Get project counts by type
    const projectCounts = await db.collection('projects').aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get all types
    const types = await db.collection('projectTypes').find().toArray();

    // Combine types with their project counts
    const typesWithStats = types.map(type => {
      const countData = projectCounts.find(pc => pc._id === type.name);
      return {
        ...type,
        projectCount: countData ? countData.count : 0
      };
    });

    res.json({
      success: true,
      types: typesWithStats
    });
  } catch (error) {
    console.error('❌ Error fetching project type stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project type statistics'
    });
  }
});

// Get project types (admin can add more later)
app.get('/api/project-types', (req, res) => {
  const defaultTypes = [
    'web-application',
    'mobile-application',
    'desktop-application', 
    'framework',
    'library',
    'plugin',
    'tool',
    'game',
    'api',
    'cli-tool'
  ];
  
  res.json({
    success: true,
    types: defaultTypes
  });
});

// ========== ENHANCED FILE DISPLAY ROUTES ==========

// Serve static files for syntax highlighting CSS
app.use('/api/files/static', express.static(path.join(__dirname, 'node_modules/highlight.js/styles')));

// Get file content with syntax highlighting
app.get('/api/projects/:projectId/files/:fileIndex/content', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const fileIndex = parseInt(req.params.fileIndex);
    
    console.log('📄 Getting file content with highlighting:', { projectId, fileIndex });

    const project = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) },
      { projection: { files: 1, name: 1 } }
    );

    if (!project || !project.files || !project.files[fileIndex]) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const file = project.files[fileIndex];
    
    // Decode base64 content
    const fileContent = Buffer.from(file.content, 'base64').toString('utf8');
    
    // Get file extension for syntax highlighting
    const fileExtension = path.extname(file.name).toLowerCase();
    const language = getLanguageFromExtension(fileExtension);
    
    let highlightedContent = fileContent;
    let languageDetected = 'plaintext';
    
    if (language && highlight.getLanguage(language)) {
      try {
        highlightedContent = highlight.highlight(fileContent, { language }).value;
        languageDetected = language;
      } catch (error) {
        console.log('⚠️ Could not highlight with specific language, using auto-detect');
        try {
          const result = highlight.highlightAuto(fileContent);
          highlightedContent = result.value;
          languageDetected = result.language || 'plaintext';
        } catch (autoError) {
          highlightedContent = fileContent;
        }
      }
    } else {
      try {
        const result = highlight.highlightAuto(fileContent);
        highlightedContent = result.value;
        languageDetected = result.language || 'plaintext';
      } catch (autoError) {
        highlightedContent = fileContent;
      }
    }

    res.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        content: fileContent,
        highlightedContent: highlightedContent,
        language: languageDetected,
        extension: fileExtension,
        uploadDate: file.uploadDate,
        projectName: project.name
      }
    });
  } catch (error) {
    console.error("❌ Error getting file content:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting file content"
    });
  }
});

// Get file preview
app.get('/api/projects/:projectId/files/:fileIndex/preview', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const fileIndex = parseInt(req.params.fileIndex);
    
    console.log('👀 Getting file preview:', { projectId, fileIndex });

    const project = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) },
      { projection: { files: 1, name: 1 } }
    );

    if (!project || !project.files || !project.files[fileIndex]) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const file = project.files[fileIndex];
    const fileExtension = path.extname(file.name).toLowerCase();
    const language = getLanguageFromExtension(fileExtension);
    
    // Get first few lines for preview
    const fileContent = Buffer.from(file.content, 'base64').toString('utf8');
    const previewLines = fileContent.split('\n').slice(0, 10).join('\n');
    const totalLines = fileContent.split('\n').length;

    res.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExtension,
        language: language,
        preview: previewLines,
        totalLines: totalLines,
        uploadDate: file.uploadDate,
        projectName: project.name,
        hasMoreLines: totalLines > 10
      }
    });
  } catch (error) {
    console.error("❌ Error getting file preview:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting file preview"
    });
  }
});

// Get all files in a project with enhanced info
app.get('/api/projects/:projectId/files-enhanced', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    console.log('📁 Getting enhanced file list for project:', projectId);

    const project = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) },
      { projection: { files: 1, name: 1 } }
    );

    if (!project || !project.files) {
      return res.json({
        success: true,
        files: []
      });
    }

    const enhancedFiles = project.files.map((file, index) => {
      const fileExtension = path.extname(file.name).toLowerCase();
      const language = getLanguageFromExtension(fileExtension);
      
      // Get basic file info without full content
      const fileContent = Buffer.from(file.content, 'base64').toString('utf8');
      const lineCount = fileContent.split('\n').length;
      const characterCount = fileContent.length;
      
      return {
        index: index,
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExtension,
        language: language,
        lineCount: lineCount,
        characterCount: characterCount,
        uploadDate: file.uploadDate,
        uploadedBy: file.uploadedBy,
        canPreview: isTextFile(file.type) || isCodeFile(fileExtension)
      };
    });

    res.json({
      success: true,
      files: enhancedFiles,
      projectName: project.name
    });
  } catch (error) {
    console.error("❌ Error getting enhanced file list:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting file list"
    });
  }
});

// Get available syntax highlighting themes
app.get('/api/files/themes', (req, res) => {
  const themes = [
    'default', 'github', 'github-dark', 'vs', 'vs2015', 'xcode', 'androidstudio',
    'atom-one-dark', 'atom-one-light', 'monokai', 'solarized-dark', 'solarized-light',
    'tomorrow', 'tomorrow-night', 'zenburn'
  ];
  
  res.json({
    success: true,
    themes: themes
  });
});

// Update the existing file upload endpoint to include language detection
app.post('/api/projects/:projectId/files-enhanced', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { files } = req.body;

    console.log('📁 Adding files with enhanced metadata:', projectId);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided"
      });
    }

    const fileMetadata = files.map(file => {
      const fileExtension = path.extname(file.name).toLowerCase();
      const language = getLanguageFromExtension(fileExtension);
      const fileContent = file.content;
      const textContent = Buffer.from(fileContent, 'base64').toString('utf8');
      const lineCount = textContent.split('\n').length;
      const characterCount = textContent.length;
      
      return {
        name: file.name,
        type: file.type,
        size: file.size || Buffer.from(fileContent, 'base64').length,
        content: fileContent,
        extension: fileExtension,
        language: language,
        lineCount: lineCount,
        characterCount: characterCount,
        uploadedBy: new ObjectId(String(userId)),
        uploadDate: new Date(),
        canPreview: isTextFile(file.type) || isCodeFile(fileExtension)
      };
    });

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $push: { files: { $each: fileMetadata } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Create checkin activity for file upload
    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "updated",
      message: `Uploaded ${files.length} file(s) with enhanced preview: ${files.map(f => f.name).join(', ')}`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);
    console.log('✅ Enhanced files added and checkin activity recorded');

    res.json({
      success: true,
      message: "Files added successfully with enhanced metadata",
      files: fileMetadata.map(f => ({ 
        name: f.name, 
        type: f.type, 
        size: f.size,
        extension: f.extension,
        language: f.language,
        lineCount: f.lineCount,
        canPreview: f.canPreview
      }))
    });
  } catch (error) {
    console.error("❌ Error adding enhanced files:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file addition: " + error.message
    });
  }
});

// ========== ENHANCED SEARCH ROUTES ==========

// Advanced search with fuzzy matching and filters
app.get('/api/search/advanced', async (req, res) => {
  try {
    const { 
      q: query, 
      type, 
      category, 
      tags, 
      sort = 'relevance',
      limit = 20 
    } = req.query;
    
    console.log('🔍 Advanced search request:', { query, type, category, tags, sort, limit });

    if (!query && !type && !category && !tags) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }

    // Build search query with fuzzy matching
    let searchQuery = {};
    let orConditions = [];

    // Text search with fuzzy matching
    if (query && query.trim()) {
      const searchTerms = query.trim().split(/\s+/);
      
      const textConditions = searchTerms.map(term => ({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { hashtags: { $in: [new RegExp(term, 'i')] } }
        ]
      }));

      orConditions.push(...textConditions);
    }

    // Project type filter
    if (type) {
      orConditions.push({ type: type });
    }

    // Category filter (from project types)
    if (category) {
      // Get project types in this category
      const typesInCategory = await db.collection('projectTypes').find({
        category: category
      }).toArray();
      
      const typeNames = typesInCategory.map(t => t.name);
      if (typeNames.length > 0) {
        orConditions.push({ type: { $in: typeNames } });
      }
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      orConditions.push({ 
        hashtags: { $in: tagArray.map(tag => new RegExp(tag, 'i')) } 
      });
    }

    if (orConditions.length > 0) {
      searchQuery.$or = orConditions;
    }

    console.log('📋 Final search query:', JSON.stringify(searchQuery));

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'relevance':
      default:
        // For relevance, we'll sort by text match score and recency
        sortOptions = { updatedAt: -1, createdAt: -1 };
        break;
    }

    // Execute search
    const projects = await db.collection('projects')
      .find(searchQuery)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .toArray();

    // Get users for user search
    const users = query ? await db.collection('users').find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }, { projection: { password: 0 } }).toArray() : [];

    console.log(`📊 Advanced search results - Projects: ${projects.length}, Users: ${users.length}`);

    res.json({
      success: true,
      results: {
        projects,
        users,
        totalResults: projects.length + users.length
      },
      filters: {
        query,
        type,
        category,
        tags,
        sort,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during advanced search'
    });
  }
});

// Autocomplete suggestions endpoint
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;
    
    console.log('💡 Autocomplete request:', { query, type });

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = [];

    // Project name suggestions
    if (type === 'all' || type === 'projects') {
      const projectSuggestions = await db.collection('projects')
        .find({
          name: { $regex: query, $options: 'i' }
        })
        .project({ name: 1, type: 1, _id: 1 })
        .limit(5)
        .toArray();

      suggestions.push(...projectSuggestions.map(p => ({
        type: 'project',
        id: p._id,
        name: p.name,
        display: p.name,
        category: p.type || 'project'
      })));
    }

    // User name suggestions
    if (type === 'all' || type === 'users') {
      const userSuggestions = await db.collection('users')
        .find({
          name: { $regex: query, $options: 'i' }
        })
        .project({ name: 1, email: 1, _id: 1 })
        .limit(5)
        .toArray();

      suggestions.push(...userSuggestions.map(u => ({
        type: 'user',
        id: u._id,
        name: u.name,
        display: u.name,
        category: 'user'
      })));
    }

    // Tag suggestions
    if (type === 'all' || type === 'tags') {
      // Get unique hashtags that match the query
      const tagSuggestions = await db.collection('projects').aggregate([
        { $unwind: '$hashtags' },
        { 
          $match: { 
            hashtags: { $regex: query, $options: 'i' } 
          } 
        },
        { 
          $group: { 
            _id: '$hashtags',
            count: { $sum: 1 }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();

      suggestions.push(...tagSuggestions.map(t => ({
        type: 'tag',
        id: t._id,
        name: t._id,
        display: `#${t._id}`,
        category: 'tag'
      })));
    }

    // Project type suggestions
    if (type === 'all' || type === 'types') {
      const typeSuggestions = await db.collection('projectTypes')
        .find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();

      suggestions.push(...typeSuggestions.map(t => ({
        type: 'project_type',
        id: t._id,
        name: t.name,
        display: t.description,
        category: 'type'
      })));
    }

    console.log(`💡 Generated ${suggestions.length} suggestions`);

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10)
    });

  } catch (error) {
    console.error('❌ Error in autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during autocomplete'
    });
  }
});

// Get search filters and metadata
app.get('/api/search/filters', async (req, res) => {
  try {
    // Get all project types for filter dropdown
    const projectTypes = await db.collection('projectTypes')
      .find()
      .sort({ name: 1 })
      .toArray();

    // Get popular tags
    const popularTags = await db.collection('projects').aggregate([
      { $unwind: '$hashtags' },
      { 
        $group: { 
          _id: '$hashtags',
          count: { $sum: 1 }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();

    // Get categories from project types
    const categories = await db.collection('projectTypes').distinct('category');

    res.json({
      success: true,
      filters: {
        projectTypes,
        popularTags: popularTags.map(t => ({ name: t._id, count: t.count })),
        categories: categories.filter(c => c).sort(),
        sortOptions: [
          { value: 'relevance', label: 'Most Relevant' },
          { value: 'recent', label: 'Most Recent' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'name', label: 'Name (A-Z)' }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error getting search filters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting search filters'
    });
  }
});

// ========== PROJECT MEMBER MANAGEMENT ROUTES ==========

// Get project members
app.get('/api/projects/:projectId/members', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    console.log('👥 Getting project members for:', projectId);

    const project = await db.collection('projects').findOne(
      { _id: new ObjectId(projectId) },
      { projection: { members: 1, owner: 1 } }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Get all member user objects
    const memberIds = [...new Set([project.owner, ...(project.members || [])])];
    
    const members = await db.collection('users')
      .find({ _id: { $in: memberIds } })
      .project({ password: 0 })
      .toArray();

    res.json({
      success: true,
      members: members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        profilePic: member.profilePic,
        isOwner: member._id.toString() === project.owner.toString()
      }))
    });
  } catch (error) {
    console.error('❌ Error getting project members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting project members'
    });
  }
});

// Add member to project
app.post('/api/projects/:projectId/members', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    const { userId: memberId } = req.body;

    console.log('➕ Adding member to project:', { projectId, memberId });

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required"
      });
    }

    // Check if user has permission to add members
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { owner: new ObjectId(String(userId)) },
        { members: new ObjectId(String(userId)) }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to add members"
      });
    }

    // Check if user is already a member
    const isAlreadyMember = project.members && 
      project.members.some(member => member.toString() === memberId);

    if (isAlreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a member of this project"
      });
    }

    // Check if user exists
    const userToAdd = await db.collection('users').findOne(
      { _id: new ObjectId(memberId) },
      { projection: { _id: 1, name: 1 } }
    );

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Add member to project
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $addToSet: { members: new ObjectId(memberId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Create activity for member addition
    const currentUser = await db.collection('users').findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { name: 1 } }
    );

    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "member_added",
      message: `${currentUser?.name || 'Someone'} added ${userToAdd.name} to the project`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);

    console.log('✅ Member added to project');

    res.json({
      success: true,
      message: "Member added successfully",
      member: {
        _id: userToAdd._id,
        name: userToAdd.name
      }
    });
  } catch (error) {
    console.error('❌ Error adding member to project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding member to project'
    });
  }
});

// Remove member from project
app.delete('/api/projects/:projectId/members/:memberId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const memberId = req.params.memberId;
    const userId = req.session.userId;

    console.log('➖ Removing member from project:', { projectId, memberId });

    // Check if user has permission to remove members
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      $or: [
        { owner: new ObjectId(String(userId)) },
        { members: new ObjectId(String(userId)) }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have permission to remove members"
      });
    }

    // Cannot remove owner
    if (project.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove project owner"
      });
    }

    // Remove member from project
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $pull: { members: new ObjectId(memberId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found or member not in project"
      });
    }

    // Create activity for member removal
    const currentUser = await db.collection('users').findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { name: 1 } }
    );

    const removedUser = await db.collection('users').findOne(
      { _id: new ObjectId(memberId) },
      { projection: { name: 1 } }
    );

    const checkinData = {
      userId: new ObjectId(String(userId)),
      projectId: new ObjectId(projectId),
      action: "member_removed",
      message: `${currentUser?.name || 'Someone'} removed ${removedUser?.name || 'a member'} from the project`,
      timestamp: new Date(),
      likes: 0,
      downloads: 0
    };

    await db.collection('checkins').insertOne(checkinData);

    console.log('✅ Member removed from project');

    res.json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error('❌ Error removing member from project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member from project'
    });
  }
});

// ========== DEBUG ROUTES ==========

app.get('/api/debug/local-feed-issues', async (req, res) => {
  try {
    const userId = req.session.userId;
    const userObjectId = new ObjectId(userId);

    // Get current user with friends
    const currentUser = await db.collection('users').findOne(
      { _id: userObjectId },
      { projection: { friends: 1, name: 1 } }
    );

    console.log('🔍 DEBUG: Current user friends:', currentUser.friends);

    if (!currentUser.friends || currentUser.friends.length === 0) {
      return res.json({
        success: true,
        message: "No friends found",
        issues: ["No friends in friends array"]
      });
    }

    const friendId = currentUser.friends[0];
    console.log('🔍 DEBUG: First friend ID:', friendId);

    // Check if friend exists
    const friend = await db.collection('users').findOne(
      { _id: new ObjectId(friendId) },
      { projection: { name: 1, friends: 1 } }
    );

    if (!friend) {
      return res.json({
        success: true,
        message: "Friend not found in database",
        issues: ["Friend ID exists but user not found in database"]
      });
    }

    console.log('🔍 DEBUG: Friend found:', friend.name);

    // Check if friendship is mutual
    const isMutual = friend.friends && friend.friends.some(f => f.toString() === userId);
    console.log('🔍 DEBUG: Mutual friendship:', isMutual);

    // Get friend's projects
    const friendProjects = await db.collection('projects').find({
      $or: [
        { owner: new ObjectId(friendId) },
        { members: new ObjectId(friendId) }
      ]
    }).toArray();

    console.log('🔍 DEBUG: Friend projects count:', friendProjects.length);
    friendProjects.forEach(p => {
      console.log(`🔍 DEBUG: Friend project: ${p.name}, Owner: ${p.owner}`);
    });

    // Get activities from friend's projects
    const friendActivities = await db.collection('checkins').find({
      projectId: { $in: friendProjects.map(p => p._id) }
    }).toArray();

    console.log('🔍 DEBUG: Friend activities count:', friendActivities.length);
    friendActivities.forEach(a => {
      console.log(`🔍 DEBUG: Friend activity: ${a.message}, Project: ${a.projectId}`);
    });

    // Check what the local feed query would return
    const relevantUserIds = [userObjectId, new ObjectId(friendId)];
    const relevantProjects = await db.collection('projects').find({
      $or: [
        { owner: { $in: relevantUserIds } },
        { members: { $in: relevantUserIds } }
      ]
    }).toArray();

    const relevantActivities = await db.collection('checkins').find({
      projectId: { $in: relevantProjects.map(p => p._id) }
    }).toArray();

    res.json({
      success: true,
      debug: {
        currentUser: currentUser.name,
        friend: friend.name,
        friendId: friendId.toString(),
        isMutualFriendship: isMutual,
        friendProjects: friendProjects.map(p => ({
          name: p.name,
          owner: p.owner.toString(),
          hasFiles: !!(p.files && p.files.length > 0)
        })),
        friendActivities: friendActivities.map(a => ({
          message: a.message,
          projectId: a.projectId.toString(),
          userId: a.userId.toString()
        })),
        localFeedStats: {
          relevantProjects: relevantProjects.length,
          relevantActivities: relevantActivities.length,
          currentUserProjects: relevantProjects.filter(p => p.owner.toString() === userId).length,
          friendProjects: relevantProjects.filter(p => p.owner.toString() === friendId.toString()).length
        }
      },
      issues: !isMutual ? ["Friendship is not mutual"] : [],
      suggestions: !isMutual ? [
        "The friend needs to add you back as a friend for their activities to appear in your local feed"
      ] : []
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/debug/find-friend-activity', async (req, res) => {
  try {
    // Temporary auth bypass
    const userId = '68de9202335ebe602d694ed2';
    const friendId = '68de92e8335ebe602d694ed4';
    const activityId = '68decb5294a85db483f6a9d9';

    console.log('🔍 Looking for specific friend activity:', activityId);

    // 1. Check if activity exists in checkins collection
    const activity = await db.collection('checkins').findOne({
      _id: new ObjectId(activityId)
    });

    if (!activity) {
      return res.json({
        success: false,
        message: "Activity not found in checkins collection"
      });
    }

    console.log('✅ Activity found:', activity.message);

    // 2. Check if the project exists
    let project = null;
    try {
      project = await db.collection('projects').findOne({
        _id: new ObjectId(activity.projectId)
      });
    } catch (error) {
      console.log('❌ Project not found or invalid project ID');
    }

    // 3. Check friendship
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { friends: 1, name: 1 } }
    );

    const friend = await db.collection('users').findOne(
      { _id: new ObjectId(friendId) },
      { projection: { friends: 1, name: 1 } }
    );

    const isMutualFriends = user && user.friends && user.friends.some(f => f.toString() === friendId) &&
                           friend && friend.friends && friend.friends.some(f => f.toString() === userId);

    console.log('👥 Mutual friendship:', isMutualFriends);

    // 4. Check what projects would be included in local feed
    const relevantUserIds = [new ObjectId(userId), new ObjectId(friendId)];
    const relevantProjects = await db.collection('projects').find({
      $or: [
        { owner: { $in: relevantUserIds } },
        { members: { $in: relevantUserIds } }
      ]
    }).toArray();

    const isProjectInRelevant = project ? 
      relevantProjects.some(p => p._id.toString() === activity.projectId.toString()) :
      false;

    res.json({
      success: true,
      summary: {
        activityExists: true,
        projectExists: !!project,
        isMutualFriends: isMutualFriends,
        isProjectInLocalFeed: isProjectInRelevant,
        reasonNotShowing: !project ? "Project was deleted" :
                        !isProjectInRelevant ? "Project not accessible to you" :
                        !isMutualFriends ? "Not mutual friends" :
                        "Should be visible in local feed"
      },
      activity: {
        id: activity._id.toString(),
        userId: activity.userId.toString(),
        message: activity.message,
        projectId: activity.projectId.toString(),
        timestamp: activity.timestamp,
        action: activity.action
      },
      project: project ? {
        id: project._id.toString(),
        name: project.name,
        owner: project.owner.toString(),
        members: project.members ? project.members.map(m => m.toString()) : []
      } : null,
      friendship: {
        yourFriends: user ? user.friends.map(f => f.toString()) : [],
        friendFriends: friend ? friend.friends.map(f => f.toString()) : [],
        isMutual: isMutualFriends
      },
      localFeed: {
        relevantProjectsCount: relevantProjects.length,
        yourProjects: relevantProjects.filter(p => p.owner.toString() === userId).length,
        friendProjects: relevantProjects.filter(p => p.owner.toString() === friendId).length
      }
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug route for project type editing
app.get('/api/debug/project-type/:typeId', requireAdmin, async (req, res) => {
  try {
    const typeId = req.params.typeId;
    console.log('🔍 Debug: Looking for project type with ID:', typeId);
    
    const type = await db.collection('projectTypes').findOne({
      _id: new ObjectId(typeId)
    });
    
    if (!type) {
      return res.json({
        success: false,
        message: 'Project type not found'
      });
    }
    
    res.json({
      success: true,
      type: type
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== DATABASE CONNECTION ==========
// const uri = process.env.MONGODB_URI || "mongodb+srv://shaunmarx05_db_user:shaun@imy220.eacjjp4.mongodb.net/codecollab?retryWrites=true&w=majority";
// let db;
// let client;

// Server startup function
async function startServer(){
  try{
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('codecollab');
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database name:', db.databaseName);
    
    // Debug: Check if users exist
    const usersCount = await db.collection('users').countDocuments();
    console.log('👥 Users in database:', usersCount);
    
    if (usersCount > 0) {
      const sampleUsers = await db.collection('users').find({}, {email: 1, name: 1}).limit(3).toArray();
      console.log('📋 Sample users:', sampleUsers);
    }

    // Initialize project types
    await initializeProjectTypes();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:3000`);
      console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
    });
  }catch(error){
    console.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);   
  }
};

// ========== STATIC FILES AND SERVER STARTUP ==========

app.use(express.static(path.join(__dirname, '../frontend/public')));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});


// Server startup function
async function startServer(){
  try{
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('codecollab');
    console.log('✅ Connected to MongoDB');

    // Initialize project types
    await initializeProjectTypes();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:3000`);
      console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
    });
  }catch(error){
    console.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);   
  }
};

startServer();