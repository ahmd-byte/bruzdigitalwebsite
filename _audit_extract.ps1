$root = "c:\Users\Truly\OneDrive - lepaklab (1)\bruz digital\downloaded-site"
$results = New-Object System.Collections.ArrayList

function Add-Ref($file, $kind, $val) {
    if ([string]::IsNullOrWhiteSpace($val)) { return }
    $null = $results.Add([pscustomobject]@{ Source = $file; Kind = $kind; Ref = $val.Trim() })
}

$htmlFiles = Get-ChildItem -Path $root -Filter *.html
foreach ($f in $htmlFiles) {
    $c = Get-Content $f.FullName -Raw
    foreach ($m in [regex]::Matches($c, '(?i)\bsrc\s*=\s*["'']([^"'']+)["'']')) { Add-Ref $f.Name 'src' $m.Groups[1].Value }
    foreach ($m in [regex]::Matches($c, '(?i)\bhref\s*=\s*["'']([^"'']+)["'']')) { Add-Ref $f.Name 'href' $m.Groups[1].Value }
    foreach ($m in [regex]::Matches($c, '(?i)\bposter\s*=\s*["'']([^"'']+)["'']')) { Add-Ref $f.Name 'poster' $m.Groups[1].Value }
    foreach ($m in [regex]::Matches($c, '(?i)\bdata-src\s*=\s*["'']([^"'']+)["'']')) { Add-Ref $f.Name 'data-src' $m.Groups[1].Value }
    foreach ($m in [regex]::Matches($c, '(?i)\bsrcset\s*=\s*["'']([^"'']+)["'']')) {
        foreach ($part in $m.Groups[1].Value -split ',') {
            $u = ($part.Trim() -split '\s+')[0]
            Add-Ref $f.Name 'srcset' $u
        }
    }
    foreach ($m in [regex]::Matches($c, '(?i)url\(\s*["'']?([^"''\)]+)["'']?\s*\)')) { Add-Ref $f.Name 'inline-css-url' $m.Groups[1].Value }
    foreach ($m in [regex]::Matches($c, '(?i)\bcontent\s*=\s*["'']([^"'']*(?:\.png|\.jpg|\.jpeg|\.webp|\.svg|\.mp4|\.gif)[^"'']*)["'']')) { Add-Ref $f.Name 'meta-content' $m.Groups[1].Value }
}

$css = Join-Path $root 'public\css\style.css'
$cc = Get-Content $css -Raw
foreach ($m in [regex]::Matches($cc, '(?i)url\(\s*["'']?([^"''\)]+)["'']?\s*\)')) { Add-Ref 'public/css/style.css' 'css-url' $m.Groups[1].Value }

$js = Join-Path $root 'public\js\main.js'
$jc = Get-Content $js -Raw
foreach ($m in [regex]::Matches($jc, '(?i)["''`]([^"''`]*(?:\.png|\.jpg|\.jpeg|\.webp|\.svg|\.mp4|\.gif|\.ttf|\.woff2?|\.css|\.js|\.json)(?:\?[^"''`]*)?)["''`]')) { Add-Ref 'public/js/main.js' 'js-path' $m.Groups[1].Value }
foreach ($m in [regex]::Matches($jc, '(?i)(fetch|XMLHttpRequest|\.open)\s*\(\s*["''`]?([^"''`\)]*)')) { Add-Ref 'public/js/main.js' 'js-net' $m.Groups[2].Value }
foreach ($m in [regex]::Matches($jc, '(?i)url\(\s*["'']?([^"''\)]+)["'']?\s*\)')) { Add-Ref 'public/js/main.js' 'js-css-url' $m.Groups[1].Value }

$results | Sort-Object Ref, Source | Format-Table -AutoSize -Wrap
Write-Host "TOTAL_RAW_REFS: $($results.Count)"
$results | Export-Csv -NoTypeInformation -Path "c:\Users\Truly\OneDrive - lepaklab (1)\bruz digital\_audit_refs.csv"
