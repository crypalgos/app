import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] h-screen">
      <div className="flex items-center justify-center py-12">{children}</div>
      <div className="hidden bg-muted lg:block">
        {/* You can add a cover image here, for now using a placeholder or gradient */}
        <div className="h-full w-full bg-zinc-900 object-cover dark:brightness-[0.2] dark:grayscale" />
      </div>
    </div>
  );
}
