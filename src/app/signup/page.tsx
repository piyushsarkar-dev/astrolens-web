import { redirect } from "next/navigation";

const SignupRedirect = () => {
  redirect("/login?tab=signup");
};

export default SignupRedirect;
