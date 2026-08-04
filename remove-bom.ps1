$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {

    Write-Host "Cleaning BOM:" $file.FullName

    $content = Get-Content $file.FullName -Raw

    $content = $content -replace "^\uFEFF", ""

    [System.IO.File]::WriteAllText(
        $file.FullName,
        $content,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

Write-Host "BOM cleanup finished"