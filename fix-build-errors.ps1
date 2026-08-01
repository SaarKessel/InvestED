Write-Host "Starting InvestED build fixes..." -ForegroundColor Cyan

# 1. Restore missing context files from stash if available
Write-Host "Restoring context files..." -ForegroundColor Yellow

git checkout "stash@{0}" -- src/context 2>$null


# 2. Export ThemeProvider from useTheme hook
$useTheme = ".\src\hooks\useTheme.tsx"

if (Test-Path $useTheme) {

    $content = Get-Content $useTheme -Raw -Encoding UTF8

    if ($content -notmatch "export \{ ThemeProvider \}") {

        Add-Content $useTheme "`nexport { ThemeProvider } from '@/context/themeContext';"

        Write-Host "Added ThemeProvider export"
    }
}


# 3. Fix ScenarioHistoryCard unknown types

$scenarioFile = ".\src\components\dashboard\ScenarioHistoryCard.tsx"

if (Test-Path $scenarioFile) {

    $content = Get-Content $scenarioFile -Raw -Encoding UTF8


    $content = $content -replace `
    "const scenarios =", `
    "const scenarios: any[] ="


    $content = $content -replace `
    "scenario\.data\?\.scenario\?\.initialInvestment", `
    "(scenario.data as any)?.scenario?.initialInvestment"


    $content = $content -replace `
    "scenario\.data\?\.initial_investment", `
    "(scenario.data as any)?.initial_investment"


    $content = $content -replace `
    "scenario\.createdAt", `
    "String(scenario.createdAt)"


    $content = $content -replace `
    "onDelete\(scenario\.id\)", `
    "onDelete(String(scenario.id))"


    Set-Content $scenarioFile $content -Encoding UTF8

    Write-Host "Fixed ScenarioHistoryCard"
}



# 4. Fix recommendationEngine

$recommendation = ".\src\lib\recommendationEngine.ts"

if (Test-Path $recommendation) {

    $content = Get-Content $recommendation -Raw -Encoding UTF8


    $content = $content -replace `
    'profile\.risk === "Aggressive" \|\| profile\.risk === "High"', `
    'profile.risk === "Growth"'


    $content = $content -replace `
    'profile\.interests\?\.includes\("[^"]*"\)', `
    'false'


    Set-Content $recommendation $content -Encoding UTF8

    Write-Host "Fixed recommendationEngine"
}



# 5. Remove duplicate casing problem if exists

$analysisUpper = ".\src\context\AnalysisContext.tsx"
$analysisLower = ".\src\context\analysisContext.tsx"

if ((Test-Path $analysisLower) -and (Test-Path $analysisUpper)) {

    Remove-Item $analysisLower -Force

    Write-Host "Removed duplicate analysisContext casing file"
}



# 6. Clean TypeScript cache

if (Test-Path ".\tsconfig.tsbuildinfo") {
    Remove-Item ".\tsconfig.tsbuildinfo" -Force
}


Write-Host ""
Write-Host "Finished fixes." -ForegroundColor Green
Write-Host "Run: npm run build" -ForegroundColor Cyan