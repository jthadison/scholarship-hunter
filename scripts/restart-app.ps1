# Restart Application Script (PowerShell)
# Stops any running Next.js dev servers and restarts the application

Write-Host "=== Scholarship Hunter - Application Restart ===" -ForegroundColor Cyan
Write-Host ""

# Function to find and kill processes by port
function Stop-ProcessOnPort {
    param([int]$Port)

    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow

    $connections = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"

    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]

            if ($pid -and $pid -match '^\d+$') {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "  Stopping process '$($process.ProcessName)' (PID: $pid)" -ForegroundColor Red
                        Stop-Process -Id $pid -Force
                        Write-Host "  Process stopped successfully" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "  Failed to stop process $pid : $_" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  No process found on port $Port" -ForegroundColor Gray
    }
}

# Function to kill Node.js processes by name
function Stop-NodeProcesses {
    Write-Host "Stopping all Node.js development processes..." -ForegroundColor Yellow

    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -like "*next*" -or
        $_.CommandLine -like "*next dev*" -or
        $_.Path -like "*scholarship*"
    }

    if ($nodeProcesses) {
        foreach ($proc in $nodeProcesses) {
            Write-Host "  Stopping Node process (PID: $($proc.Id))" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force
        }
        Write-Host "  Node processes stopped" -ForegroundColor Green
    } else {
        Write-Host "  No Node.js processes found" -ForegroundColor Gray
    }
}

# Step 1: Stop processes on default Next.js port (3000)
Stop-ProcessOnPort -Port 3000

# Step 2: Stop any other Node.js processes
Stop-NodeProcesses

# Wait a moment for cleanup
Write-Host ""
Write-Host "Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Step 3: Start the application
Write-Host ""
Write-Host "Starting application..." -ForegroundColor Green
Write-Host "Running: pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start the dev server
pnpm dev
