# Run this from: C:\Users\mariu\Projects\01. Deal Tracker\dealflow
# Make sure you unzipped dealflow-merge.zip to your Downloads folder first

$src = "$env:USERPROFILE\Downloads\dealflow-merge"
$dst = "."

# 1. Copy new pages folder
New-Item -ItemType Directory -Force -Path "src\pages" | Out-Null
Copy-Item "$src\src\pages\ModeSelectorPage.jsx" "src\pages\ModeSelectorPage.jsx" -Force

# 2. Copy sell-side component + styles
New-Item -ItemType Directory -Force -Path "src\components\sell-side" | Out-Null
Copy-Item "$src\src\components\sell-side\SellShell.jsx"  "src\components\sell-side\SellShell.jsx"  -Force
Copy-Item "$src\src\components\sell-side\ssStyles.js"    "src\components\sell-side\ssStyles.js"    -Force

# 3. Copy sell-side views
New-Item -ItemType Directory -Force -Path "src\views\sell-side" | Out-Null
Copy-Item "$src\src\views\sell-side\SSDashboard.jsx" "src\views\sell-side\SSDashboard.jsx" -Force
Copy-Item "$src\src\views\sell-side\SSProcesses.jsx" "src\views\sell-side\SSProcesses.jsx" -Force
Copy-Item "$src\src\views\sell-side\SSBuyers.jsx"    "src\views\sell-side\SSBuyers.jsx"    -Force
Copy-Item "$src\src\views\sell-side\SSBids.jsx"      "src\views\sell-side\SSBids.jsx"      -Force
Copy-Item "$src\src\views\sell-side\SSDataRoom.jsx"  "src\views\sell-side\SSDataRoom.jsx"  -Force

# 4. Replace App.jsx
Copy-Item "$src\src\App.jsx" "src\App.jsx" -Force

# 5. Commit and push
git add .
git commit -m "Add sell-side platform: mode selector, buyer universe, bid tracking, data room"
git push origin main

Write-Host ""
Write-Host "Done! Vercel will deploy in ~60 seconds." -ForegroundColor Green
Write-Host "Watch it at: https://vercel.com/mb-8192s-projects/dealflow" -ForegroundColor Cyan
