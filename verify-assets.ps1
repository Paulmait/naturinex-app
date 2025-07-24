# Naturinex Asset Verification Script

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   NATURINEX ASSET VERIFICATION" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if icon exists
$iconPath = ".\assets\icon.png"
if (Test-Path $iconPath) {
    Write-Host "[✓] Icon file found" -ForegroundColor Green
    
    # Get image properties
    Add-Type -AssemblyName System.Drawing
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $iconPath))
    $width = $img.Width
    $height = $img.Height
    $img.Dispose()
    
    Write-Host "    Dimensions: $width x $height pixels" -ForegroundColor Yellow
    
    if ($width -eq 1024 -and $height -eq 1024) {
        Write-Host "[✓] Icon dimensions are correct (1024x1024)" -ForegroundColor Green
    } else {
        Write-Host "[✗] CRITICAL: Icon must be 1024x1024 pixels!" -ForegroundColor Red
        Write-Host "    Current: $width x $height" -ForegroundColor Red
        Write-Host "    Required: 1024 x 1024" -ForegroundColor Red
        Write-Host ""
        Write-Host "    To fix this:" -ForegroundColor Yellow
        Write-Host "    1. Use an image editor to resize to 1024x1024" -ForegroundColor White
        Write-Host "    2. Or use online tool: https://resizeimage.net/" -ForegroundColor White
    }
} else {
    Write-Host "[✗] Icon file not found at $iconPath" -ForegroundColor Red
}

Write-Host ""

# Check splash screen
$splashPath = ".\assets\splash.png"
if (Test-Path $splashPath) {
    Write-Host "[✓] Splash screen found" -ForegroundColor Green
    
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $splashPath))
    $width = $img.Width
    $height = $img.Height
    $img.Dispose()
    
    Write-Host "    Dimensions: $width x $height pixels" -ForegroundColor Yellow
    
    if ($width -ge 2436 -and $height -ge 1125) {
        Write-Host "[✓] Splash screen dimensions are sufficient" -ForegroundColor Green
    } else {
        Write-Host "[!] WARNING: Splash screen may be too small" -ForegroundColor Yellow
        Write-Host "    Recommended minimum: 2436 x 1125" -ForegroundColor Yellow
    }
} else {
    Write-Host "[✗] Splash screen not found at $splashPath" -ForegroundColor Red
}

Write-Host ""

# Check other required files
$requiredFiles = @(
    @{Path=".\app.json"; Name="App configuration"},
    @{Path=".\.env"; Name="Environment variables"},
    @{Path=".\src\firebase.js"; Name="Firebase configuration"},
    @{Path=".\eas.json"; Name="EAS Build configuration"}
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file.Path) {
        Write-Host "[✓] $($file.Name) found" -ForegroundColor Green
    } else {
        Write-Host "[✗] $($file.Name) missing at $($file.Path)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "To run this script:" -ForegroundColor Yellow
Write-Host "PowerShell.exe -ExecutionPolicy Bypass -File .\verify-assets.ps1" -ForegroundColor White
Write-Host ""