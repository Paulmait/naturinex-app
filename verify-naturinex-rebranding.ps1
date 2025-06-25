# 🔍 Naturinex Rebranding Verification Script

Write-Host "🔍 Verifying Naturinex rebranding completion..." -ForegroundColor Green

$baseDir = "c:\Users\maito\mediscan-app"
$oldTerms = @("MediScan", "Mediscan", "mediscan", "MEDISCAN")
$excludeFiles = @("node_modules", ".git", "build", "dist", "coverage", "rebrand-to-naturinex.ps1", "NATURINEX_REBRANDING_COMPLETE.md")

Write-Host "📂 Scanning for any remaining old brand references..." -ForegroundColor Yellow

$foundIssues = @()

# Search for old brand terms
foreach ($term in $oldTerms) {
    $files = Get-ChildItem -Path $baseDir -Recurse -Include "*.md", "*.js", "*.json", "*.html", "*.css" | Where-Object {
        $exclude = $false
        foreach ($excludeDir in $excludeFiles) {
            if ($_.FullName -like "*$excludeDir*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match [regex]::Escape($term)) {
            $foundIssues += "❌ Found '$term' in: $($file.FullName)"
        }
    }
}

if ($foundIssues.Count -eq 0) {
    Write-Host "✅ No old brand references found!" -ForegroundColor Green
    Write-Host "🎉 Rebranding verification PASSED!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Found $($foundIssues.Count) remaining references:" -ForegroundColor Yellow
    foreach ($issue in $foundIssues) {
        Write-Host $issue -ForegroundColor Red
    }
}

# Check key files for correct new branding
Write-Host "`n📋 Checking key files for Naturinex branding..." -ForegroundColor Yellow

$keyChecks = @(
    @{ File = "package.json"; Pattern = "naturinex-app" }
    @{ File = "client\src\firebase.js"; Pattern = "naturinex-b6252" }
    @{ File = "firestore.rules"; Pattern = "admin@naturinex.com" }
    @{ File = "README.md"; Pattern = "Naturinex App" }
    @{ File = "client\public\manifest.json"; Pattern = "Naturinex" }
)

$passedChecks = 0
foreach ($check in $keyChecks) {
    $filePath = Join-Path $baseDir $check.File
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw
        if ($content -match [regex]::Escape($check.Pattern)) {
            Write-Host "✅ $($check.File): Contains '$($check.Pattern)'" -ForegroundColor Green
            $passedChecks++
        } else {
            Write-Host "❌ $($check.File): Missing '$($check.Pattern)'" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ $($check.File): File not found" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 Verification Summary:" -ForegroundColor Cyan
Write-Host "Key checks passed: $passedChecks / $($keyChecks.Count)" -ForegroundColor Cyan
Write-Host "Old references found: $($foundIssues.Count)" -ForegroundColor Cyan

if ($foundIssues.Count -eq 0 -and $passedChecks -eq $keyChecks.Count) {
    Write-Host "`n🎯 VERIFICATION RESULT: ✅ PASSED" -ForegroundColor Green
    Write-Host "🚀 Naturinex rebranding is complete and ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "`n🎯 VERIFICATION RESULT: ⚠️ NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "Please review and fix the issues above before deployment." -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor White
Write-Host "1. Create Firebase project: naturinex-b6252" -ForegroundColor White
Write-Host "2. Update Firebase configuration" -ForegroundColor White  
Write-Host "3. Test application locally" -ForegroundColor White
Write-Host "4. Deploy to production" -ForegroundColor White
