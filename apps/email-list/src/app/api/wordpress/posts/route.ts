import { NextRequest, NextResponse } from 'next/server';
import { WordPressAPI } from '../../../../services/wordpress-api';

// Initialize WordPress API with environment variables
const wpApiUrl = process.env.WP_API_URL || '';

// Create WordPress API instance
const api = new WordPressAPI(wpApiUrl);

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const categories = searchParams.get('categories')?.split(',').map(Number) || [];
    const tags = searchParams.get('tags')?.split(',').map(Number) || [];
    const search = searchParams.get('search') || '';

    // Fetch posts from WordPress API
    const posts = await api.getPosts({ page, perPage, categories, tags, search });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: `Failed to fetch posts: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
