$files = Get-ChildItem -Path ".\src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx

foreach ($file in $files) {

    Write-Host "Fixing $($file.FullName)"

    $content = Get-Content $file.FullName -Raw -Encoding Default

    Set-Content `
        -Path $file.FullName `
        -Value $content `
        -Encoding UTF8
}

Write-Host "UTF-8 conversion completed" -ForegroundColor Green