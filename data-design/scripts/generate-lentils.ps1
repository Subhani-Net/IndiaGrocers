# Generates lentils-master.csv and lentils-master.json from Natco Shopify JSON
# Usage: .\scripts\generate-lentils.ps1

$ErrorActionPreference = "Stop"

$sourceFile = "C:\Users\Subhani\.local\share\opencode\tool-output\tool_e727f970c001iGsCnPszJ3NkKU"
$designDir = "$PSScriptRoot\.."
$csvFile = "$designDir\lentils-master.csv"
$jsonFile = "$designDir\lentils-master.json"

$json = Get-Content $sourceFile -Raw | ConvertFrom-Json

$now = Get-Date -Format "yyyy-MM-dd"
$nowISO = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

function Get-Subcategory {
    param($productType, $title, $handle)
    # Soya-beans within Beans type → soya-products
    if ($productType -eq "Beans" -and ($title -match "soya" -or $handle -match "soya")) {
        return "soya-products"
    }
    switch ($productType) {
        "Lentils" { return "dried-lentils-beans-peas" }
        "Beans"   { return "dried-lentils-beans-peas" }
        "Tinned Lentils, Beans" { return "tinned-lentils-beans" }
        "Soya"    { return "soya-products" }
        "Daria Lentil Snack" { return "namkeen-lentil-snacks" }
        default   { return "UNKNOWN" }
    }
}

function Get-VariantWeight {
    param($title)
    if ($title -match '(\d+(?:\.\d+)?(?:\s*x\s*\d+(?:\.\d+)?)?\s*(?:kg|g))$') {
        return $matches[1] -replace '\s', ''
    }
    if ($title -match '(\d+(?:\.\d+)?\s*(?:kg|g))') {
        return $matches[1] -replace '\s', ''
    }
    return ""
}

$products = @()

foreach ($p in $json.products) {
    $natcoSub = Get-Subcategory -productType $p.product_type -title $p.title -handle $p.handle
    $weight = Get-VariantWeight -title $p.title

    $products += [PSCustomObject]@{
        natco_handle      = $p.handle
        title             = $p.title
        variant_weight    = $weight
        natco_type        = $p.product_type
        natco_subcategory = $natcoSub
        our_subcategory   = $natcoSub
        in_our_catalog    = "UNKNOWN"
        our_product_id    = ""
        match_status      = "NEEDS_REVIEW"
    }
}

# Sort alphabetically by natco_handle
$products = $products | Sort-Object natco_handle

function Format-CsvField {
    param($val)
    if ($val -match '[,"\n\r]') {
        return '"' + $val.Replace('"', '""') + '"'
    }
    return $val
}

# --- Write CSV ---
$csvHeader = "natco_handle,title,variant_weight,natco_type,natco_subcategory,our_subcategory,in_our_catalog,our_product_id,match_status"
$csvLines = @($csvHeader)

foreach ($p in $products) {
    $fields = @(
        (Format-CsvField $p.natco_handle),
        (Format-CsvField $p.title),
        (Format-CsvField $p.variant_weight),
        (Format-CsvField $p.natco_type),
        (Format-CsvField $p.natco_subcategory),
        (Format-CsvField $p.our_subcategory),
        (Format-CsvField $p.in_our_catalog),
        (Format-CsvField $p.our_product_id),
        (Format-CsvField $p.match_status)
    )
    $csvLines += ($fields -join ',')
}

[System.IO.File]::WriteAllLines($csvFile, $csvLines, [System.Text.UTF8Encoding]::new($true))
Write-Output "Wrote $($products.Count) rows to $csvFile"

# --- Write JSON ---
$jsonObj = @{
    _meta = @{
        source        = "https://shop.natcofoods.com/collections/all-lentils/products.json"
        fetched       = "2026-05-28"
        total         = $products.Count
        version       = "v1"
        snapshot_date = $nowISO
    }
    products = @($products | ForEach-Object {
        @{
            natco_handle      = $_.natco_handle
            title             = $_.title
            variant_weight    = $_.variant_weight
            natco_type        = $_.natco_type
            natco_subcategory = $_.natco_subcategory
            our_subcategory   = $_.our_subcategory
            in_our_catalog    = $_.in_our_catalog
            our_product_id    = $_.our_product_id
            match_status      = $_.match_status
        }
    })
}

$jsonStr = $jsonObj | ConvertTo-Json -Depth 4 -Compress
# Pretty-print the _meta and products array separately for readability
$metaStr = ($jsonObj._meta | ConvertTo-Json -Depth 3 -Compress)
$productsStr = ($jsonObj.products | ConvertTo-Json -Depth 3 -Compress)
$prettyJson = "{`n  `"_meta`": $metaStr,`n  `"products`": $productsStr`n}`n"

[System.IO.File]::WriteAllText($jsonFile, $prettyJson, [System.Text.UTF8Encoding]::new($true))
Write-Output "Wrote JSON to $jsonFile"

Write-Output "Done."
