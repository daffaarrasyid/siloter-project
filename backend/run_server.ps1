Write-Host "Menjalankan SILOTER FastAPI Backend melalui Virtual Environment..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
& .\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

