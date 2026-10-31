$root = "c:\Users\Truly\OneDrive - lepaklab (1)\bruz digital\downloaded-site"
$refs = Import-Csv "c:\Users\Truly\OneDrive - lepaklab (1)\bruz digital\_audit_refs.csv"

$out = @()
foreach ($g in ($refs | Group-Object Ref)) {
    $r = $g.Name
    if ($r -match '^(https?:)?//') { $cat = 'external'; $path = $null }
    elseif ($r -match '^(data:|mailto:|tel:|javascript:|#)') { $cat = 'inline/anchor'; $path = $null }
    else {
        $cat = 'local'
        $clean = ($r -split '[?#]')[0]
        if ($clean -like '/*') { $path = Join-Path $root ($clean.TrimStart('/') -replace '/','\') }
        elseif ($clean -like '../*') { $path = Join-Path $root ('public\' + ($clean.Substring(3) -replace '/','\')) }
        else { $path = Join-Path $root ($clean -replace '/','\') }
    }
    $exists = if ($path) { Test-Path -LiteralPath $path } else { 'n/a' }
    $out += [pscustomobject]@{
        Ref = $r
        Category = $cat
        Count = $g.Count
        Sources = (($g.Group.Source | Select-Object -Unique) -join ',')
        Exists = $exists
        Resolved = $path
    }
}

Write-Host "=== LOCAL REFS MISSING ON DISK ==="
$out | Where-Object { $_.Category -eq 'local' -and $_.Exists -eq $false } | Format-Table Ref,Count,Sources,Resolved -AutoSize -Wrap

Write-Host "=== EXTERNAL REFS ==="
$out | Where-Object { $_.Category -eq 'external' } | Format-Table Ref,Count,Sources -AutoSize -Wrap

Write-Host "=== SUMMARY ==="
$localAll = $out | Where-Object { $_.Category -eq 'local' }
$localAssets = $localAll | Where-Object { $_.Ref -notmatch '\.html$' }
Write-Host ("Unique refs total: " + $out.Count)
Write-Host ("Unique local refs: " + $localAll.Count + " (present: " + ($localAll | Where-Object {$_.Exists -eq $true}).Count + ", missing: " + ($localAll | Where-Object {$_.Exists -eq $false}).Count + ")")
Write-Host ("Unique local NON-html assets: " + $localAssets.Count + " (present: " + ($localAssets | Where-Object {$_.Exists -eq $true}).Count + ", missing: " + ($localAssets | Where-Object {$_.Exists -eq $false}).Count + ")")
Write-Host ("Unique external refs: " + ($out | Where-Object {$_.Category -eq 'external'}).Count)
Write-Host ("Unique inline/anchor refs: " + ($out | Where-Object {$_.Category -eq 'inline/anchor'}).Count)

$out | Export-Csv -NoTypeInformation "c:\Users\Truly\OneDrive - lepaklab (1)\bruz digital\_audit_check.csv"

Write-Host "=== FILES ON DISK NOT REFERENCED ==="
$referenced = @{}
foreach ($o in $localAll) { if ($o.Resolved) { $referenced[$o.Resolved.ToLower()] = $true } }
Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
    if (-not $referenced.ContainsKey($_.FullName.ToLower())) { Write-Host ("UNREFERENCED: " + $_.FullName.Substring($root.Length+1) + "  (" + $_.Length + " bytes)") }
}
