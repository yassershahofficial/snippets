import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createApiResponse } from "@/lib/api";

// GET /api/admin/name - Get admin user name
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Find first admin user
    const admin = await User.findOne({ role: "admin" }).lean();

    if (!admin) {
      return NextResponse.json(
        createApiResponse({ name: "ADMIN" }, undefined, "No admin found, using default"),
        { status: 200 }
      );
    }

    return NextResponse.json(
      createApiResponse({
        name: admin.name || "ADMIN",
      })
    );
  } catch (error: unknown) {
    console.error("Error fetching admin name:", error);
    return NextResponse.json(
      createApiResponse({ name: "ADMIN" }, undefined, "Error fetching admin name"),
      { status: 200 }
    );
  }
}

