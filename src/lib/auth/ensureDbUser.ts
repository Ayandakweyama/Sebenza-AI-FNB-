import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

export async function ensureDbUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const sessionUser = await currentUser();
  const clerkUser =
    sessionUser && sessionUser.id === clerkId
      ? sessionUser
      : await (async () => {
          const anyClient = clerkClient as any;
          const resolved = typeof anyClient === 'function' ? await anyClient() : anyClient;
          return resolved.users.getUser(clerkId);
        })();
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    '';

  const userData = {
    clerkId,
    email: primaryEmail,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
  };

  const existingByEmail = userData.email
    ? await prisma.user.findUnique({ where: { email: userData.email } })
    : null;

  if (existingByEmail && existingByEmail.clerkId !== clerkId) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: { clerkId, name: userData.name },
    });
  }

  try {
    return await prisma.user.create({
      data: {
        ...userData,
        profile: {
          create: {
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            avatar: clerkUser.imageUrl || null,
          },
        },
        accountSettings: { create: {} },
        jobPreferences: { create: {} },
      },
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      const fallback = await prisma.user.findUnique({ where: { clerkId } });
      if (fallback) return fallback;
    }
    throw error;
  }
}
