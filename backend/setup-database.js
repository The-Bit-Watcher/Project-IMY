const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017/codecollab";

async function setupDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Setting up database...');
    
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "password", "name", "createdAt"],
          properties: {
            email: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            password: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            name: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            profilePic: {
              bsonType: "string"
            },
            friends: {
              bsonType: "array",
              items: {
                bsonType: "objectId"
              }
            },
            isAdmin: {
              bsonType: "bool"
            },
            createdAt: {
              bsonType: "date"
            }
          }
        }
      }
    });

    await db.createCollection('projects', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "description", "owner", "members", "createdAt"],
          properties: {
            name: {
              bsonType: "string"
            },
            description: {
              bsonType: "string"
            },
            owner: {
              bsonType: "objectId"
            },
            members: {
              bsonType: "array",
              items: {
                bsonType: "objectId"
              }
            },
            files: {
              bsonType: "array"
            },
            isCheckedOut: {
              bsonType: "bool"
            },
            checkedOutBy: {
              bsonType: ["objectId", "null"]
            },
            version: {
              bsonType: "string"
            },
            checkins: {
              bsonType: "array"
            },
            createdAt: {
              bsonType: "date"
            },
            updatedAt: {
              bsonType: "date"
            }
          }
        }
      }
    });

    await db.createCollection('checkins', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["user", "project", "message", "timestamp"],
          properties: {
            user: {
              bsonType: "objectId"
            },
            project: {
              bsonType: "objectId"
            },
            message: {
              bsonType: "string"
            },
            timestamp: {
              bsonType: "date"
            },
            files: {
              bsonType: "array"
            }
          }
        }
      }
    });

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('projects').createIndex({ owner: 1 });
    await db.collection('projects').createIndex({ members: 1 });
    await db.collection('checkins').createIndex({ user: 1 });
    await db.collection('checkins').createIndex({ project: 1 });
    await db.collection('checkins').createIndex({ timestamp: -1 });

    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.close();
  }
}

setupDatabase();