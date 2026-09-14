import type { Metadata } from "next";
import AuthForm from "@/components/Auth/AuthForm";

export const metadata: Metadata = {
  title: "Log in or Sign up — Astro Lens",
  description: "Log in or create your Astro Lens photo vault account on one page.",
};

const AuthPage = () => {
  return <AuthForm initialMode="login" />;
};

export default AuthPage;
