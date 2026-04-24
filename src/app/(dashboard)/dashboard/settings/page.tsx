import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, preferences, and billing.
        </p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none border rounded-xl w-full",
          },
        }}
      />
    </div>
  );
}
