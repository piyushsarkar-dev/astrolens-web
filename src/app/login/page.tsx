import type { Metadata } from "next";
import AuthForm from "@/components/Auth/AuthForm";

export const metadata: Metadata = {
  title: "Log in — Astro Lens",
  description: "Log in to your Astro Lens photo vault.",
};

const LoginPage = () => {
  return <AuthForm mode="login" />;
};

export default LoginPage;
