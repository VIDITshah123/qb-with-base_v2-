const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'db', 'base.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Function to run a migration file
function runMigration(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Running migration: ${filePath}`);
    
    // Read the migration file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading migration file ${filePath}:`, err);
        return reject(err);
      }

      // Split the SQL file into individual statements
      const statements = data
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

      // Execute each statement sequentially
      const executeStatements = (index) => {
        if (index >= statements.length) {
          console.log(`Migration ${filePath} completed successfully`);
          return resolve();
        }

        const statement = statements[index];
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        
        db.run(statement, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error executing statement in ${filePath}:`, err);
            return reject(err);
          }
          executeStatements(index + 1);
        });
      };

      executeStatements(0);
    });
  });
}

// Get migration files from command line arguments
const migrationFiles = process.argv.slice(2);

// Run each migration sequentially
async function runMigrations() {
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        console.error(`Migration file not found: ${filePath}`);
        process.exit(1);
      }
      await runMigration(filePath);
    }
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the migrations
runMigrations();
