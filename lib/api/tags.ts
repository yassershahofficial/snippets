import { api, ApiResponse, handleApiError } from "@/lib/api";
import { TagWithCount, FeaturedTagsResponse, TagsListResponse } from "@/types/featured-tags";

/**
 * Fetch all unique tags with post counts
 */
export async function getAllTags(): Promise<TagWithCount[]> {
  try {
    const response = await api.get<ApiResponse<TagsListResponse>>("/api/tags");
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error("No data returned");
    }
    return response.data.tags;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Fetch current featured tags
 */
export async function getFeaturedTags(): Promise<FeaturedTagsResponse> {
  try {
    const response = await api.get<ApiResponse<FeaturedTagsResponse>>(
      "/api/featured-tags"
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
 * Update featured tags (max 4 tags)
 */
export async function updateFeaturedTags(
  tags: string[]
): Promise<FeaturedTagsResponse> {
  try {
    if (tags.length > 4) {
      throw new Error("Cannot have more than 4 featured tags");
    }
    const response = await api.put<ApiResponse<FeaturedTagsResponse>>(
      "/api/featured-tags",
      { tags }
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

