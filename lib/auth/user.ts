import connectDB from "@/lib/db";
import User from "@/models/User";
import { IUser } from "@/types/user";

interface GoogleProfile {
  sub: string; // Google user ID
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Find or create a user from Google OAuth profile
 */
export async function findOrCreateUser(
  profile: GoogleProfile
): Promise<IUser & { _id: string }> {
  await connectDB();

  // Try to find user by provider and providerId first (most reliable)
  let user = await User.findOne({
    provider: "google",
    providerId: profile.sub,
  });

  if (user) {
    // Update user info if it has changed
    const updates: Partial<IUser> = {};
    if (profile.email && user.email !== profile.email) {
      updates.email = profile.email;
    }
    if (profile.name && user.name !== profile.name) {
      updates.name = profile.name;
    }
    if (profile.picture && user.image !== profile.picture) {
      updates.image = profile.picture;
    }

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider,
      providerId: user.providerId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // If not found by providerId, try by email (in case providerId changed)
  if (profile.email) {
    user = await User.findOne({ email: profile.email.toLowerCase() });
    if (user) {
      // Update with new provider info
      user = await User.findByIdAndUpdate(
        user._id,
        {
          provider: "google",
          providerId: profile.sub,
          ...(profile.name && { name: profile.name }),
          ...(profile.picture && { image: profile.picture }),
        },
        { new: true }
      );

      return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        provider: user.provider,
        providerId: user.providerId,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
  }

  // Create new user
  const newUser = await User.create({
    email: profile.email.toLowerCase(),
    name: profile.name,
    image: profile.picture,
    provider: "google",
    providerId: profile.sub,
    role: "admin", // All authenticated users are admins
  });

  return {
    _id: newUser._id.toString(),
    email: newUser.email,
    name: newUser.name,
    image: newUser.image,
    provider: newUser.provider,
    providerId: newUser.providerId,
    role: newUser.role,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  email: string
): Promise<(IUser & { _id: string }) | null> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return null;
  }

  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    providerId: user.providerId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

