import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import { getSession } from "@/lib/auth/getSession";
import { validatePostInput } from "@/utils/validation";
import { generateSlug } from "@/utils/slug";
import { processTipTapContent } from "@/utils/tiptap";
import { createApiResponse } from "@/lib/api";
import { PostInput } from "@/types/post";

// GET /api/posts/[slug] - Get single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const post = await Post.findOne({ slug }).lean();

    if (!post) {
      return NextResponse.json(
        createApiResponse(null, "Post not found"),
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
    console.error("Error fetching post:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

// PUT /api/posts/[slug] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params;
    // Find existing post
    const existingPost = await Post.findOne({ slug });
    if (!existingPost) {
      return NextResponse.json(
        createApiResponse(null, "Post not found"),
        { status: 404 }
      );
    }

    // Parse request body
    const body: Partial<PostInput> = await request.json();

    // Generate slug if title changed and slug not provided
    if (!body.slug && body.title && body.title !== existingPost.title) {
      body.slug = generateSlug(body.title);
    }

    // Validate input (update mode)
    const validation = await validatePostInput(
      body,
      true,
      existingPost._id.toString()
    );
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

    // Process TipTap content (auto-detect H1) if content is being updated
    let processedContent = existingPost.content;
    if (body.content) {
      processedContent = processTipTapContent(body.content);
    }

    // If setting as featured, unfeature all other posts first
    if (body.featured === true) {
      await Post.updateMany(
        { _id: { $ne: existingPost._id }, featured: true },
        { $set: { featured: false } }
      );
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      existingPost._id,
      {
        ...(body.title && { title: body.title }),
        ...(body.slug && { slug: body.slug }),
        ...(body.content && { content: processedContent }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.image_url !== undefined && {
          image_url: body.image_url && body.image_url.trim() !== "" ? body.image_url.trim() : undefined,
        }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      createApiResponse(
        {
          _id: updatedPost._id.toString(),
          title: updatedPost.title,
          slug: updatedPost.slug,
          content: updatedPost.content,
          description: updatedPost.description,
          tags: updatedPost.tags,
          featured: updatedPost.featured,
          image_url: updatedPost.image_url,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        },
        undefined,
        "Post updated successfully"
      )
    );
  } catch (error: unknown) {
    console.error("Error updating post:", error);

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

// DELETE /api/posts/[slug] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params;
    // Find and delete post
    const post = await Post.findOneAndDelete({ slug });

    if (!post) {
      return NextResponse.json(
        createApiResponse(null, "Post not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createApiResponse(null, undefined, "Post deleted successfully")
    );
  } catch (error: unknown) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      createApiResponse(null, "Internal server error"),
      { status: 500 }
    );
  }
}

