import { NextRequest, NextResponse } from 'next/server';
import { WordPressAPI } from '../../../../../services/wordpress-api';

// Initialize WordPress API with environment variables
const wpApiUrl = process.env.WP_API_URL || '';

// Create WordPress API instance
const api = new WordPressAPI(wpApiUrl);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Fetch post with metadata from WordPress API
    const postData = await api.getPostWithMetadata(postId);

    return NextResponse.json(postData);
  } catch (error) {
    console.error('Error fetching post details:', error);
    return NextResponse.json(
      { error: `Failed to fetch post details: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
