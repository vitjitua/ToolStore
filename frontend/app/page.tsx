"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Tool = {
  toolId: number;
  assetNumber: string;
  toolName: string;
  category: string | null;
  serialNumber: string | null;
  storeLocation: string | null;
  condition: string;
  status: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string | null;
};

type CurrentAllocation = {
  transactionId: number;
  toolId: number;
  assetNumber: string;
  toolName: string;
  artisanId: number;
  artisanName: string;
  projectId: number | null;
  projectName: string | null;
  issuedDate: string;
  expectedReturnDate: string | null;
  issueCondition: string;
  transactionStatus: string;
  issuedBy: string;
  remarks: string | null;
};

type RecentTransaction = {
  transactionId: number;
  toolId: number;
  assetNumber: string;
  toolName: string;
  artisanId: number;
  artisanName: string;
  issuedDate: string;
  returnedDate: string | null;
  transactionStatus: string;
  issuedBy: string;
  returnedBy: string | null;
};

type ActivityEvent = {
  id: string;
  dateTime: string;
  tool: string;
  action: "Booked Out" | "Returned";
  artisan: string;
  user: string;
};

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [allocations, setAllocations] = useState<CurrentAllocation[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activityDays, setActivityDays] = useState<2 | 7>(2);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [
          toolsResponse,
          allocationsResponse,
          recentResponse,
        ] = await Promise.all([
          fetch("http://localhost:5178/api/tools", { credentials: "include" }),
          fetch("http://localhost:5178/api/tooltransactions/current", { credentials: "include" }),
          fetch("http://localhost:5178/api/tooltransactions/recent", { credentials: "include" }),
        ]);

        if (
          !toolsResponse.ok ||
          !allocationsResponse.ok ||
          !recentResponse.ok
        ) {
          throw new Error("Unable to load dashboard data.");
        }

        const toolsData: Tool[] = await toolsResponse.json();
        const allocationsData: CurrentAllocation[] =
          await allocationsResponse.json();
        const recentData: RecentTransaction[] =
          await recentResponse.json();

        setTools(toolsData);
        setAllocations(allocationsData);
        setRecentTransactions(recentData);
      } catch (err) {
        console.error(err);
        setError("Could not connect to the Tool Store API.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const activeTools = tools.filter((tool) => tool.isActive);

  const totalTools = activeTools.length;

  const available = activeTools.filter(
    (tool) => tool.status === "Available"
  ).length;

  const bookedOut = activeTools.filter(
    (tool) => tool.status === "Booked Out"
  ).length;

  const damaged = activeTools.filter(
    (tool) => tool.status === "Damaged"
  ).length;

  const lost = activeTools.filter(
    (tool) => tool.status === "Lost"
  ).length;

  const currentAllocations = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return allocations;

    return allocations.filter((allocation) =>
      [
        allocation.assetNumber,
        allocation.toolName,
        allocation.artisanName,
        allocation.projectName ?? "",
      ].some((field) => field.toLowerCase().includes(value))
    );
  }, [allocations, search]);

  const recentActivity = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    recentTransactions.forEach((transaction) => {
      events.push({
        id: `${transaction.transactionId}-issued`,
        dateTime: transaction.issuedDate,
        tool: `${transaction.assetNumber} - ${transaction.toolName}`,
        action: "Booked Out",
        artisan: transaction.artisanName,
        user: transaction.issuedBy,
      });

      if (transaction.returnedDate) {
        events.push({
          id: `${transaction.transactionId}-returned`,
          dateTime: transaction.returnedDate,
          tool: `${transaction.assetNumber} - ${transaction.toolName}`,
          action: "Returned",
          artisan: transaction.artisanName,
          user: transaction.returnedBy ?? "—",
        });
      }
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - activityDays);

    return events
      .filter((event) => new Date(event.dateTime) >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() -
          new Date(a.dateTime).getTime()
      );
  }, [recentTransactions, activityDays]);

  function formatActivityDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

return (
  <div className="px-6 py-6">

    {/* PAGE HEADING */}
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-[36px] font-bold leading-none text-[#10204a]">
          Dashboard
        </h1>

        <p className="mt-2 text-[14px] text-[#536784]">
          Current tool availability and store activity
        </p>
      </div>

      <div className="flex gap-2.5">
        <Link
          href="/tool-transactions"
          className="flex h-[44px] items-center rounded-lg border border-[#c9d2df] bg-white px-5 text-[14px] font-semibold text-[#10204a] shadow-sm hover:bg-[#f8fafc]"
        >
          Transactions&nbsp; ↗
        </Link>

        <Link
          href="/tool-transactions"
          className="flex h-[44px] items-center rounded-lg bg-[#08285a] px-5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#0d336d]"
        >
          +&nbsp; Book Out Tool
        </Link>
      </div>
    </div>

    {/* KPI CARDS */}
    <section className="grid grid-cols-5 gap-3">
      <MetricCard
        title="TOTAL TOOLS"
        value={totalTools}
        description="registered assets"
        valueColor="text-[#1364d5]"
        icon="▣"
        iconColor="text-[#1364d5]"
      />

      <MetricCard
        title="AVAILABLE"
        value={available}
        description="ready in store"
        valueColor="text-[#159447]"
        icon="✓"
        iconColor="text-[#159447]"
      />

      <MetricCard
        title="BOOKED OUT"
        value={bookedOut}
        description="with artisans"
        valueColor="text-[#ef9000]"
        icon="↪"
        iconColor="text-[#ef9000]"
      />

      <MetricCard
        title="DAMAGED"
        value={damaged}
        description="awaiting repair"
        valueColor="text-[#d51e29]"
        icon="!"
        iconColor="text-[#d51e29]"
      />

      <MetricCard
        title="LOST"
        value={lost}
        description="under investigation"
        valueColor="text-[#53627a]"
        icon="?"
        iconColor="text-[#53627a]"
      />
    </section>

    {/* TABLE AREA */}
    <section className="mt-5 grid grid-cols-[1.55fr_1fr] gap-3">

      {/* CURRENT ALLOCATIONS */}
      <div className="overflow-hidden rounded-lg border border-[#d9e0e9] bg-white">
        <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#101e40]">
              Current tool allocations
            </h2>

            <p className="mt-0.5 text-[12px] text-[#536784]">
              Tools currently booked out to artisans
            </p>
          </div>

          <span className="rounded-full border border-[#f1d374] bg-[#fff9e8] px-3 py-1 text-[11px] font-semibold text-[#725700]">
            ● {bookedOut} active
          </span>
        </div>

        <div className="grid grid-cols-[1.05fr_0.9fr_1.25fr_0.75fr_0.65fr_0.55fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase text-[#364866]">
          <span>Asset Number</span>
          <span>Tool</span>
          <span>Artisan</span>
          <span>Project / Location</span>
          <span>Due Back</span>
          <span>Action</span>
        </div>

        {loading && (
          <div className="flex min-h-[205px] items-center justify-center text-[13px] text-[#65728a]">
            Loading tool information...
          </div>
        )}

        {error && (
          <div className="flex min-h-[205px] items-center justify-center text-[13px] font-medium text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && currentAllocations.length === 0 && (
          <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl text-[#c1cad7]">
              ▱
            </div>

            <p className="text-[14px] font-semibold text-[#10204a]">
              No tools currently booked out.
            </p>

            <p className="mt-1.5 text-[12px] text-[#65728a]">
              All registered tools are currently available in the store.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          currentAllocations.length > 0 &&
          currentAllocations.map((allocation) => (
            <div
              key={allocation.transactionId}
              className="grid grid-cols-[1.05fr_0.9fr_1.25fr_0.75fr_0.65fr_0.55fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px]"
            >
              <div>
                <p className="font-semibold text-[#17213c]">
                  {allocation.assetNumber}
                </p>
              </div>

              <div className="font-medium text-[#17213c]">
                {allocation.toolName}
              </div>

              <div className="text-[#17213c]">
                {allocation.artisanName}
              </div>

              <div className="text-[#65728a]">
                {allocation.projectName ?? "Store / Internal"}
              </div>

              <div className="text-[#65728a]">
                {allocation.expectedReturnDate
                  ? new Date(
                      allocation.expectedReturnDate
                    ).toLocaleDateString()
                  : "—"}
              </div>

              <Link
                href="/tool-transactions"
                className="inline-flex rounded border border-[#cfd7e3] px-2.5 py-1 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
              >
                Return
              </Link>
            </div>
          ))}
      </div>

      {/* RECENT ACTIVITY */}
      <div className="overflow-hidden rounded-lg border border-[#d9e0e9] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#d9e0e9] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#101e40]">
              Recent activity
            </h2>

            <p className="mt-0.5 text-[12px] text-[#536784]">
              Issue and return events from the last {activityDays} days
            </p>
          </div>

          <select
            value={activityDays}
            onChange={(event) =>
              setActivityDays(Number(event.target.value) as 2 | 7)
            }
            className="h-[34px] rounded-lg border border-[#cfd7e3] bg-white px-3 text-[11px] font-medium text-[#33425f] outline-none"
          >
            <option value={2}>Last 2 Days</option>
            <option value={7}>Last 7 Days</option>
          </select>
        </div>

        <div className="grid grid-cols-[0.9fr_0.75fr_0.75fr_0.8fr_0.55fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase text-[#364866]">
          <span>Date / Time</span>
          <span>Tool</span>
          <span>Action</span>
          <span>Artisan</span>
          <span>User</span>
        </div>

        {loading && (
          <div className="flex min-h-[205px] items-center justify-center text-[13px] text-[#65728a]">
            Loading recent activity...
          </div>
        )}

        {!loading && !error && recentActivity.length === 0 && (
          <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl text-[#c1cad7]">
              ▤
            </div>

            <p className="text-[14px] font-semibold text-[#10204a]">
              No transaction activity yet.
            </p>

            <p className="mt-1.5 text-[12px] text-[#65728a]">
              No issue or return activity was recorded in the last {activityDays} days.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          recentActivity.length > 0 &&
          recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="grid grid-cols-[0.9fr_0.75fr_0.75fr_0.8fr_0.55fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[10px] last:border-b-0"
            >
              <div className="text-[#65728a]">
                {formatActivityDate(activity.dateTime)}
              </div>

              <div className="font-medium text-[#17213c]">
                {activity.tool}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                    activity.action === "Returned"
                      ? "border-green-300 bg-green-100 text-green-800"
                      : "border-amber-300 bg-amber-100 text-amber-800"
                  }`}
                >
                  {activity.action}
                </span>
              </div>

              <div className="text-[#17213c]">
                {activity.artisan}
              </div>

              <div className="text-[#65728a]">
                {activity.user}
              </div>
            </div>
          ))}
      </div>
    </section>
  </div>
);
}

function MetricCard({
  title,
  value,
  description,
  valueColor,
  icon,
  iconColor,
}: {
  title: string;
  value: number;
  description: string;
  valueColor: string;
  icon: string;
  iconColor: string;
}) {
  return (
    <div className="min-h-[145px] rounded-lg border border-[#d9e0e9] bg-white px-5 py-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#4d607f]">
            {title}
          </p>

          <p
            className={`mt-4 text-[34px] font-bold leading-none ${valueColor}`}
          >
            {value}
          </p>

          <p className="mt-4 text-[12px] text-[#52627c]">
            {description}
          </p>
        </div>

        <div className={`text-[24px] font-semibold ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}