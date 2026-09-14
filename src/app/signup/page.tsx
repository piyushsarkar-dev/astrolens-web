import type { Metadata } from "next";
import AuthForm from "@/components/Auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign up — Astro Lens",
  description: "Create your own Astro Lens photo vault account.",
};

const SignupPage = () => {
  return <AuthForm mode="signup" />;
};

export default SignupPage;
