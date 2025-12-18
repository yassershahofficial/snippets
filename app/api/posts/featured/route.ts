import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import { createApiResponse } from "@/lib/api";

// GET /api/posts/featured - Get the featured post
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Find the featured post
    const post = await Post.findOne({ featured: true }).lean();

    if (!post) {
      return NextResponse.json(
        createApiResponse(null, "No featured post found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createApiResponse({
        _id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        content: post.content,
        description: post.description,
        tags: post.tags,
        featured: post.featured || false,
        image_url: post.image_url,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })
    );
  } catch (error: unknown) {
    console.error("Error fetching featured post:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

