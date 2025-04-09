import { NextRequest, NextResponse } from 'next/server';
import { WordPressAPI } from '@/services/wordpress-api';
import { HtmlRenderer } from '@/services/renderers/html-renderer';

const wpApi = new WordPressAPI(process.env.WORDPRESS_API_URL || 'https://jasononeil.au/wp-json');
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

    // Render the post to HTML
    const html = await renderer.renderPost(postWithMetadata);

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
