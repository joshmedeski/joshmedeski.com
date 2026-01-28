---
name: blog-post
description: Use when creating a blog post.
---

# Creating Blog Posts

## File Location & Naming

- **Directory**: `src/data/posts/`
- **Format**: `.mdx` files
- **Naming**: kebab-case from title (e.g., "My New Post" → `my-new-post.mdx`)

## Required Frontmatter

```yaml
---
title: "Post Title"
pubDate: 2024-01-28T12:00:00.000Z
description: Brief description of the post
heroImage: ../../assets/posts/post-slug.jpeg
category: dotfiles
---
```

## Categories

| Category | Description |
|----------|-------------|
| `conversations` | Talking with friends |
| `development` | How I build web apps |
| `dotfiles` | My dev workflows |
| `personal-development` | Living with intention |
| `productivity` | How I get things done |
| `tech` | Gear and tools I use |

## Optional Frontmatter

```yaml
youtubeUrl: https://www.youtube.com/embed/VIDEO_ID
duration: "5:22"
draft: true
thumbnail: ../../assets/posts/post-slug-thumb.jpeg
guide:
  ref: guide-name
  position: 1
```

## Workflow

1. Ask user for the blog post content (brain dump, outline, or draft)
2. Ask clarifying questions:
   - What category fits best?
   - Is a hero image available or should a placeholder be used?
   - Any YouTube video to embed?
   - Is this a draft or ready to publish?
3. Generate kebab-case filename from title
4. Create MDX file in `src/data/posts/`

## Content Formatting Rules

- **Preserve the user's voice** - Do not rewrite or heavily edit content
- **Minimal changes only** - Only fix obvious typos or formatting issues
- **Remove any top-level h1** - The title is in frontmatter, not the content
- **Use h2s for all main sections** - Break content into logical h2 sections
- **No orphan content** - All content should live under an h2 heading
