import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentSession, getUserProfile, isSupabaseConfigured } from "@/lib/supabase";
import { getAdminSlug } from "@/lib/user-slug";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    if (!isSupabaseConfigured) {
      throw redirect({ to: "/login" });
    }

    const session = await getCurrentSession();
    if (!session?.user) {
      throw redirect({ to: "/login" });
    }

    const profile = await getUserProfile(session.user.id);
    const adminSlug = getAdminSlug({ name: profile?.name, email: session.user.email, id: session.user.id });

    throw redirect({
      to: "/admin/$slug",
      params: { slug: adminSlug },
    });
  },
});
