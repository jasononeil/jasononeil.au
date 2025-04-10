import { NextRequest, NextResponse } from 'next/server';
import { WordPressAPI } from '../../../../../services/wordpress-api';
import { RelatedPostsService } from '@/services/related-posts';
import { MarkdownRenderer } from '../../../../../services/renderers/markdown-renderer';

// Initialize WordPress API with environment variables
const wpApiUrl = process.env.WP_API_URL || '';

// Create WordPress API instance
const api = new WordPressAPI(wpApiUrl);
const relatedPostApi = new RelatedPostsService(api);

// Create renderer instance
const renderer = new MarkdownRenderer();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Fetch post with metadata from WordPress API
    const postData = await api.getPostWithMetadata(postId);

    // And more from the blog
    const recentPosts = await relatedPostApi.getPreviousPosts(postId);

    // Render post as markdown
    const markdown = await renderer.renderEmail(postData, recentPosts);

    // Return markdown content
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return NextResponse.json(
      { error: `Failed to render markdown: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
