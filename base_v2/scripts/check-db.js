const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'db', 'base.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Function to list all tables
function listTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
      if (err) {
        console.error('Error listing tables:', err);
        return reject(err);
      }
      console.log('\nTables in the database:');
      tables.forEach(table => {
        console.log(`- ${table.name}`);
      });
      resolve(tables);
    });
  });
}

// Function to describe a table
function describeTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        console.error(`Error describing table ${tableName}:`, err);
        return reject(err);
      }
      console.log(`\nStructure of table ${tableName}:`);
      console.table(columns);
      resolve(columns);
    });
  });
}

// Function to check if a table exists
function tableExists(tableName) {
  return new Promise((resolve) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
      (err, row) => {
        if (err) {
          console.error('Error checking table existence:', err);
          return resolve(false);
        }
        resolve(!!row);
      }
    );
  });
}

// Main function
async function main() {
  try {
    // List all tables
    await listTables();

    // Check for our new tables
    const tablesToCheck = [
      'qb_question_statuses',
      'qb_question_status_transitions',
      'qb_question_status_history',
      'qb_questions'
    ];

    for (const table of tablesToCheck) {
      const exists = await tableExists(table);
      console.log(`\nTable ${table} exists: ${exists ? '✅' : '❌'}`);
      
      if (exists) {
        await describeTable(table);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('\nDatabase connection closed.');
      }
    });
  }
}

// Run the main function
main();
