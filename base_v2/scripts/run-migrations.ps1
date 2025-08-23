# PowerShell script to run SQL migrations
$dbPath = "db\base.db"
$migrations = @(
    "backend\migrations\013_add_question_status_system.sql",
    "backend\migrations\014_add_status_to_questions.sql"
)

# Check if SQLite is installed
$sqliteInstalled = Get-Command sqlite3 -ErrorAction SilentlyContinue

if (-not $sqliteInstalled) {
    Write-Host "SQLite3 is not installed. Please install it and try again."
    exit 1
}

# Create database directory if it doesn't exist
$dbDir = Split-Path -Parent $dbPath
if (-not (Test-Path $dbDir)) {
    New-Item -ItemType Directory -Path $dbDir | Out-Null
}

# Run each migration
foreach ($migration in $migrations) {
    if (-not (Test-Path $migration)) {
        Write-Host "Migration file not found: $migration"
        exit 1
    }
    
    Write-Host "Running migration: $migration"
    $sql = Get-Content $migration -Raw
    
    try {
        # Run the migration
        $sql | sqlite3 $dbPath
        Write-Host "Migration completed: $migration" -ForegroundColor Green
    } catch {
        Write-Host "Error running migration $migration" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}

Write-Host "All migrations completed successfully" -ForegroundColor Green
