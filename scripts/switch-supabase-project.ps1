param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName
)

# Define your Supabase projects
$Projects = @{
    'tweettocourse' = @{
        url = 'https://rpwjenxdthwgjuwngncb.supabase.co'
        anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDU0MDAsImV4cCI6MjA2ODQyMTQwMH0.o9O6X0RUMleVtKR9py1rNZpi3Geph0kiz4Wuf1a2i-M'
        service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko'
    }
    'gaming' = @{
        url = 'https://cyjxatawvwdqtmdpqyuq.supabase.co'
        anon_key = 'your_gaming_anon_key_here'
        service_role_key = 'your_gaming_service_role_key_here'
    }
}

# Check if project exists
if (-not $Projects.ContainsKey($ProjectName)) {
    Write-Host "❌ Project '$ProjectName' not found." -ForegroundColor Red
    Write-Host "Available projects: $($Projects.Keys -join ', ')" -ForegroundColor Yellow
    exit 1
}

$Project = $Projects[$ProjectName]
$EnvPath = Join-Path $PSScriptRoot ".." ".env.local"

try {
    # Read current .env.local
    $EnvContent = ""
    if (Test-Path $EnvPath) {
        $EnvContent = Get-Content $EnvPath -Raw
    }

    # Update Supabase variables
    $Updates = @{
        'NEXT_PUBLIC_SUPABASE_URL' = $Project.url
        'NEXT_PUBLIC_SUPABASE_ANON_KEY' = $Project.anon_key
        'SUPABASE_SERVICE_ROLE_KEY' = $Project.service_role_key
    }

    foreach ($Key in $Updates.Keys) {
        $Value = $Updates[$Key]
        $Pattern = "^$Key=.*$"
        
        if ($EnvContent -match $Pattern) {
            $EnvContent = $EnvContent -replace $Pattern, "$Key=$Value"
        } else {
            $EnvContent += "`n$Key=$Value"
        }
    }

    # Write updated .env.local
    $EnvContent.Trim() + "`n" | Set-Content $EnvPath -NoNewline

    Write-Host "✅ Switched to Supabase project: $ProjectName" -ForegroundColor Green
    Write-Host "📍 URL: $($Project.url)" -ForegroundColor Cyan
    Write-Host "🔄 Restart your development server to apply changes." -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error switching project: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}