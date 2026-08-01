# Markdown Rendering Test Guide

## Testing the AI Chatbot Markdown Rendering

The AI Chatbot now supports full Markdown rendering for assistant responses. Use these test cases to verify the implementation.

### How to Test

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open the application and navigate to a page with the AI Chatbot
3. Click the chatbot button to open it
4. Send messages that will trigger markdown responses from the API

### Test Cases

#### 1. Basic Formatting
Send a message and expect responses with:
- **Bold text**: `**bold**`
- *Italic text*: `*italic*`
- ~~Strikethrough~~: `~~strikethrough~~`
- `Inline code`: `` `code` ``

#### 2. Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

#### 3. Lists

**Unordered:**
```markdown
- Item 1
- Item 2
  - Nested item
```

**Ordered:**
```markdown
1. First item
2. Second item
3. Third item
```

**Task Lists:**
```markdown
- [ ] Unchecked task
- [x] Checked task
```

#### 4. Code Blocks

**Inline code:** `` `const x = 5;` ``

**Block code:**
````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

#### 5. Links
```markdown
[Visit our website](https://example.com)
```

#### 6. Blockquotes
```markdown
> This is a blockquote
> It can span multiple lines
```

#### 7. Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

#### 8. Horizontal Rules
```markdown
---
```

#### 9. Images
```markdown
![Alt text](https://example.com/image.png)
```

#### 10. Mixed Content
```markdown
# Menu Recommendations

Here are today's **special dishes**:

1. **Butter Chicken** - `₹350`
   - Creamy tomato-based curry
   - Served with naan bread
   
2. **Paneer Tikka** - `₹280`
   - Grilled cottage cheese
   - Marinated in spices

> Chef's Note: All dishes are prepared fresh!

For more information, visit [our menu](https://example.com/menu).

```javascript
// Order tracking code
const orderStatus = "preparing";
console.log(`Your order is ${orderStatus}`);
```
```

### Expected Behavior

✅ **User messages**: Display as plain text (no markdown parsing)
✅ **Assistant messages**: Render markdown with proper formatting
✅ **Code blocks**: Syntax highlighting with dark background
✅ **Links**: Open in new tab with security attributes
✅ **Styling**: Matches chatbot bubble design (slate colors)
✅ **Spacing**: Proper margins between elements
✅ **Security**: No XSS vulnerabilities, sanitized HTML

### Visual Checks

- [ ] Headings have appropriate sizes and weights
- [ ] Lists are properly indented
- [ ] Code blocks have dark background with light text
- [ ] Inline code has light gray background
- [ ] Links are blue and underlined
- [ ] Blockquotes have left border and light background
- [ ] Tables are properly formatted with borders
- [ ] Text is readable and well-spaced
- [ ] Styling matches the chatbot's design system

### Security Checks

- [ ] Links open in new tab with `rel="noopener noreferrer"`
- [ ] No JavaScript execution from markdown content
- [ ] HTML tags are sanitized
- [ ] Dangerous attributes are removed

### Edge Cases

- [ ] Empty content doesn't break the UI
- [ ] Very long code blocks scroll properly
- [ ] Malformed markdown renders gracefully
- [ ] Special characters display correctly
- [ ] Multiple consecutive markdown elements space correctly

### Sample Test Messages

You can ask the AI chatbot these questions to test markdown rendering:

1. "Can you format a response with headings and lists?"
2. "Show me a code example in JavaScript"
3. "Create a table comparing menu items"
4. "Give me a response with bold, italic, and code formatting"
5. "Show me a blockquote with a recommendation"

### Troubleshooting

**Issue**: Markdown not rendering
- Check browser console for errors
- Verify highlight.js CSS is loaded
- Ensure MarkdownRenderer is imported correctly

**Issue**: Styling looks wrong
- Check Tailwind classes are applied
- Verify globals.css imports highlight.js styles
- Inspect element to see computed styles

**Issue**: Code blocks not highlighted
- Verify rehype-highlight is installed
- Check highlight.js CSS import in globals.css
- Try different language identifiers in code blocks

### Implementation Details

**Files Modified:**
- `frontend/components/AIChatbot.tsx` - Added MarkdownRenderer integration
- `frontend/components/MarkdownRenderer.tsx` - New component (created)
- `frontend/app/globals.css` - Added highlight.js CSS import
- `frontend/package.json` - Added markdown dependencies

**Dependencies Added:**
- `react-markdown` - Core markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support
- `rehype-sanitize` - XSS protection
- `rehype-highlight` - Syntax highlighting

**Security Features:**
- HTML sanitization via rehype-sanitize
- Safe link handling (target="_blank", rel="noopener noreferrer")
- No dangerouslySetInnerHTML usage
- Content validation for empty/null values

### Success Criteria

All test cases should pass with:
- ✅ Correct markdown rendering
- ✅ Consistent styling
- ✅ No security vulnerabilities
- ✅ Good performance (<200ms render time)
- ✅ Mobile responsive
- ✅ Graceful error handling

---

**Status**: Implementation complete and ready for testing
**Next Steps**: Test with live API responses containing markdown
