---
title: Fixture post with no cover photo (delete me)
date: 2026-09-16
draft: true
category: Tips & Resources
description: This draft has no cover photo on purpose, to prove the build falls back to the site's default journal cover everywhere an image is shown. It is a check-journal.mjs test fixture, not a real post.
---

This post intentionally has no `image` field in its frontmatter. `check-journal.mjs` renders it directly via `loadPosts()`/`renderPost()`/`renderHub()` to prove the build falls back to the default journal cover photo for the hub card, the post header, `og:image`, and the JSON-LD `image` field. It stays `draft: true` so it's never built to HTML or listed anywhere public.
