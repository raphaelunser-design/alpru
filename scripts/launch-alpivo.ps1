$ErrorActionPreference = "SilentlyContinue"
Add-Type -AssemblyName System.Windows.Forms

$ProjectPath = "C:\Users\RaphaelUnser\Documents\ski-match"
$Port = 3002
$Url = "http://localhost:$Port"
$LogDir = Join-Path $ProjectPath ".alpivo-launcher"
$OutLog = Join-Path $LogDir "server.out.log"
$ErrLog = Join-Path $LogDir "server.err.log"

function Test-AlpivoServer {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Wait-AlpivoServer {
  param([int]$Seconds = 60)
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-AlpivoServer) {
      return $true
    }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not (Test-Path (Join-Path $ProjectPath ".next\BUILD_ID"))) {
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "build") -WorkingDirectory $ProjectPath -Wait -WindowStyle Normal
}

if (-not (Test-AlpivoServer)) {
  Remove-Item -LiteralPath $OutLog, $ErrLog -Force -ErrorAction SilentlyContinue
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "start", "--", "-p", "$Port") `
    -WorkingDirectory $ProjectPath `
    -WindowStyle Minimized `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog | Out-Null

  if (-not (Wait-AlpivoServer -Seconds 75)) {
    Start-Process -FilePath "notepad.exe" -ArgumentList $ErrLog
    [System.Windows.Forms.MessageBox]::Show(
      "Alpivo konnte nicht automatisch gestartet werden. Ich habe die Fehler-Logdatei geöffnet.",
      "Alpivo Starter"
    ) | Out-Null
    exit 1
  }
}

Start-Process $Url
