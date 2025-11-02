npm run dev
npm run build

# Build and run the Docker
docker-compose up --build

# Stop everything
docker-compose down

docker exec -it version-control-db mongosh -u "admin" -p "password" --authenticationDatabase admin

db.users.insertMany([
  {
    _id: ObjectId("68de9280335ebe602d694ed3"),
    email: "test@test.com",
    password: "test1234",
    name: "Test User",
    profilePic: "https://example.com/test.jpg",
    friends: [
      ObjectId("68de9280335ebe602d694ed4"),
      ObjectId("68de9280335ebe602d694ed5")
    ],
    createdAt: new Date("2025-10-02T14:53:54.124Z"),
    isAdmin: false,
    bio: "Quality assurance specialist and developer",
    location: "Johannesburg, South Africa",
    skills: ["JavaScript", "Testing", "React", "Node.js"],
    updatedAt: new Date("2025-10-28T13:27:35.778Z"),
    website: "https://testuser.dev",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed4"),
    email: "sarah.dev@email.com",
    password: "sarah123",
    name: "Sarah Johnson",
    profilePic: "https://example.com/sarah.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed3")],
    createdAt: new Date("2025-09-15T10:30:00.000Z"),
    isAdmin: false,
    bio: "Full-stack developer passionate about open source",
    location: "San Francisco, CA",
    skills: ["Python", "Django", "React", "MongoDB"],
    updatedAt: new Date("2025-10-29T09:15:22.123Z"),
    website: "https://sarahjohnson.dev",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed5"),
    email: "admin@versioncontrol.com",
    password: "admin123",
    name: "Admin User",
    profilePic: "https://example.com/admin.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed3")],
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    isAdmin: true,
    bio: "System administrator",
    location: "New York, NY",
    skills: ["System Administration", "Security", "DevOps"],
    updatedAt: new Date("2025-10-30T14:20:10.456Z"),
    website: "",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed6"),
    email: "mike.coder@email.com",
    password: "mike123",
    name: "Mike Chen",
    profilePic: "https://example.com/mike.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed7")],
    createdAt: new Date("2025-08-20T08:15:00.000Z"),
    isAdmin: false,
    bio: "Mobile app developer specializing in Flutter",
    location: "Toronto, Canada",
    skills: ["Flutter", "Dart", "Firebase", "Android"],
    updatedAt: new Date("2025-10-25T16:40:33.789Z"),
    website: "https://mikechen.dev",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed7"),
    email: "lisa.design@email.com",
    password: "lisa123",
    name: "Lisa Rodriguez",
    profilePic: "https://example.com/lisa.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed6")],
    createdAt: new Date("2025-07-12T14:20:00.000Z"),
    isAdmin: false,
    bio: "UI/UX Designer & Frontend Developer",
    location: "Austin, TX",
    skills: ["Figma", "React", "CSS", "UI/UX Design"],
    updatedAt: new Date("2025-10-22T11:05:17.234Z"),
    website: "https://lisarodriguez.design",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed8"),
    email: "david.ai@email.com",
    password: "david123",
    name: "David Kim",
    profilePic: "https://example.com/david.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed9")],
    createdAt: new Date("2025-09-05T09:45:00.000Z"),
    isAdmin: false,
    bio: "Machine Learning Engineer & Data Scientist",
    location: "Seattle, WA",
    skills: ["Python", "TensorFlow", "PyTorch", "Data Science"],
    updatedAt: new Date("2025-10-28T14:30:45.678Z"),
    website: "https://davidkim.ai",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694ed9"),
    email: "emma.backend@email.com",
    password: "emma123",
    name: "Emma Wilson",
    profilePic: "https://example.com/emma.jpg",
    friends: [ObjectId("68de9280335ebe602d694ed8")],
    createdAt: new Date("2025-06-18T16:30:00.000Z"),
    isAdmin: false,
    bio: "Backend Developer & Database Specialist",
    location: "London, UK",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    updatedAt: new Date("2025-10-29T10:15:28.901Z"),
    website: "https://emmawilson.dev",
    sentFriendRequests: []
  },
  {
    _id: ObjectId("68de9280335ebe602d694eda"),
    email: "alex.fullstack@email.com",
    password: "alex123",
    name: "Alex Thompson",
    profilePic: "https://example.com/alex.jpg",
    friends: [],
    createdAt: new Date("2025-10-10T11:20:00.000Z"),
    isAdmin: false,
    bio: "Full-stack developer with startup experience",
    location: "Berlin, Germany",
    skills: ["JavaScript", "Vue.js", "Node.js", "MongoDB"],
    updatedAt: new Date("2025-10-27T13:45:12.345Z"),
    website: "https://alexthompson.dev",
    sentFriendRequests: []
  }
])

db.projects.insertMany([
  {
    _id: ObjectId("68decb5294a85db483f6a9d1"),
    name: "E-Commerce Platform",
    description: "A full-stack e-commerce solution with React frontend and Node.js backend",
    owner: ObjectId("68de9280335ebe602d694ed3"),
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed3"),
        role: "owner",
        joinedAt: new Date("2025-09-30T21:18:52.915Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed4"),
        role: "developer",
        joinedAt: new Date("2025-10-05T14:30:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed7"),
        role: "designer",
        joinedAt: new Date("2025-10-08T10:15:00.000Z")
      }
    ],
    files: [
      {
        filename: "package.json",
        path: "/",
        content: '{"name": "ecommerce-platform", "version": "1.0.0"}',
        lastModified: new Date("2025-10-28T10:00:00.000Z"),
        size: 1024,
        language: "json",
        isExecutable: false
      }
    ],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "1.2.0",
    checkins: [
      ObjectId("68decb5294a85db483f6a9d8"),
      ObjectId("68decb5294a85db483f6a9d9")
    ],
    createdAt: new Date("2025-09-30T21:18:52.915Z"),
    updatedAt: new Date("2025-10-29T16:45:30.381Z")
  },
  {
    _id: ObjectId("68dc493c5910d06de47caa0b"),
    name: "Mobile Task Manager",
    description: "Cross-platform mobile application for task management",
    owner: ObjectId("68de9280335ebe602d694ed4"),
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed4"),
        role: "owner",
        joinedAt: new Date("2025-10-01T08:27:20.381Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed6"),
        role: "mobile developer",
        joinedAt: new Date("2025-10-03T09:20:00.000Z")
      }
    ],
    files: [
      {
        filename: "main.dart",
        path: "/lib",
        content: "void main() {\n  runApp(MyApp());\n}",
        lastModified: new Date("2025-10-28T14:20:00.000Z"),
        size: 3072,
        language: "dart",
        isExecutable: true
      }
    ],
    isCheckedOut: true,
    checkedOutBy: ObjectId("68de9280335ebe602d694ed4"),
    version: "0.5.1",
    checkins: [
      ObjectId("68decb5294a85db483f6a9da")
    ],
    createdAt: new Date("2025-10-01T08:27:20.381Z"),
    updatedAt: new Date("2025-10-30T11:10:15.222Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d2"),
    name: "AI Image Recognition API",
    description: "Machine learning API for image classification and object detection",
    owner: ObjectId("68de9280335ebe602d694ed8"),
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed8"),
        role: "owner",
        joinedAt: new Date("2025-10-10T09:00:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed9"),
        role: "backend developer",
        joinedAt: new Date("2025-10-12T14:15:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed3"),
        role: "tester",
        joinedAt: new Date("2025-10-15T11:30:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "2.1.3",
    checkins: [
      ObjectId("68decb5294a85db483f6a9db"),
      ObjectId("68decb5294a85db483f6a9dc"),
      ObjectId("68decb5294a85db483f6a9dd")
    ],
    createdAt: new Date("2025-10-10T09:00:00.000Z"),
    updatedAt: new Date("2025-10-30T10:25:40.123Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d3"),
    name: "Social Media Dashboard",
    description: "Analytics dashboard for social media performance tracking",
    owner: ObjectId("68de9280335ebe602d694ed5"),
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed5"),
        role: "owner",
        joinedAt: new Date("2025-09-25T13:45:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed4"),
        role: "frontend developer",
        joinedAt: new Date("2025-09-28T16:20:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed7"),
        role: "UI designer",
        joinedAt: new Date("2025-09-26T10:10:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "1.0.0",
    checkins: [
      ObjectId("68decb5294a85db483f6a9de"),
      ObjectId("68decb5294a85db483f6a9df")
    ],
    createdAt: new Date("2025-09-25T13:45:00.000Z"),
    updatedAt: new Date("2025-10-29T14:35:22.567Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d4"),
    name: "Blockchain Wallet App",
    description: "Secure cryptocurrency wallet with multi-chain support",
    owner: ObjectId("68de9280335ebe602d694ed6"),
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed6"),
        role: "owner",
        joinedAt: new Date("2025-10-05T11:30:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed9"),
        role: "security engineer",
        joinedAt: new Date("2025-10-07T15:45:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "0.8.2",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e0")
    ],
    createdAt: new Date("2025-10-05T11:30:00.000Z"),
    updatedAt: new Date("2025-10-28T17:20:33.890Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d5"),
    name: "Healthcare Patient Portal",
    description: "Web application for patients to manage medical records and appointments",
    owner: ObjectId("68de9280335ebe602d694ed7"),
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed7"),
        role: "owner",
        joinedAt: new Date("2025-09-28T14:20:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed3"),
        role: "QA tester",
        joinedAt: new Date("2025-10-02T09:15:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed9"),
        role: "backend developer",
        joinedAt: new Date("2025-09-30T16:40:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "3.2.1",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e1"),
      ObjectId("68decb5294a85db483f6a9e2")
    ],
    createdAt: new Date("2025-09-28T14:20:00.000Z"),
    updatedAt: new Date("2025-10-30T08:45:19.234Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d6"),
    name: "Real Estate Marketplace",
    description: "Online platform for buying, selling, and renting properties",
    owner: ObjectId("68de9280335ebe602d694ed8"),
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed8"),
        role: "owner",
        joinedAt: new Date("2025-10-08T12:00:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed4"),
        role: "fullstack developer",
        joinedAt: new Date("2025-10-10T14:30:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed7"),
        role: "UX designer",
        joinedAt: new Date("2025-10-09T11:15:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "2.5.0",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e3"),
      ObjectId("68decb5294a85db483f6a9e4")
    ],
    createdAt: new Date("2025-10-08T12:00:00.000Z"),
    updatedAt: new Date("2025-10-29T13:20:45.678Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d7"),
    name: "Fitness Tracking App",
    description: "Mobile application for workout tracking and health monitoring",
    owner: ObjectId("68de9280335ebe602d694ed9"),
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed9"),
        role: "owner",
        joinedAt: new Date("2025-10-12T10:45:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed6"),
        role: "mobile developer",
        joinedAt: new Date("2025-10-14T13:20:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed3"),
        role: "product tester",
        joinedAt: new Date("2025-10-16T15:30:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "1.1.4",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e5"),
      ObjectId("68decb5294a85db483f6a9e6")
    ],
    createdAt: new Date("2025-10-12T10:45:00.000Z"),
    updatedAt: new Date("2025-10-28T19:10:28.901Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d8"),
    name: "E-Learning Platform",
    description: "Online education platform with video courses and interactive content",
    owner: ObjectId("68de9280335ebe602d694eda"),
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694eda"),
        role: "owner",
        joinedAt: new Date("2025-10-03T08:15:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed4"),
        role: "frontend developer",
        joinedAt: new Date("2025-10-05T11:45:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed9"),
        role: "backend developer",
        joinedAt: new Date("2025-10-04T14:20:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "4.0.1",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e7"),
      ObjectId("68decb5294a85db483f6a9e8")
    ],
    createdAt: new Date("2025-10-03T08:15:00.000Z"),
    updatedAt: new Date("2025-10-30T09:35:17.345Z")
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d9"),
    name: "Food Delivery Service",
    description: "Mobile and web application for food ordering and delivery tracking",
    owner: ObjectId("68de9280335ebe602d694ed5"),
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
    members: [
      {
        userId: ObjectId("68de9280335ebe602d694ed5"),
        role: "owner",
        joinedAt: new Date("2025-10-15T09:30:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed6"),
        role: "mobile developer",
        joinedAt: new Date("2025-10-17T12:15:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed8"),
        role: "API developer",
        joinedAt: new Date("2025-10-16T14:45:00.000Z")
      },
      {
        userId: ObjectId("68de9280335ebe602d694ed3"),
        role: "tester",
        joinedAt: new Date("2025-10-18T16:20:00.000Z")
      }
    ],
    files: [],
    isCheckedOut: false,
    checkedOutBy: null,
    version: "1.3.2",
    checkins: [
      ObjectId("68decb5294a85db483f6a9e9"),
      ObjectId("68decb5294a85db483f6a9ea")
    ],
    createdAt: new Date("2025-10-15T09:30:00.000Z"),
    updatedAt: new Date("2025-10-29T17:50:12.678Z")
  }
])

db.checkins.insertMany([
  // Test User's checkin in a different project (AI Image Recognition)
  {
    _id: ObjectId("68decb5294a85db483f6a9db"),
    userId: ObjectId("68de9280335ebe602d694ed3"),
    projectId: ObjectId("68decb5294a85db483f6a9d2"),
    action: "tested",
    message: "Comprehensive testing of image classification endpoints",
    timestamp: new Date("2025-10-18T14:30:00.000Z"),
    likes: 3,
    downloads: 2
  },
  // Remaining checkins...
  {
    _id: ObjectId("68decb5294a85db483f6a9d8"),
    userId: ObjectId("68de9280335ebe602d694ed3"),
    projectId: ObjectId("68decb5294a85db483f6a9d1"),
    action: "updated",
    message: "Implemented user authentication system",
    timestamp: new Date("2025-10-02T14:00:00.000Z"),
    likes: 5,
    downloads: 3
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9d9"),
    userId: ObjectId("68de9280335ebe602d694ed4"),
    projectId: ObjectId("68decb5294a85db483f6a9d1"),
    action: "added",
    message: "Added product search functionality with filters",
    timestamp: new Date("2025-10-15T11:20:00.000Z"),
    likes: 4,
    downloads: 2
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9da"),
    userId: ObjectId("68de9280335ebe602d694ed4"),
    projectId: ObjectId("68dc493c5910d06de47caa0b"),
    action: "updated",
    message: "Fixed navigation bugs in mobile app",
    timestamp: new Date("2025-10-20T16:45:00.000Z"),
    likes: 2,
    downloads: 1
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9dc"),
    userId: ObjectId("68de9280335ebe602d694ed8"),
    projectId: ObjectId("68decb5294a85db483f6a9d2"),
    action: "added",
    message: "Implemented neural network model for object detection",
    timestamp: new Date("2025-10-22T10:15:00.000Z"),
    likes: 7,
    downloads: 5
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9dd"),
    userId: ObjectId("68de9280335ebe602d694ed9"),
    projectId: ObjectId("68decb5294a85db483f6a9d2"),
    action: "updated",
    message: "Optimized API response time by 40%",
    timestamp: new Date("2025-10-25T13:40:00.000Z"),
    likes: 6,
    downloads: 4
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9de"),
    userId: ObjectId("68de9280335ebe602d694ed5"),
    projectId: ObjectId("68decb5294a85db483f6a9d3"),
    action: "added",
    message: "Created social media analytics dashboard",
    timestamp: new Date("2025-10-05T09:30:00.000Z"),
    likes: 8,
    downloads: 6
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9df"),
    userId: ObjectId("68de9280335ebe602d694ed4"),
    projectId: ObjectId("68decb5294a85db483f6a9d3"),
    action: "updated",
    message: "Added real-time data visualization charts",
    timestamp: new Date("2025-10-12T15:20:00.000Z"),
    likes: 5,
    downloads: 3
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e0"),
    userId: ObjectId("68de9280335ebe602d694ed6"),
    projectId: ObjectId("68decb5294a85db483f6a9d4"),
    action: "added",
    message: "Implemented multi-currency wallet support",
    timestamp: new Date("2025-10-10T11:45:00.000Z"),
    likes: 9,
    downloads: 7
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e1"),
    userId: ObjectId("68de9280335ebe602d694ed7"),
    projectId: ObjectId("68decb5294a85db483f6a9d5"),
    action: "added",
    message: "Designed patient portal user interface",
    timestamp: new Date("2025-10-03T14:15:00.000Z"),
    likes: 4,
    downloads: 2
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e2"),
    userId: ObjectId("68de9280335ebe602d694ed9"),
    projectId: ObjectId("68decb5294a85db483f6a9d5"),
    action: "updated",
    message: "Implemented secure patient data encryption",
    timestamp: new Date("2025-10-08T16:30:00.000Z"),
    likes: 6,
    downloads: 4
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e3"),
    userId: ObjectId("68de9280335ebe602d694ed8"),
    projectId: ObjectId("68decb5294a85db483f6a9d6"),
    action: "added",
    message: "Created property listing management system",
    timestamp: new Date("2025-10-15T13:10:00.000Z"),
    likes: 5,
    downloads: 3
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e4"),
    userId: ObjectId("68de9280335ebe602d694ed4"),
    projectId: ObjectId("68decb5294a85db483f6a9d6"),
    action: "updated",
    message: "Added advanced property search filters",
    timestamp: new Date("2025-10-20T11:25:00.000Z"),
    likes: 4,
    downloads: 2
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e5"),
    userId: ObjectId("68de9280335ebe602d694ed9"),
    projectId: ObjectId("68decb5294a85db483f6a9d7"),
    action: "added",
    message: "Built workout tracking database schema",
    timestamp: new Date("2025-10-18T09:45:00.000Z"),
    likes: 7,
    downloads: 5
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e6"),
    userId: ObjectId("68de9280335ebe602d694ed6"),
    projectId: ObjectId("68decb5294a85db483f6a9d7"),
    action: "updated",
    message: "Implemented GPS tracking for outdoor activities",
    timestamp: new Date("2025-10-22T14:50:00.000Z"),
    likes: 8,
    downloads: 6
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e7"),
    userId: ObjectId("68de9280335ebe602d694eda"),
    projectId: ObjectId("68decb5294a85db483f6a9d8"),
    action: "added",
    message: "Created course management system",
    timestamp: new Date("2025-10-10T10:30:00.000Z"),
    likes: 6,
    downloads: 4
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e8"),
    userId: ObjectId("68de9280335ebe602d694ed4"),
    projectId: ObjectId("68decb5294a85db483f6a9d8"),
    action: "updated",
    message: "Added video streaming capabilities",
    timestamp: new Date("2025-10-15T16:15:00.000Z"),
    likes: 5,
    downloads: 3
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9e9"),
    userId: ObjectId("68de9280335ebe602d694ed5"),
    projectId: ObjectId("68decb5294a85db483f6a9d9"),
    action: "added",
    message: "Built restaurant management dashboard",
    timestamp: new Date("2025-10-20T12:40:00.000Z"),
    likes: 4,
    downloads: 2
  },
  {
    _id: ObjectId("68decb5294a85db483f6a9ea"),
    userId: ObjectId("68de9280335ebe602d694ed6"),
    projectId: ObjectId("68decb5294a85db483f6a9d9"),
    action: "updated",
    message: "Implemented real-time order tracking",
    timestamp: new Date("2025-10-25T15:55:00.000Z"),
    likes: 7,
    downloads: 5
  }
])

