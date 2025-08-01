@echo off
echo Testing course generation API...

curl -X POST http://localhost:3000/api/generate-course ^
  -H "Content-Type: application/json" ^
  -d "{\"content\": \"Productivity tip: Focus on one task at a time. Multitasking reduces efficiency.\", \"type\": \"text\"}"

echo.
echo Test completed.