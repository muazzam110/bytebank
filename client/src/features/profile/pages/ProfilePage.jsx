import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChangePasswordForm from "../components/ChangePasswordForm";
import AccountStatusCard from "../components/AccountStatusCard";
import PreferencesCard from "../components/PreferencesCard";
import ProfileForm from "../components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Profile & security</h1>
      <Tabs defaultValue="profile">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="profile" className="rounded-full">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
          <PreferencesCard />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Change password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Changing your password also <strong className="text-foreground">logs you out everywhere else</strong>. Every other device is
                signed out on its next action. This is the "log out everywhere" button.
              </p>
              <ChangePasswordForm />
            </CardContent>
          </Card>
          <AccountStatusCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
