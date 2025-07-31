# Claude 503 Error Debugging Guide

## Current Status
- ✅ Claude API is working (test confirmed)
- ✅ API key is configured correctly
- ❌ Course generation returning 503 error

## Debugging Steps Added

### 1. Enhanced Logging
- Added detailed JSON parsing logs
- Added module processing logs
- Added error details in API response

### 2. Improved Error Handling
- Better JSON parsing error handling
- Flexible title field handling (`title` or `courseTitle`)
- More robust module validation

### 3. Relaxed Validation
- Changed from 5-10 modules to minimum 3 modules
- Better handling of different JSON structures

## How to Debug

### 1. Check Server Logs
When you make a request, look for these logs:
- `🚀 Starting Claude course generation...`
- `✅ JSON parsing successful`
- `🔍 Claude response structure:`
- `📝 Claude response preview:`
- `🔄 Processing modules...`

### 2. Check Browser Network Tab
Look for the API response to see the exact error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "retryable": true/false
  }
}
```

### 3. Common Issues & Solutions

#### Issue: `PARSE_ERROR`
- **Cause**: Claude returned invalid JSON
- **Solution**: Check the raw response in logs

#### Issue: `INVALID_FORMAT`
- **Cause**: Missing title or modules in response
- **Solution**: Check Claude response structure

#### Issue: `INVALID_MODULE_COUNT`
- **Cause**: Less than 3 modules returned
- **Solution**: Adjust prompt or validation

#### Issue: `CLAUDE_CREDITS_EXHAUSTED`
- **Cause**: Insufficient credits in Anthropic account
- **Solution**: Add credits at console.anthropic.com

## Next Steps

1. **Make a test request** and check the server logs
2. **Identify the specific error** from the logs
3. **Apply the appropriate fix** based on the error type

The enhanced debugging should now show exactly what's causing the 503 error.