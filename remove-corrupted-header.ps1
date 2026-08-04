$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {

    Write-Host "Fixing:" $file.FullName

    $content = Get-Content $file.FullName -Raw

    # remove corrupted BOM text
    $content = $content -replace "^׳»ֲ¿", ""
    $content = $content -replace "^ï»¿", ""
    $content = $content -replace "^\uFEFF", ""

    [System.IO.File]::WriteAllText(
        $file.FullName,
        $content,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

Write-Host "DONE"