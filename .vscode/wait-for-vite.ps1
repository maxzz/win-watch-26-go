$ErrorActionPreference = "Stop"

$deadline = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $deadline) {
    try {
        $open = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
        if ($open.TcpTestSucceeded) {
            Write-Host "Vite dev server is ready on http://localhost:5173"
            exit 0
        }
    } catch {
        # Test-NetConnection unavailable; fall back to a TCP probe.
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $client.Connect("localhost", 5173)
            Write-Host "Vite dev server is ready on http://localhost:5173"
            exit 0
        } catch {
        } finally {
            $client.Dispose()
        }
    }
    Start-Sleep -Milliseconds 300
}

Write-Error "Timed out waiting for Vite on http://localhost:5173 (is wails dev running?)"
exit 1
