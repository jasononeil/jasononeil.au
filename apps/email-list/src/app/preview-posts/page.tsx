'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { WPPost } from '@/services/wordpress-api';

export default function PreviewPosts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get state from URL query parameters
  const pageParam = searchParams.get('page');
  const postIdParam = searchParams.get('postId');

  const [posts, setPosts] = useState<WPPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<WPPost | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current page from URL or default to 1
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Update URL when parameters change
  const updateUrlParams = (page: number, postId?: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (postId) {
      params.set('postId', postId.toString());
    }
    router.push(`?${params.toString()}`);
  };

  // Fetch posts on component mount and when page changes
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/wordpress/posts?page=${currentPage}&perPage=10`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const fetchedPosts = await response.json();
        setPosts(fetchedPosts);

        // If there's a postId in the URL, select that post
        if (postIdParam) {
          const postId = parseInt(postIdParam, 10);
          const foundPost = fetchedPosts.find((post) => post.id === postId);

          if (foundPost) {
            setSelectedPost(foundPost);
            fetchPostDetails(postId);
          } else {
            // If the post isn't in the current page, fetch it directly
            fetchPostDetails(postId);
          }
        }
        // Otherwise select the first post by default if none is selected
        else if (fetchedPosts.length > 0 && !selectedPost) {
          setSelectedPost(fetchedPosts[0]);
          fetchPostDetails(fetchedPosts[0].id);
          // Update URL with the first post ID
          updateUrlParams(currentPage, fetchedPosts[0].id);
        }
      } catch (err) {
        setError(`Failed to fetch posts: ${(err as Error).message}`);
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [currentPage, postIdParam]);

  // Fetch full post details and markdown when a post is selected
  async function fetchPostDetails(postId: number) {
    // Update URL with the selected post ID
    updateUrlParams(currentPage, postId);
    try {
      setLoading(true);

      // Fetch post data
      const postResponse = await fetch(`/api/wordpress/post/${postId}`);

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || `HTTP error ${postResponse.status}`);
      }

      const postData = await postResponse.json();
      setSelectedPost(postData.post);

      // Fetch markdown content
      const markdownResponse = await fetch(`/api/wordpress/markdown/${postId}`);

      if (!markdownResponse.ok) {
        const errorText = await markdownResponse.text();
        throw new Error(errorText || `HTTP error ${markdownResponse.status}`);
      }

      const markdown = await markdownResponse.text();
      setMarkdownContent(markdown);
    } catch (err) {
      setError(`Failed to fetch post details: ${(err as Error).message}`);
      console.error('Error fetching post details:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle post selection
  function handlePostSelect(post: WPPost) {
    fetchPostDetails(post.id);
  }

  // Handle pagination
  function handlePreviousPage() {
    if (currentPage > 1) {
      updateUrlParams(currentPage - 1, selectedPost?.id);
    }
  }

  function handleNextPage() {
    updateUrlParams(currentPage + 1, selectedPost?.id);
  }

  return (
    <main className={styles.container} role="main">
      {/* First column: Posts list */}
      <nav className={styles.column}>
        <h2 className={styles.columnTitle}>Posts</h2>
        <div className={styles.postsList}>
          {loading && posts.length === 0 ? (
            <p>Loading posts...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <>
              <ul className={styles.postItems}>
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className={`${styles.postItem} ${selectedPost?.id === post.id ? styles.selected : ''}`}
                    onClick={() => handlePostSelect(post)}
                  >
                    <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                    <p className={styles.postDate}>{new Date(post.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
              <div className={styles.pagination}>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  Previous
                </button>
                <span className={styles.pageNumber}>Page {currentPage}</span>
                <button
                  onClick={handleNextPage}
                  disabled={posts.length < 10}
                  className={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Second column: Web preview */}
      <section className={styles.column}>
        <h2 className={styles.columnTitle}>Web</h2>
        <article className={styles.webPreview}>
          {selectedPost ? (
            <iframe src={selectedPost.link} className={styles.iframe} title="Web Preview" />
          ) : (
            <p>Select a post to preview</p>
          )}
        </article>
      </section>

      {/* Third column: Markdown */}
      <section className={styles.column}>
        <h2 className={styles.columnTitle}>Markdown</h2>
        <article className={styles.markdownPreview}>
          {selectedPost ? (
            loading ? (
              <p>Loading markdown...</p>
            ) : (
              <pre className={styles.markdown}>{markdownContent}</pre>
            )
          ) : (
            <p>Select a post to view markdown</p>
          )}
        </article>
      </section>

      {/* Fourth column: HTML Email */}
      <section className={styles.column}>
        <h2 className={styles.columnTitle}>HTML Email</h2>
        <article className={styles.emailPreview}>
          <p>Coming soon</p>
        </article>
      </section>
    </main>
  );
}
