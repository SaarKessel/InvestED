$files = @(
"src/lib/marketData.ts",
"src/lib/portfolioEngine.ts",
"src/lib/riskEngine.clean.ts"
)

foreach ($file in $files) {

    Write-Host "Fixing $file"

    $content = Get-Content $file -Raw -Encoding UTF8


    # InterestArea
    $content = $content -replace '׳[^"]*טכנולוגיה[^"]*׳?', 'טכנולוגיה'
    $content = $content -replace '׳[^"]*בריאות[^"]*׳?', 'בריאות'
    $content = $content -replace '׳[^"]*פיננסים[^"]*׳?', 'פיננסים'
    $content = $content -replace '׳[^"]*אנרגיה[^"]*׳?', 'אנרגיה'
    $content = $content -replace '׳[^"]*נדל[^"]*׳?', 'נדל\"ן'


    # InvestorType
    $content = $content -replace '׳[^"]*שמרני[^"]*׳?', 'משקיע שמרני'
    $content = $content -replace '׳[^"]*מאוזן[^"]*׳?', 'משקיע מאוזן'
    $content = $content -replace '׳[^"]*צמיחה[^"]*׳?', 'משקיע צמיחה'


    # HorizonBucket
    $content = $content -replace '׳[^"]*קצר[^"]*׳?', 'קצר'
    $content = $content -replace '׳[^"]*ארוך[^"]*׳?', 'ארוך'
    $content = $content -replace '׳[^"]*בינוני[^"]*׳?', 'בינוני'


    Set-Content $file $content -Encoding UTF8
}

Write-Host "Hebrew cleanup finished" -ForegroundColor Green