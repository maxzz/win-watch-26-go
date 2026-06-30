$ErrorActionPreference = "Stop"

$deadline = (Get-Date).AddMinutes(2)
$targetPid = 0
while ((Get-Date) -lt $deadline) {
    $proc = Get-Process -Name "wwatch26" -ErrorAction SilentlyContinue |
        Sort-Object StartTime -Descending |
        Select-Object -First 1
    if ($proc) {
        $targetPid = $proc.Id
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $targetPid) {
    Write-Error "Timed out waiting for wwatch26.exe (is wails dev running?)"
    exit 1
}

Get-Process -Name "dlv" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Attaching Delve to wwatch26.exe (PID $targetPid) on :2345"

# Use an argument array: PowerShell treats bare `--flag` tokens as the `--`
# decrement operator, which breaks line-continued dlv invocations.
$dlvArgs = @(
    "attach", "$targetPid",
    "--headless",
    "--listen=:2345",
    "--api-version=2",
    "--accept-multiclient",
    "--check-go-version=false",
    "--only-same-user=false",
    "--continue"
)

# Delve writes its startup banner to stderr; with $ErrorActionPreference = Stop
# PowerShell treats that as a terminating error and kills the attach session.
$ErrorActionPreference = "Continue"
& dlv @dlvArgs
