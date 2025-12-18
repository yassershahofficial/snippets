import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import { createApiResponse } from "@/lib/api";
import { TagWithCount } from "@/types/featured-tags";

// GET /api/tags - Get all unique tags with post counts
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Aggregate all unique tags with their counts
    const tagsWithCounts = await Post.aggregate<TagWithCount>([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          count: 1,
        },
      },
    ]);

    return NextResponse.json(
      createApiResponse({
        tags: tagsWithCounts,
      })
    );
  } catch (error: unknown) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

