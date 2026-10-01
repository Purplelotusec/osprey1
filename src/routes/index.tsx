import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { getKevFeed } from "@/lib/kev";

export const Route = createFileRoute("/")({
  loader: () => getKevFeed(),
  component: Home,
});

function Home() {
  const kev = Route.useLoaderData();
  return <HomePage kev={kev} />;
}