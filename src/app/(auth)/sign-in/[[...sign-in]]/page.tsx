import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            cardBox: "shadow-xl shadow-primary/5",
          },
        }}
      />
    </div>
  );
}
