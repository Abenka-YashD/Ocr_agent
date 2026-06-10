# Creates colab-upload.zip for Google Colab (minimal files only).
$root = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $env:TEMP "extractory-colab-upload"
$zipPath = Join-Path $root "colab-upload.zip"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $staging "colab") -Force | Out-Null

Copy-Item (Join-Path $root "colab\ocr_server.py") (Join-Path $staging "colab\") -Force
Copy-Item (Join-Path $root "colab\requirements.txt") (Join-Path $staging "colab\") -Force
if (Test-Path (Join-Path $root "colab\__init__.py")) {
  Copy-Item (Join-Path $root "colab\__init__.py") (Join-Path $staging "colab\") -Force
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created: $zipPath"
Write-Host "Upload this zip in Colab (cell 2) or via Files sidebar."
