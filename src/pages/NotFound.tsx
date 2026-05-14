import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-6 text-center shadow-[var(--shadow-card)]">
        <h1 className="mb-3 text-4xl font-black leading-none">404</h1>
        <p className="mb-5 text-base font-medium text-muted-foreground">Page not found</p>
        <Button asChild className="h-12 w-full rounded-2xl font-bold">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
