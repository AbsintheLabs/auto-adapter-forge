import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Page Not Found</h2>
        <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
