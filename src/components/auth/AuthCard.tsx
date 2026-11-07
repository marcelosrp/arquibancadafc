import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="w-full max-w-md">
      <Card className="[--card-spacing:--spacing(6)] shadow-sm">
        <CardHeader>
          <h1 className="font-heading text-3xl font-bold tracking-wide uppercase">{title}</h1>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
