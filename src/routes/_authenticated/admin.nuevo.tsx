import { createFileRoute } from "@tanstack/react-router";

import { PostForm } from "@/components/admin/PostForm";

export const Route = createFileRoute("/_authenticated/admin/nuevo")({
  component: () => <PostForm />,
});
