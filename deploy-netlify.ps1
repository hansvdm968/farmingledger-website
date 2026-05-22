param(
  [Parameter(Mandatory = $true)]
  [string]$Token,

  [string]$SiteName = "farmingledger-co-za"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $root "farming-ledger-site.zip"

if (-not (Test-Path -LiteralPath $zipPath)) {
  throw "Missing deploy package: $zipPath"
}

$headers = @{
  Authorization = "Bearer $Token"
}

$jsonHeaders = @{
  Authorization = "Bearer $Token"
  "Content-Type" = "application/json"
}

$createBody = @{
  name = $SiteName
  processing_settings = @{
    html = @{
      pretty_urls = $true
    }
  }
} | ConvertTo-Json -Depth 5

try {
  $site = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.netlify.com/api/v1/sites" `
    -Headers $jsonHeaders `
    -Body $createBody
} catch {
  $fallbackName = "$SiteName-$(Get-Random -Minimum 1000 -Maximum 9999)"
  $fallbackBody = @{
    name = $fallbackName
    processing_settings = @{
      html = @{
        pretty_urls = $true
      }
    }
  } | ConvertTo-Json -Depth 5

  $site = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.netlify.com/api/v1/sites" `
    -Headers $jsonHeaders `
    -Body $fallbackBody
}

$zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
$deploy = Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.netlify.com/api/v1/sites/$($site.id)/deploys" `
  -Headers $headers `
  -ContentType "application/zip" `
  -Body $zipBytes

$deployId = $deploy.id
$state = $deploy.state
$deadline = (Get-Date).AddMinutes(3)

while ($state -ne "ready" -and (Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 4
  $deploy = Invoke-RestMethod `
    -Method Get `
    -Uri "https://api.netlify.com/api/v1/deploys/$deployId" `
    -Headers $headers
  $state = $deploy.state
}

[PSCustomObject]@{
  SiteId = $site.id
  SiteName = $site.name
  Url = $site.ssl_url
  AdminUrl = $site.admin_url
  DeployId = $deployId
  DeployState = $state
}
