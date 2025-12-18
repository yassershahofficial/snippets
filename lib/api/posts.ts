import { api, ApiResponse, handleApiError } from "@/lib/api";
import { PostInput, PostWithId, TipTapContent } from "@/types/post";

// API Response types
interface PostsListResponse {
  posts: PostWithId[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

interface SinglePostResponse {
  _id: string;
  title: string;
  slug: string;
  content: TipTapContent | TipTapContent[];
  description?: string;
  tags: string[];
  featured?: boolean;
  image_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch list of posts with pagination
 */
export async function getPosts(
  limit = 10,
  skip = 0,
  sort = "-createdAt"
): Promise<PostsListResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      sort,
    });
    const response = await api.get<ApiResponse<PostsListResponse>>(
      `/api/posts?${params.toString()}`
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("No data returned");
    }
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Fetch a single post by slug
 */
export async function getPost(slug: string): Promise<SinglePostResponse> {
  try {
    const response = await api.get<ApiResponse<SinglePostResponse>>(
      `/api/posts/${slug}`
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("Post not found");
    }
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Create a new post
 */
export async function createPost(
  data: PostInput
): Promise<SinglePostResponse> {
  try {
    const response = await api.post<ApiResponse<SinglePostResponse>>(
      "/api/posts",
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("No data returned");
    }
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Update an existing post
 */
export async function updatePost(
  slug: string,
  data: Partial<PostInput>
): Promise<SinglePostResponse> {
  try {
    const response = await api.put<ApiResponse<SinglePostResponse>>(
      `/api/posts/${slug}`,
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("No data returned");
    }
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Delete a post
 */
export async function deletePost(slug: string): Promise<void> {
  try {
    const response = await api.delete<ApiResponse>(`/api/posts/${slug}`);
    if (response.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Toggle featured status of a post
 * When setting a post as featured, all other posts are automatically unfeatured
 */
export async function toggleFeatured(
  slug: string,
  featured: boolean
): Promise<SinglePostResponse> {
  try {
    const response = await api.put<ApiResponse<SinglePostResponse>>(
      `/api/posts/${slug}`,
      { featured }
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("No data returned");
    }
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

