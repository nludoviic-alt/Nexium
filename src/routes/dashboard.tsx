import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentSession, getUserProfile, isSupabaseConfigured } from "@/lib/supabase";
import { getUserSlug } from "@/lib/user-slug";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (!isSupabaseConfigured) {
      throw redirect({ to: "/login" });
    }

    const session = await getCurrentSession();
    if (!session?.user) {
      throw redirect({ to: "/login" });
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile || profile.status !== "ACTIVE") {
      throw redirect({ to: "/login" });
    }

    const userSlug = getUserSlug({ name: profile.name, email: session.user.email, id: session.user.id });

    throw redirect({
      to: "/portal/$slug",
      params: { slug: userSlug },
    });
  },
});
