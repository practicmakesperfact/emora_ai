# Emora API Integration Test
$base = "http://localhost:8000/api/v1"

Write-Host "--- Emora API Integration Test ---" -ForegroundColor Cyan

# ── 1. Login ───────────────────────────────────────────────────────────────────
try {
    $loginBody = @{ email = "testuser@gmail.com"; password = "testpass123" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $resp.access_token
    Write-Host "OK  Login            token: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "FAIL Login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# ── 2. Get Me ──────────────────────────────────────────────────────────────────
try {
    $me = Invoke-RestMethod -Uri "$base/users/me" -Method GET -Headers $headers
    Write-Host "OK  GET /users/me    user=$($me.full_name)  role=$($me.role.name)" -ForegroundColor Green
} catch { Write-Host "FAIL GET /users/me: $($_.Exception.Message)" -ForegroundColor Red }

# ── 3. Create Conversation ────────────────────────────────────────────────────
try {
    $convBody = @{ title = "Test Conversation" } | ConvertTo-Json
    $conv = Invoke-RestMethod -Uri "$base/chat" -Method POST -ContentType "application/json" -Headers $headers -Body $convBody
    Write-Host "OK  POST /chat       conversation_id=$($conv.id)" -ForegroundColor Green
} catch { Write-Host "FAIL POST /chat: $($_.Exception.Message)" -ForegroundColor Red }

# ── 4. List Conversations ─────────────────────────────────────────────────────
try {
    $convList = Invoke-RestMethod -Uri "$base/chat" -Method GET -Headers $headers
    Write-Host "OK  GET /chat        count=$($convList.Count)" -ForegroundColor Green
} catch { Write-Host "FAIL GET /chat: $($_.Exception.Message)" -ForegroundColor Red }

# ── 5. Log Mood ───────────────────────────────────────────────────────────────
try {
    $moodBody = @{ score = 7; mood_notes = "Feeling good today"; emotions = @("happy","calm") } | ConvertTo-Json
    $mood = Invoke-RestMethod -Uri "$base/mood" -Method POST -ContentType "application/json" -Headers $headers -Body $moodBody
    Write-Host "OK  POST /mood       mood_id=$($mood.id)  score=$($mood.score)" -ForegroundColor Green
} catch { Write-Host "FAIL POST /mood: $($_.Exception.Message)" -ForegroundColor Red }

# ── 6. Mood History ───────────────────────────────────────────────────────────
try {
    $history = Invoke-RestMethod -Uri "$base/mood/history?period=weekly" -Method GET -Headers $headers
    Write-Host "OK  GET /mood/history count=$($history.Count)" -ForegroundColor Green
} catch { Write-Host "FAIL GET /mood/history: $($_.Exception.Message)" -ForegroundColor Red }

# ── 7. Mood Trends ────────────────────────────────────────────────────────────
try {
    $trends = Invoke-RestMethod -Uri "$base/mood/trends" -Method GET -Headers $headers
    Write-Host "OK  GET /mood/trends  avg=$($trends.average_score)" -ForegroundColor Green
} catch { Write-Host "FAIL GET /mood/trends: $($_.Exception.Message)" -ForegroundColor Red }

# ── 8. Create Journal ─────────────────────────────────────────────────────────
try {
    $journalBody = @{ content = "Today was a productive and calm day. I felt focused and achieved my goals." } | ConvertTo-Json
    $journal = Invoke-RestMethod -Uri "$base/journal" -Method POST -ContentType "application/json" -Headers $headers -Body $journalBody
    Write-Host "OK  POST /journal    journal_id=$($journal.id)  summary=$($journal.ai_summary)" -ForegroundColor Green
} catch { Write-Host "FAIL POST /journal: $($_.Exception.Message)" -ForegroundColor Red }

# ── 9. Journal History ────────────────────────────────────────────────────────
try {
    $journals = Invoke-RestMethod -Uri "$base/journal/history" -Method GET -Headers $headers
    Write-Host "OK  GET /journal/history count=$($journals.Count)" -ForegroundColor Green
} catch { Write-Host "FAIL GET /journal/history: $($_.Exception.Message)" -ForegroundColor Red }

# ── 10. Crisis Incidents (Counselor/Admin only) ────────────────────────────────
try {
    $incidents = Invoke-RestMethod -Uri "$base/crisis/incidents" -Method GET -Headers $headers
    Write-Host "OK  GET /crisis/incidents count=$($incidents.Count)" -ForegroundColor Green
} catch { Write-Host "WARN GET /crisis/incidents (requires Counselor/Admin role): $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow }

# ── 11. Documents List (Admin only) ───────────────────────────────────────────
try {
    $docs = Invoke-RestMethod -Uri "$base/documents" -Method GET -Headers $headers
    Write-Host "OK  GET /documents   count=$($docs.Count)" -ForegroundColor Green
} catch { Write-Host "WARN GET /documents (requires Admin role): $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow }

Write-Host ""
Write-Host "--- Test complete ---" -ForegroundColor Cyan
