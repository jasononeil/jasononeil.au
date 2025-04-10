import { NextRequest, NextResponse } from 'next/server';
import { WordPressAPI } from '@/services/wordpress-api';
import { RelatedPostsService } from '@/services/related-posts';
import { HtmlRenderer } from '@/services/renderers/html-renderer';

const wpApi = new WordPressAPI(process.env.WP_API_URL || '');
const relatedPostApi = new RelatedPostsService(wpApi);
const renderer = new HtmlRenderer();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  try {
    const postId = parseInt((await params).postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Fetch the post with all metadata
    const postWithMetadata = await wpApi.getPostWithMetadata(postId);

    // And more from the blog
    const recentPosts = await relatedPostApi.getPreviousPosts(postId);

    // Render the post to HTML
    const html = await renderer.renderEmail(postWithMetadata, recentPosts);

    // Return the HTML content with the correct content type
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json(
      { error: `Failed to generate HTML: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
