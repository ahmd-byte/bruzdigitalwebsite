# Reproduces the exact bug that corrupted the videos, in miniature.
# Four bytes of a real MP4 header, written two different ways.

$realBytes = [byte[]](0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70)  # ....ftyp

Write-Host "Source bytes : $(($realBytes | ForEach-Object { $_.ToString('x2') }) -join ' ')"
Write-Host "Source length: $($realBytes.Length) bytes"
Write-Host ""

# WRONG - what my original download script did
[System.IO.File]::WriteAllText("$PSScriptRoot\_wrong.bin", $realBytes)

# RIGHT - what it should have done
[System.IO.File]::WriteAllBytes("$PSScriptRoot\_right.bin", $realBytes)

foreach ($name in @("_wrong", "_right")) {
    $path = "$PSScriptRoot\$name.bin"
    $out  = [System.IO.File]::ReadAllBytes($path)
    $hex  = ($out | ForEach-Object { $_.ToString('x2') }) -join ' '
    $txt  = -join ($out | ForEach-Object { if ($_ -ge 32 -and $_ -lt 127) { [char]$_ } else { '.' } })
    $label = if ($name -eq "_wrong") { "WriteAllText " } else { "WriteAllBytes" }
    Write-Host "$label -> $($out.Length) bytes"
    Write-Host "                 hex: $hex"
    Write-Host "               ascii: $txt"
    Write-Host ""
}

Remove-Item "$PSScriptRoot\_wrong.bin", "$PSScriptRoot\_right.bin"
