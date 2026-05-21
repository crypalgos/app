# CrypAlgos Frontend - Developer Contributing Guidelines

Welcome to the CrypAlgos quantitative frontend contribution suite. This document outlines the standards, structural conventions, and coding patterns required to keep the application stable, maintainable, and aligned with our premium design standards.

---

## 🎨 1. UI Styling & Theme Standards

We leverage **Tailwind CSS v4** combined with **Radix UI** primitives and custom interactive assets. Our platform is built around a unified aesthetic: a highly sophisticated dark quantitative theme utilizing HSL variable tokens.

### The CSS Token System (`src/app/globals.css`):
We define key styling variables at the root of the stylesheet. Always reference standard theme tokens instead of using hardcoded HEX colors:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 38 92% 50%; /* Deep Gold */
  --primary-foreground: 0 0% 100%;
  --border: 240 5.9% 90%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 38 92% 50%; /* Deep Gold */
  --primary-foreground: 240 5.9% 10%;
  --border: 240 3.7% 15.9%;
}
```

### Key Styling Directives:
* **Dark Mode Native**: We utilize the class-based dark mode mechanism (`dark:`). Ensure every new component has appropriate styles for both light and dark modes, prioritizing the premium dark theme experience.
* **Consolidating CSS Class Names**: When merging dynamic Tailwind classes, always use the `cn()` utility located in `src/lib/utils.ts` to merge class attributes safely without styles overriding each other:
```tsx
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function CustomButton({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "h-10 px-4 rounded-xl text-xs font-semibold transition-all duration-200",
        variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
}
```

---

## 🧱 2. Component Categorization Structure

We organize components into distinct tiers based on their reusability and operational logic. To keep the global namespace clean, we avoid creating domain-specific feature folders inside the global `src/components/` folder. All feature-specific components are kept strictly inside route-level private `_components/` folders.

```
src/components/
├── ui/              # Low-level visual primitives (buttons, inputs, dialogs, checkboxes)
└── kokonutui/       # High-fidelity visual ornaments (interactive cards, glowing borders, custom charts)
```

### Component Tiers:
1. **Visual Primitives (`components/ui/`)**: Basic shadcn elements. Do not put business logic inside this folder. Primitives must receive values purely via standard React props.
2. **Design Accents (`components/kokonutui/`)**: Highly visual, animated, premium widgets. They must remain highly customizable and reusable.

Any other component that is feature-specific or route-specific must be placed inside the route's private `_components/` folder. We do not use `src/components/[feature]/` directories.

---

### 🛡️ Route-Level Isolated Components (`_components/` folder)

Next.js App Router treats all standard folders as route segments if they contain a page. To keep pages organized without polluting the global `src/components/` directory, we utilize **Private Folders** prefixed with an underscore (`_`).

Any folder named **`_components`** inside a route group or page route is completely ignored by Next.js routing.

#### When to use:
* If a component is used **only** inside a specific route (e.g. only inside `/dashboard`), save it at `src/app/(dashboard)/dashboard/_components/`.
* Examples: `strategy-table.tsx`, `strategy-card.tsx`, and `workspace-toolbar.tsx` reside privately inside the dashboard's component folder.
* This encapsulates local logic and simplifies component imports.

---

## 🔌 3. Network Queries & API Actions (React Query & Axios)

We isolate UI logic from network transport actions. Never write bare axios/fetch queries directly in component files.

### Standard Pipeline Flow:
```
1. Write endpoint request in: src/api-actions/[domain]-actions.ts (Grouped in an Action Object)
2. Group all React Query hooks in: src/api-actions/hooks/[domain]-hooks.ts
3. Consume the custom hooks within pages or components.
```

### 1. Define the Grouped API Actions Object:
Always declare strict return typings. Wrap endpoints in a named actions dictionary and unpack `ApiResponse<T>` to return `response.data.data`:
```typescript
// src/api-actions/session-actions.ts
import axiosInstance from "@/lib/axios-interceptor";

export const SessionActions = {
  // Queries: GET request returning type-safe data
  GetUserSessionsAction: async (): Promise<ISessionResponse> => {
    const response = await axiosInstance.get<ApiResponse<ISessionResponse>>("/sessions");
    return response.data.data;
  },

  // Mutations: DELETE requests
  DeleteAllSessionsAction: async (): Promise<IUniversalMessage> => {
    const response = await axiosInstance.delete<ApiResponse<IUniversalMessage>>("/sessions");
    return response.data.data;
  },

  DeleteSessionAction: async (sessionId: string): Promise<IUniversalMessage> => {
    const response = await axiosInstance.delete<ApiResponse<IUniversalMessage>>(`/sessions/${sessionId}`);
    return response.data.data;
  }
};
```

### 2. Group React Query Hooks:
Group all hooks belonging to a single domain inside a single file located in **`src/api-actions/hooks/[domain]-hooks.ts`** (e.g. `session-hooks.ts`). Always use strict `queryKey` matrices and leverage `invalidateQueries` to synchronize cache states on mutations:

```typescript
// src/api-actions/hooks/session-hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SessionActions } from "@/api-actions/session-actions";

// Reading data (useQuery)
export const useSessions = () => {
  return useQuery({
    queryKey: ["user", "sessions"],
    queryFn: () => SessionActions.GetUserSessionsAction(),
    staleTime: 1000 * 60 * 5, // Cache sessions for 5 mins
  });
};

// Modifying data (useMutation)
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      SessionActions.DeleteSessionAction(sessionId),
    onSuccess: () => {
      // Invalidate specific cache keys to auto-refresh user session list
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
    },
  });
};

export const useDeleteAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SessionActions.DeleteAllSessionsAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
    },
  });
};
```

---

## 📝 4. Type-Safe Form Best Practices (React Hook Form + Zod)

To achieve maximum stability and visual quality, all forms must utilize `@hookform/resolvers/zod` for robust client-side validation, handle interactive loading states, and use `sonner` for crisp notifications.

### Implementation Standard:
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useJoinWaitlist } from "@/api-actions/hooks/use-waitlist";

// 1. Define Zod validation schema
const waitlistFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
});

// Infer strict TypeScript type from the Zod Schema
type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

export function WaitlistForm() {
  const { mutateAsync: joinWaitlist, isPending } = useJoinWaitlist();

  // 2. Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: { name: "", email: "" },
  });

  // 3. Submit Handler
  const onSubmit = async (values: WaitlistFormValues) => {
    try {
      await joinWaitlist(values);
      toast.success("Successfully registered on waitlist!");
      reset(); // Reset form fields on success
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to join waitlist.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-zinc-400">Name</label>
        <input
          {...register("name")}
          disabled={isPending}
          className="w-full h-10 px-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-primary disabled:opacity-50"
        />
        {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-zinc-400">Email Address</label>
        <input
          {...register("email")}
          disabled={isPending}
          className="w-full h-10 px-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-primary disabled:opacity-50"
        />
        {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Joining Waitlist...
          </>
        ) : (
          "Join Priority Waitlist"
        )}
      </button>
    </form>
  );
}
```

---

## 🪵 5. Git Commit & Development Workflow

To ensure code readability, we utilize clear semantic branch naming and strict validation standards.

### Branch Names Pattern:
* New features: `feature/short-description`
* Bug fixes: `bugfix/short-description`
* Performance tuning: `perf/short-description`
* Documentation additions: `docs/short-description`

### Commits Convention (Angular / Conventional Commits):
* `feat: add strategy export to JSON`
* `fix: prevent Recharts memory leak in live trades`
* `docs: update deployment environment steps`
* `refactor: clean up duplicate zustand cookie hook`

### Validation Checklist Before Pushing:
Before opening a Pull Request (PR), ensure all local checks pass:

```bash
# 1. Clean formatting and quality check
npm run lint

# 2. Strict production build compilation
npm run build
```
Any PR containing build errors or linting regressions will be automatically blocked by our continuous integration pipelines.
