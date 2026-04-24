import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <SignUp
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
