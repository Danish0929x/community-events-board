import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AuthForm mode="admin" />
    </Suspense>
  );
}
