# Markdown Export Feature

## Overview

The Markdown Export feature allows Pro and Lifetime users to download their generated courses as clean, formatted Markdown files. This feature is perfect for:

- Creating documentation
- Sharing course content
- Importing into other platforms
- Version control with Git
- Creating printed materials

## Features

### ✅ What's Included

- **Complete Course Content**: All modules with full content
- **Course Overview**: Extracted from the first module
- **Table of Contents**: Auto-generated with anchor links
- **Module Structure**: Properly formatted headers and sections
- **Key Takeaways**: Formatted as numbered lists
- **Course Metadata**: Reading time, module count, generation date
- **Clean Formatting**: Optimized for readability and compatibility

### 📋 Markdown Structure

```markdown
# Course Title

---
**Course Information**
- Source: tweet/thread/manual
- Generated: MM/DD/YYYY
- Modules: X
- Estimated Reading Time: X minutes
---

## Course Overview
[Extracted from first module]

## Table of Contents
1. [Module 1: Title](#module-1-title)
2. [Module 2: Title](#module-2-title)
...

## Module 1: Title
**Estimated Reading Time**: X minutes
**Key Takeaways**: X

[Full module content]

### 🎯 Key Takeaways
1. **Takeaway 1** - Description
2. **Takeaway 2** - Description
...

---

## Course Summary
[Auto-generated summary with statistics]
```

## Usage

### For Users

1. **Generate a Course**: Create your course using the normal process
2. **Click "Download Markdown"**: Available for Pro/Lifetime users only
3. **File Downloads**: Automatically downloads as `course-title.md`

### For Developers

#### API Endpoint
```typescript
POST /api/export-markdown
Content-Type: application/json

{
  "courseId": "string",
  "courseData": Course
}
```

#### Response
- **Success**: Returns markdown content as `text/markdown`
- **Error**: Returns JSON error with appropriate status code

#### Error Codes
- `400`: Invalid course data
- `401`: Authentication required
- `403`: Subscription required (Pro/Lifetime only)
- `500`: Server error

## Implementation Details

### Content Processing

1. **Header Extraction**: Pulls course overview from first module
2. **Content Cleaning**: Removes UI-specific text and formatting
3. **Link Generation**: Creates anchor links for table of contents
4. **Filename Sanitization**: Ensures safe filenames for download

### Security

- **Authentication Required**: Must be signed in
- **Subscription Check**: Pro/Lifetime users only
- **Usage Logging**: Tracks exports for analytics
- **Input Validation**: Validates course data structure

### File Format

- **Encoding**: UTF-8
- **Line Endings**: Unix-style (`\n`)
- **Extension**: `.md`
- **MIME Type**: `text/markdown; charset=utf-8`

## Testing

### Unit Tests
```bash
npm test -- export-markdown.test.ts
```

### Integration Testing
```typescript
import { testMarkdownExport } from '@/test/export-markdown.test';

const result = await testMarkdownExport(courseData);
console.log(result.validation);
```

### Manual Testing

1. Generate a course
2. Ensure you have Pro/Lifetime subscription
3. Click "Download Markdown" button
4. Verify file downloads correctly
5. Open file and check formatting

## Troubleshooting

### Common Issues

**"Subscription Required" Error**
- Solution: Upgrade to Pro or Lifetime subscription

**"Authentication Required" Error**
- Solution: Sign in to your account

**Empty or Corrupted File**
- Check course data is complete
- Verify network connection
- Try regenerating the course

**Download Not Starting**
- Check browser popup blockers
- Ensure JavaScript is enabled
- Try different browser

### Debug Information

In development mode, the Content Inspector shows:
- Content length for each module
- Total character count
- Raw content preview
- Module structure validation

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Future Enhancements

- [ ] Custom formatting options
- [ ] Multiple export formats (HTML, PDF)
- [ ] Batch export for multiple courses
- [ ] Template customization
- [ ] Integration with Git repositories