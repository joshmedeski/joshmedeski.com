import type { CollectionEntry } from 'astro:content'

type Project = Pick<CollectionEntry<'projects'>, 'id'>
type Post = {
  data: { projects?: { id: string }[]; pubDate: Date; youtubeUrl?: string }
}

export function postsForProject<T extends Post>(
  project: Project,
  posts: T[],
): T[] {
  return posts
    .filter(({ data }) => data.projects?.some((p) => p.id === project.id))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
}

// Same split as /videos and the area pages: a post with a YouTube URL is a video.
export function splitVideos<T extends Post>(
  posts: T[],
): { videos: T[]; articles: T[] } {
  return {
    videos: posts.filter(({ data }) => !!data.youtubeUrl),
    articles: posts.filter(({ data }) => !data.youtubeUrl),
  }
}
