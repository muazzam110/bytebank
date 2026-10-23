import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="container py-24 text-center space-y-4">
      <h1 className="font-display text-4xl font-semibold">Page not found</h1>
      <Button asChild>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
