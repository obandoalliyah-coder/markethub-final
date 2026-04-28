import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, CalendarClock, FileCheck, Store } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function VendorDashboardPage() {
  const session = await auth();

  // Protect the route - only allow VENDOR
  if (!session?.user?.id || (session.user as any).role !== "VENDOR") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500 text-lg">Please log in as a vendor to access this dashboard.</p>
      </div>
    );
  }

  const userId = session.user.id;

  // Fetch real data for the logged-in vendor
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      payments: {
        orderBy: { dueDate: "desc" },
        take: 10,
      },
      applications: true,
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!vendorProfile) {
    return <div className="p-8">Vendor profile not found. Please complete your profile.</div>;
  }

  // Calculate real statistics
  const totalPaid = vendorProfile.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = vendorProfile.payments.filter(
    (p) => p.status === "PENDING"
  ).length;

  const activeApplications = vendorProfile.applications.filter(
    (a) => ["PENDING", "APPROVED"].includes(a.status)
  ).length;

  const occupiedStalls = vendorProfile.applications.filter(
    (a) => a.status === "APPROVED"
  ).length;

  const totalStallsApplied = vendorProfile.applications.length;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {session.user.name || vendorProfile.businessName || "Vendor"} 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your stalls and payments today.
        </p>
      </div>

      {/* Improved 4 Stat Boxes - Now using REAL data */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Paid"
          value={`₱${totalPaid.toLocaleString()}`}
          change="+18%"                    // TODO: Add real comparison later
          changeType="up"
          icon={DollarSign}
          description="all time"
        />

        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          change={pendingPayments > 0 ? "due soon" : "all clear"}
          changeType={pendingPayments > 0 ? "down" : "neutral"}
          icon={CalendarClock}
          description="this month"
        />

        <StatCard
          title="Active Applications"
          value={activeApplications}
          change="+1"
          changeType="up"
          icon={FileCheck}
          description="in review"
        />

        <StatCard
          title="Stalls Occupied"
          value={`${occupiedStalls} / ${totalStallsApplied || 1}`}
          change={`${Math.round((occupiedStalls / (totalStallsApplied || 1)) * 100)}%`}
          changeType="up"
          icon={Store}
          description="utilization rate"
        />
      </div>

      {/* Add your other dashboard sections here (Recent Payments, My Stalls, etc.) */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Recent Payments</h3>
          <p className="text-muted-foreground text-sm">
            Your recent payment activity will appear here...
          </p>
          {/* You can add a table here later using vendorProfile.payments */}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">My Stalls</h3>
            <p className="text-muted-foreground text-sm">Your stall applications and occupancy...</p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Notifications</h3>
            <p className="text-muted-foreground text-sm">
              You have {vendorProfile.notifications.length} unread notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}