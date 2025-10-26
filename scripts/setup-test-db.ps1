# Test Database Setup Script (PowerShell)
# Run this to initialize your test database on Windows

Write-Host "🧪 Setting up test database for Scholarship Hunter..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.test exists
if (-Not (Test-Path ".env.test")) {
    Write-Host "❌ .env.test not found!" -ForegroundColor Red
    Write-Host "Please copy .env.test.example to .env.test and configure it."
    exit 1
}

Write-Host "✅ Found .env.test" -ForegroundColor Green

# Load environment variables from .env.test
Get-Content .env.test | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Check if DATABASE_URL is set
$dbUrl = $env:DATABASE_URL
if ([string]::IsNullOrEmpty($dbUrl)) {
    Write-Host "❌ DATABASE_URL not set in .env.test" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database URL configured" -ForegroundColor Green
Write-Host ""

# Run Prisma migrations
Write-Host "🔄 Applying Prisma schema to test database..." -ForegroundColor Yellow
pnpm prisma db push --skip-generate

Write-Host ""
Write-Host "✅ Test database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env.test with your Clerk test keys"
Write-Host "  2. Run: pnpm test:e2e tests/e2e/examples/refactored-auth.spec.ts"
Write-Host ""
