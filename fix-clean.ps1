$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {

    Write-Host $file.FullName

    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

    try {
        $encoding = [System.Text.Encoding]::GetEncoding(1255)
        $text = $encoding.GetString($bytes)

        [System.IO.File]::WriteAllText(
            $file.FullName,
            $text,
            (New-Object System.Text.UTF8Encoding($false))
        )
    }
    catch {
        Write-Host "Failed: $file"
    }
}

Write-Host "DONE"