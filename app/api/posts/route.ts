import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import { getSession } from "@/lib/auth/getSession";
import { validatePostInput } from "@/utils/validation";
import { generateSlug } from "@/utils/slug";
import { processTipTapContent } from "@/utils/tiptap";
import { createApiResponse } from "@/lib/api";
import { PostInput } from "@/types/post";

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        createApiResponse(null, "Unauthorized"),
        { status: 401 }
      );
    }

    // Connect to database FIRST (before validation which needs DB connection)
    await connectDB();

    // Parse request body
    const body: Partial<PostInput> = await request.json();

    // Generate slug if not provided
    if (!body.slug && body.title) {
      body.slug = generateSlug(body.title);
    }

    // Validate input (database is now connected)
    const validation = await validatePostInput(body, false);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validation.errors.reduce(
            (acc, err) => {
              acc[err.field] = [err.message];
              return acc;
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 400 }
      );
    }

    // Process TipTap content (auto-detect H1)
    const processedContent = processTipTapContent(body.content!);

    // Create post
    const post = await Post.create({
      title: body.title!,
      slug: body.slug!,
      content: processedContent,
      description: body.description,
      tags: body.tags || [],
      featured: body.featured || false,
      image_url: body.image_url && body.image_url.trim() !== "" ? body.image_url.trim() : undefined,
    });

    return NextResponse.json(
      createApiResponse(
        {
          _id: post._id.toString(),
          title: post.title,
          slug: post.slug,
          content: post.content,
          description: post.description,
          tags: post.tags,
          featured: post.featured,
          image_url: post.image_url,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
        undefined,
        "Post created successfully"
      ),
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating post:", error);

    // Handle MongoDB duplicate key error
    if (
      error instanceof Error &&
      error.message.includes("duplicate key") &&
      error.message.includes("slug")
    ) {
      return NextResponse.json(
        createApiResponse(null, "Slug already exists"),
        { status: 400 }
      );
    }

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

// GET /api/posts - List all posts
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const sort = searchParams.get("sort") || "-createdAt"; // Default: newest first

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    if (sort.startsWith("-")) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Query posts
    const posts = await Post.find()
      .sort(sortObj)
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count
    const total = await Post.countDocuments();

    return NextResponse.json(
      createApiResponse({
        posts: posts.map((post) => ({
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
        })),
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      })
    );
  } catch (error: unknown) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

