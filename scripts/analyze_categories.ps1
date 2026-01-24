$path = "src/data/restaurants.js"
$content = Get-Content $path -Raw

# Extract all categories using regex
$categories = $content | Select-String -Pattern '"category":\s*\[(.*?)\]' -AllMatches | % { $_.Matches } | % { $_.Groups[1].Value } 

# Clean up and split
$allCats = @()
foreach ($catList in $categories) {
    # Remove quotes and whitespace
    $cleanList = $catList -replace '"', '' -replace '\s', ''
    $cats = $cleanList -split ','
    $allCats += $cats
}

# Group and count
$allCats | Group-Object | Sort-Object Count -Descending | Select-Object Count, Name
