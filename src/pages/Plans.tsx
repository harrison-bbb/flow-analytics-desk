import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanSelector } from "@/components/dashboard/PlanSelector";
import { SubscriptionOverview } from "@/components/dashboard/SubscriptionOverview";
import { AdminPlanManager } from "@/components/dashboard/AdminPlanManager";
import { useAuth } from "@/hooks/useAuth";

export default function Plans() {
  const { user } = useAuth();

  // Check if user is admin (you might want to implement proper role checking)
  const isAdmin = user?.email === 'harrison@blackboxbots.com';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view ROI performance
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Change Plan</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionOverview />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Choose Your Plan</h2>
            <p className="text-muted-foreground">
              Select the subscription plan that best fits your automation needs
            </p>
          </div>
          <PlanSelector />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <AdminPlanManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}