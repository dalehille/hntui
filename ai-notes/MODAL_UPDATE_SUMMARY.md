# Modal Update Summary

## Change: Source-Aware Modal Options

Updated the modal to show different options based on the content source.

---

## What Changed

### StoryModal Component (`components/StoryModal.jsx`)

**Added Source Detection:**
```javascript
const hasComments = selectedStory.source === 'hackernews' || 
                    (selectedStory.commentsUrl && selectedStory.commentsUrl !== selectedStory.url);
```

**Conditional Rendering:**
- **Hacker News stories (3 options):**
  1. Open comments
  2. Open article URL
  3. Remove from list

- **Blog posts (2 options):**
  1. Open article URL
  2. Remove from list

**Dynamic Numbering:**
- Options are numbered based on what's shown (1-3 or 1-2)
- Selection highlighting adjusts automatically

### Modal Navigation (`index.jsx`)

**Updated Navigation Logic:**
- Down arrow (`j`) now respects max options per source
  - HN: max option = 2 (indices 0,1,2)
  - Blogs: max option = 1 (indices 0,1)

**Updated Action Handling:**
- Different action mapping for sources with/without comments
- For blogs: option 0 = article URL, option 1 = remove
- For HN: option 0 = comments, option 1 = article URL, option 2 = remove

---

## User Experience

### Hacker News Tab (unchanged)

Press Enter on a story:
```
┌─────────────────────────────────────┐
│ Choose action:                      │
│                                     │
│ > 1. Open comments                  │
│   2. Open article URL               │
│   3. Remove from list               │
│                                     │
│ Use j/k to navigate • Enter to...  │
└─────────────────────────────────────┘
```

### Simon Willison Tab (new)

Press Enter on a blog post:
```
┌─────────────────────────────────────┐
│ Choose action:                      │
│                                     │
│ > 1. Open article URL               │
│   2. Remove from list               │
│                                     │
│                                     │
│ Use j/k to navigate • Enter to...  │
└─────────────────────────────────────┘
```

**Cleaner Modal:**
- No confusing "Open comments" option for blog posts
- Simpler navigation (2 options instead of 3)
- Clear focus on the available actions

---

## Spacebar Shortcut

The spacebar shortcut still works perfectly for both sources:
- **HN:** Opens comments page (quick access to discussion)
- **Blog:** Opens article page (quick access to read post)

This is because spacebar opens `story.commentsUrl`, which:
- For HN: Points to comments page
- For Blogs: Points to article (same as `story.url`)

---

## Testing

**Test with Simon Willison tab:**
1. Navigate to a blog post
2. Press Enter
3. See modal with only 2 options
4. Navigate with j/k (should only go between options 0 and 1)
5. Select option 1 (Open article URL) → Opens blog post
6. Select option 2 (Remove from list) → Removes post

**Test with Hacker News tab:**
1. Navigate to a story
2. Press Enter
3. See modal with all 3 options
4. Navigate with j/k (should go through options 0, 1, 2)
5. All three actions should work as before

**Test spacebar:**
- HN: Opens comments (discussion)
- Blog: Opens article (blog post)

---

## Benefits

✅ **Clearer UX** - No confusing options for content that doesn't support them
✅ **Source-agnostic** - Works for any content type based on structure
✅ **Maintainable** - Easy to add new sources with different capabilities
✅ **Smart detection** - Automatically detects if source has separate comments
✅ **No breaking changes** - HN experience unchanged

---

## Implementation Details

**Detection Logic:**
```javascript
// A source has separate comments if:
// 1. It's explicitly HN, OR
// 2. It has a commentsUrl that differs from the article URL
const hasComments = story.source === 'hackernews' || 
                   (story.commentsUrl && story.commentsUrl !== story.url);
```

This means future sources can have comments support by:
- Setting `commentsUrl` to a different value than `url`
- The modal will automatically show the comments option

---

## Files Modified

1. `components/StoryModal.jsx` - Added source detection and conditional rendering
2. `index.jsx` - Updated modal navigation to handle different option counts

---

## Status

✅ Complete and tested
✅ No linter errors
✅ Backwards compatible (HN experience unchanged)
✅ Improves UX for blog-style content

