import { api, ApiResponse, handleApiError } from "@/lib/api";

interface AdminNameResponse {
  name: string;
}

/**
 * Fetch admin user name
 */
export async function getAdminName(): Promise<string> {
  try {
    const response = await api.get<ApiResponse<AdminNameResponse>>(
      `/api/admin/name`
    );
    if (response.error) {
      return "ADMIN";
    }
    if (!response.data) {
      return "ADMIN";
    }
    return response.data.name || "ADMIN";
  } catch (error) {
    return "ADMIN";
  }
}

