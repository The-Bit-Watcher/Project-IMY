const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb://localhost:27017/codecollab";

async function seedData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Seeding sample data...');
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('checkins').deleteMany({});
    
    // Create users
    const users = [
      {
        _id: new ObjectId(),
        email: "test@test.com",
        password: "test1234",
        name: "Test User",
        profilePic: "",
        friends: [],
        createdAt: new Date(),
        isAdmin: false
      },
      {
        _id: new ObjectId(),
        email: "alice@dev.com",
        password: "password123",
        name: "Alice Johnson",
        profilePic: "",
        friends: [],
        createdAt: new Date(),
        isAdmin: false
      },
      {
        _id: new ObjectId(),
        email: "bob@dev.com",
        password: "password123",
        name: "Bob Smith",
        profilePic: "",
        friends: [],
        createdAt: new Date(),
        isAdmin: false
      },
      {
        _id: new ObjectId(),
        email: "admin@codecollab.com",
        password: "admin123",
        name: "Admin User",
        profilePic: "",
        friends: [],
        createdAt: new Date(),
        isAdmin: true
      }
    ];
    
    const userResult = await db.collection('users').insertMany(users);
    console.log(`Created ${userResult.insertedCount} users`);
    
    // Get user IDs for relationships
    const testUser = users[0];
    const alice = users[1];
    const bob = users[2];
    
    // Create projects
    const projects = [
      {
        _id: new ObjectId(),
        name: "E-commerce Website",
        description: "A full-stack e-commerce platform with React and Node.js",
        owner: testUser._id,
        members: [testUser._id, alice._id],
        files: [
          { name: "package.json", content: '{"name": "ecommerce-app"}', language: "JSON" },
          { name: "app.js", content: "console.log('Hello World');", language: "JavaScript" }
        ],
        isCheckedOut: false,
        checkedOutBy: null,
        version: "1.0.0",
        checkins: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Task Management App",
        description: "A collaborative task management application",
        owner: alice._id,
        members: [alice._id, testUser._id],
        files: [
          { name: "main.py", content: "print('Task Manager')", language: "Python" },
          { name: "requirements.txt", content: "flask==2.0.0", language: "Text" }
        ],
        isCheckedOut: false,
        checkedOutBy: null,
        version: "1.0.0",
        checkins: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Weather Dashboard",
        description: "Real-time weather dashboard with API integration",
        owner: bob._id,
        members: [bob._id],
        files: [
          { name: "index.html", content: "<html>Weather App</html>", language: "HTML" },
          { name: "styles.css", content: "body { margin: 0; }", language: "CSS" }
        ],
        isCheckedOut: false,
        checkedOutBy: null,
        version: "1.0.0",
        checkins: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const projectResult = await db.collection('projects').insertMany(projects);
    console.log(`Created ${projectResult.insertedCount} projects`);
    
    // Create checkins
    const checkins = [
      {
        _id: new ObjectId(),
        user: testUser._id,
        project: projects[0]._id,
        message: "Initial project setup with basic structure",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        files: []
      },
      {
        _id: new ObjectId(),
        user: alice._id,
        project: projects[0]._id,
        message: "Added user authentication system",
        timestamp: new Date(Date.now() - 43200000), // 12 hours ago
        files: []
      },
      {
        _id: new ObjectId(),
        user: testUser._id,
        project: projects[1]._id,
        message: "Implemented task creation functionality",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        files: []
      },
      {
        _id: new ObjectId(),
        user: bob._id,
        project: projects[2]._id,
        message: "Integrated weather API for real-time data",
        timestamp: new Date(),
        files: []
      }
    ];
    
    const checkinResult = await db.collection('checkins').insertMany(checkins);
    console.log(`Created ${checkinResult.insertedCount} checkins`);
    
    // Update users with friends and projects
    await db.collection('users').updateOne(
      { _id: testUser._id },
      { 
        $set: { 
          friends: [alice._id, bob._id] 
        } 
      }
    );
    
    await db.collection('users').updateOne(
      { _id: alice._id },
      { 
        $set: { 
          friends: [testUser._id] 
        } 
      }
    );
    
    console.log('Sample data seeded successfully!');
    console.log('\nTest User Credentials:');
    console.log('Email: test@test.com');
    console.log('Password: test1234');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seedData();