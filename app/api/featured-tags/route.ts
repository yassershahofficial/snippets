import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeaturedTags from "@/models/FeaturedTags";
import { getSession } from "@/lib/auth/getSession";
import { createApiResponse } from "@/lib/api";

// GET /api/featured-tags - Get current featured tags
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get or create singleton document
    let featuredTags = await FeaturedTags.findOne();
    if (!featuredTags) {
      featuredTags = await FeaturedTags.create({ tags: [] });
    }

    return NextResponse.json(
      createApiResponse({
        tags: featuredTags.tags || [],
        createdAt: featuredTags.createdAt,
        updatedAt: featuredTags.updatedAt,
      })
    );
  } catch (error: unknown) {
    console.error("Error fetching featured tags:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

// PUT /api/featured-tags - Update featured tags
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        createApiResponse(null, "Unauthorized"),
        { status: 401 }
      );
    }

    await connectDB();

    // Parse request body
    const body = await request.json();
    const { tags } = body;

    // Validate input
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        createApiResponse(null, "Tags must be an array"),
        { status: 400 }
      );
    }

    if (tags.length > 4) {
      return NextResponse.json(
        createApiResponse(null, "Cannot have more than 4 featured tags"),
        { status: 400 }
      );
    }

    // Validate all tags are strings
    if (tags.some((tag: unknown) => typeof tag !== "string")) {
      return NextResponse.json(
        createApiResponse(null, "All tags must be strings"),
        { status: 400 }
      );
    }

    // Update or create featured tags document (singleton pattern)
    const featuredTags = await FeaturedTags.findOneAndUpdate(
      {},
      { tags },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(
      createApiResponse(
        {
          tags: featuredTags.tags,
          createdAt: featuredTags.createdAt,
          updatedAt: featuredTags.updatedAt,
        },
        undefined,
        "Featured tags updated successfully"
      )
    );
  } catch (error: unknown) {
    console.error("Error updating featured tags:", error);

    // Handle MongoDB validation errors
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        createApiResponse(null, "Validation failed: " + error.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

