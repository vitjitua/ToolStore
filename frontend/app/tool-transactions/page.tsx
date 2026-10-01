"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const CURRENT_USER_ID = 1;
const TOOLS_PER_PAGE = 10;

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

type Artisan = {
  artisanId: number;
  employeeNumber: string;
  fullName: string;
  department: string | null;
  trade: string | null;
  isActive: boolean;
};

type Project = {
  projectId: number;
  projectNumber: string;
  projectName: string;
  status: string;
};

type ToolStatus = {
  statusId: number;
  statusName: string;
  canBookOut: boolean;
};

type ToolCondition = {
  conditionId: number;
  conditionName: string;
  allowedOnIssue: boolean;
  allowedOnReturn: boolean;
};

export default function ToolTransactionsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [allocations, setAllocations] = useState<CurrentAllocation[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [statuses, setStatuses] = useState<ToolStatus[]>([]);
  const [conditions, setConditions] = useState<ToolCondition[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const [selectedAllocation, setSelectedAllocation] =
    useState<CurrentAllocation | null>(null);

  const [showBookOutModal, setShowBookOutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [artisanId, setArtisanId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  const [issueCondition, setIssueCondition] = useState("");
  const [bookOutRemarks, setBookOutRemarks] = useState("");

  const [returnCondition, setReturnCondition] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const issueConditions = useMemo(
    () =>
      conditions.filter(
        (condition) => condition.allowedOnIssue
      ),
    [conditions]
  );

  const returnConditions = useMemo(
    () =>
      conditions.filter(
        (condition) => condition.allowedOnReturn
      ),
    [conditions]
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        toolsResponse,
        allocationsResponse,
        artisansResponse,
        projectsResponse,
        statusesResponse,
        conditionsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tools`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/tooltransactions/current`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/artisans`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/projects`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/masterdata/statuses`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/masterdata/conditions`, { credentials: "include" }),
      ]);

      if (
        !toolsResponse.ok ||
        !allocationsResponse.ok ||
        !artisansResponse.ok ||
        !projectsResponse.ok ||
        !statusesResponse.ok ||
        !conditionsResponse.ok
      ) {
        throw new Error(
          "Unable to load Tool Store transaction data."
        );
      }

      const toolsData: Tool[] = await toolsResponse.json();

      const allocationsData: CurrentAllocation[] =
        await allocationsResponse.json();

      const artisansData: Artisan[] =
        await artisansResponse.json();

      const projectsData: Project[] =
        await projectsResponse.json();

      const statusesData: ToolStatus[] =
        await statusesResponse.json();

      const conditionsData: ToolCondition[] =
        await conditionsResponse.json();

      setTools(toolsData);
      setAllocations(allocationsData);

      setArtisans(
        artisansData.filter(
          (artisan) => artisan.isActive
        )
      );

      setProjects(
        projectsData.filter(
          (project) => project.status === "Active"
        )
      );

      setStatuses(statusesData);
      setConditions(conditionsData);
    } catch (err) {
      console.error(err);

      setError(
        "Could not connect to the Tool Store API."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const toolRows = useMemo(() => {
    const value = search.trim().toLowerCase();

    return tools
      .filter((tool) => tool.isActive)
      .map((tool) => {
        const allocation = allocations.find(
          (item) => item.toolId === tool.toolId
        );

        const statusDefinition = statuses.find(
          (status) =>
            status.statusName === tool.status
        );

        return {
          ...tool,
          allocation,
          statusDefinition,
        };
      })
      .filter((row) => {
        const matchesSearch =
          !value ||
          [
            row.assetNumber,
            row.toolName,
            row.category ?? "",
            row.condition,
            row.status,
            row.allocation?.artisanName ?? "",
            row.allocation?.projectName ?? "",
          ].some((field) =>
            field.toLowerCase().includes(value)
          );

        const matchesStatus =
          statusFilter === "All" ||
          row.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [
    tools,
    allocations,
    statuses,
    search,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(toolRows.length / TOOLS_PER_PAGE)
  );

  const paginatedToolRows = useMemo(() => {
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;
    return toolRows.slice(startIndex, startIndex + TOOLS_PER_PAGE);
  }, [toolRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

function getStatusStyle(statusName: string) {
  switch (statusName.toLowerCase()) {
    case "available":
      return "border-green-300 bg-green-100 text-green-800";

    case "booked out":
      return "border-amber-300 bg-amber-100 text-amber-800";

    case "damaged":
      return "border-red-300 bg-red-100 text-red-800";

    case "under repair":
      return "border-blue-300 bg-blue-100 text-blue-800";

    case "lost":
      return "border-slate-300 bg-slate-200 text-slate-800";

    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

  function openBookOutModal(tool: Tool) {
    setSelectedTool(tool);

    setArtisanId("");
    setProjectId("");
    setExpectedReturnDate("");

    setIssueCondition(
      issueConditions.length > 0
        ? issueConditions[0].conditionName
        : ""
    );

    setBookOutRemarks("");
    setModalError("");
    setSuccessMessage("");

    setShowBookOutModal(true);
  }

  function closeBookOutModal() {
    if (submitting) return;

    setShowBookOutModal(false);
    setSelectedTool(null);
    setModalError("");
  }

  function openReturnModal(
    allocation: CurrentAllocation
  ) {
    setSelectedAllocation(allocation);

    setReturnCondition(
      returnConditions.length > 0
        ? returnConditions[0].conditionName
        : ""
    );

    setReturnRemarks("");
    setModalError("");
    setSuccessMessage("");

    setShowReturnModal(true);
  }

  function closeReturnModal() {
    if (submitting) return;

    setShowReturnModal(false);
    setSelectedAllocation(null);
    setModalError("");
  }

  async function getErrorMessage(
    response: Response,
    fallback: string
  ) {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      const data = JSON.parse(text);

      if (typeof data === "string") {
        return data;
      }

      if (data.message) {
        return data.message;
      }

      if (data.title) {
        return data.title;
      }

      return fallback;
    } catch {
      return text;
    }
  }

  async function handleBookOut() {
    if (!selectedTool) return;

    setModalError("");
    setSuccessMessage("");

    if (!artisanId) {
      setModalError(
        "Please select an artisan."
      );
      return;
    }

    if (!expectedReturnDate) {
      setModalError(
        "Please select the expected return date."
      );
      return;
    }

    if (!issueCondition) {
      setModalError(
        "No issue condition is available. Please contact an administrator."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/tooltransactions/bookout`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            toolId: selectedTool.toolId,

            artisanId: Number(artisanId),

            projectId: projectId
              ? Number(projectId)
              : null,

            expectedReturnDate:
              `${expectedReturnDate}T16:00:00`,

            issueCondition,

            issuedByUserId: CURRENT_USER_ID,

            remarks:
              bookOutRemarks.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to book out tool."
        );

        throw new Error(message);
      }

      const completedTool = selectedTool;

      setShowBookOutModal(false);
      setSelectedTool(null);

      await loadData();

      setSuccessMessage(
        `${completedTool.assetNumber} - ${completedTool.toolName} was booked out successfully.`
      );
    } catch (err) {
      console.error(err);

      setModalError(
        err instanceof Error
          ? err.message
          : "Unable to book out tool."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn() {
    if (!selectedAllocation) return;

    setModalError("");
    setSuccessMessage("");

    if (!returnCondition) {
      setModalError(
        "No return condition is available. Please contact an administrator."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/tooltransactions/return`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            transactionId:
              selectedAllocation.transactionId,

            returnCondition,

            returnedByUserId:
              CURRENT_USER_ID,

            remarks:
              returnRemarks.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to return tool."
        );

        throw new Error(message);
      }

      const completedAllocation =
        selectedAllocation;

      setShowReturnModal(false);
      setSelectedAllocation(null);

      await loadData();

      setSuccessMessage(
        `${completedAllocation.assetNumber} - ${completedAllocation.toolName} was returned successfully.`
      );
    } catch (err) {
      console.error(err);

      setModalError(
        err instanceof Error
          ? err.message
          : "Unable to return tool."
      );
    } finally {
      setSubmitting(false);
    }
  }

return (
  <>
    <div className="px-8 py-7">

        {/* PAGE HEADER */}
        <div className="mb-6">

          <h1 className="text-[34px] font-bold leading-tight text-[#10204a]">
            Tool Transactions
          </h1>

          <p className="mt-1.5 text-[14px] text-[#536784]">
            Issue and return tools from the store.
          </p>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-medium text-green-700">
            <span>{successMessage}</span>

            <button
              onClick={() =>
                setSuccessMessage("")
              }
              className="ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* TABLE */}
        <section className="overflow-hidden rounded-lg border border-[#d9e0e9] bg-white">

          {/* TOOLBAR */}
          <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#101e40]">
                Tool Transactions
              </h2>

              <p className="mt-0.5 text-[12px] text-[#65728a]">
                Select a tool below to book it out or return it.
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* SEARCH */}
              <div className="relative w-[320px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65728a]">
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search tools..."
                  className="h-[40px] w-full rounded-lg border border-[#cfd7e3] bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              {/* DYNAMIC STATUS FILTER */}
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="h-[40px] min-w-[145px] rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] font-medium text-[#33425f] outline-none focus:border-[#213767]"
              >
                <option value="All">
                  All Statuses
                </option>

                {statuses.map((status) => (
                  <option
                    key={status.statusId}
                    value={status.statusName}
                  >
                    {status.statusName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-[0.8fr_1.25fr_0.9fr_0.75fr_0.85fr_1.1fr_1fr_0.85fr_0.75fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.04em] text-[#364866]">
            <span>Asset No.</span>
            <span>Tool</span>
            <span>Category</span>
            <span>Condition</span>
            <span>Status</span>
            <span>Current Artisan</span>
            <span>Project</span>
            <span>Due Back</span>
            <span>Action</span>
          </div>

          {loading && (
            <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
              Loading tools...
            </div>
          )}

          {error && (
            <div className="flex min-h-[260px] items-center justify-center text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            toolRows.length === 0 && (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-3 text-4xl text-[#c1cad7]">
                  🔧
                </div>

                <p className="text-[14px] font-semibold text-[#10204a]">
                  No matching tools found.
                </p>

                <p className="mt-1 text-[12px] text-[#65728a]">
                  Try changing the search or status filter.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            paginatedToolRows.map((row) => {
              const canBookOut =
                row.statusDefinition?.canBookOut ===
                true;

              const hasOpenAllocation =
                Boolean(row.allocation);

              return (
                <div
                  key={row.toolId}
                  className="grid grid-cols-[0.8fr_1.25fr_0.9fr_0.75fr_0.85fr_1.1fr_1fr_0.85fr_0.75fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
                >
                  <div className="font-semibold text-[#17213c]">
                    {row.assetNumber}
                  </div>

                  <div className="font-medium text-[#17213c]">
                    {row.toolName}
                  </div>

                  <div className="text-[#65728a]">
                    {row.category ?? "—"}
                  </div>

                  <div className="text-[#53627a]">
                    {row.condition}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div className="font-medium text-[#17213c]">
                    {row.allocation
                      ?.artisanName ?? "—"}
                  </div>

                  <div className="text-[#65728a]">
                    {row.allocation
                      ?.projectName ?? "—"}
                  </div>

                  <div className="text-[#65728a]">
                    {row.allocation
                      ?.expectedReturnDate
                      ? new Date(
                          row.allocation
                            .expectedReturnDate
                        ).toLocaleDateString()
                      : "—"}
                  </div>

                  <div>
                    {hasOpenAllocation &&
                    row.allocation ? (
                      <button
                        onClick={() =>
                          openReturnModal(
                            row.allocation!
                          )
                        }
                        className="h-[32px] min-w-[78px] rounded-md bg-[#F5C932] px-4 text-[10px] font-bold text-[#10204a] shadow-sm hover:bg-[#e4b91f]"
                      >
                        Return
                      </button>
                    ) : canBookOut ? (
                      <button
                        onClick={() =>
                          openBookOutModal(row)
                        }
                        className="h-[32px] rounded-md bg-[#08285a] px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-[#0d336d]"
                      >
                        Book Out
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#8b97aa]">
                        —
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          {!loading && !error && toolRows.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3">
              <p className="text-[11px] text-[#65728a]">
                Showing{" "}
                {(currentPage - 1) * TOOLS_PER_PAGE + 1}–
                {Math.min(currentPage * TOOLS_PER_PAGE, toolRows.length)} of{" "}
                {toolRows.length} tools
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="h-[32px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-[90px] text-center text-[11px] font-medium text-[#536784]">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="h-[32px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* BOOK OUT MODAL */}
      {showBookOutModal &&
        selectedTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
            <div className="w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                    Book Out Tool
                  </p>

                  <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                    {selectedTool.assetNumber} -{" "}
                    {selectedTool.toolName}
                  </h2>

                  <p className="mt-1 text-[12px] text-[#65728a]">
                    Assign this tool to an artisan.
                  </p>
                </div>

                <button
                  onClick={
                    closeBookOutModal
                  }
                  className="text-[24px] leading-none text-[#65728a]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">

                {modalError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Artisan *
                  </label>

                  <select
                    value={artisanId}
                    onChange={(event) =>
                      setArtisanId(
                        event.target.value
                      )
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none focus:border-[#213767]"
                  >
                    <option value="">
                      Select artisan
                    </option>

                    {artisans.map(
                      (artisan) => (
                        <option
                          key={
                            artisan.artisanId
                          }
                          value={
                            artisan.artisanId
                          }
                        >
                          {
                            artisan.employeeNumber
                          }{" "}
                          - {artisan.fullName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Project
                  </label>

                  <select
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(
                        event.target.value
                      )
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none focus:border-[#213767]"
                  >
                    <option value="">
                      No project / internal
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={
                            project.projectId
                          }
                          value={
                            project.projectId
                          }
                        >
                          {
                            project.projectNumber
                          }{" "}
                          - {project.projectName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                      Expected Return Date *
                    </label>

                    <input
                      type="date"
                      value={
                        expectedReturnDate
                      }
                      onChange={(event) =>
                        setExpectedReturnDate(
                          event.target.value
                        )
                      }
                      className="h-[42px] w-full rounded-lg border border-[#cfd7e3] px-3 text-[13px] outline-none focus:border-[#213767]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                      Issue Condition *
                    </label>

                    <select
                      value={issueCondition}
                      onChange={(event) =>
                        setIssueCondition(
                          event.target.value
                        )
                      }
                      className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none focus:border-[#213767]"
                    >
                      {issueConditions.length ===
                      0 ? (
                        <option value="">
                          No conditions available
                        </option>
                      ) : (
                        issueConditions.map(
                          (condition) => (
                            <option
                              key={
                                condition.conditionId
                              }
                              value={
                                condition.conditionName
                              }
                            >
                              {
                                condition.conditionName
                              }
                            </option>
                          )
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Remarks
                  </label>

                  <textarea
                    rows={3}
                    value={bookOutRemarks}
                    onChange={(event) =>
                      setBookOutRemarks(
                        event.target.value
                      )
                    }
                    placeholder="Optional remarks..."
                    className="w-full resize-none rounded-lg border border-[#cfd7e3] px-3 py-2.5 text-[13px] outline-none focus:border-[#213767]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
                <button
                  onClick={
                    closeBookOutModal
                  }
                  disabled={submitting}
                  className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
                >
                  Cancel
                </button>

                <button
                  onClick={handleBookOut}
                  disabled={
                    submitting ||
                    issueConditions.length === 0
                  }
                  className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Booking Out..."
                    : "Confirm Book Out"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* RETURN MODAL */}
      {showReturnModal &&
        selectedAllocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
            <div className="w-full max-w-[500px] overflow-hidden rounded-xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                    Return Tool
                  </p>

                  <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                    {
                      selectedAllocation.assetNumber
                    }{" "}
                    -{" "}
                    {
                      selectedAllocation.toolName
                    }
                  </h2>

                  <p className="mt-1 text-[12px] text-[#65728a]">
                    Currently issued to{" "}
                    <span className="font-semibold text-[#33425f]">
                      {
                        selectedAllocation.artisanName
                      }
                    </span>
                  </p>
                </div>

                <button
                  onClick={
                    closeReturnModal
                  }
                  className="text-[24px] leading-none text-[#65728a]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">

                {modalError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Return Condition *
                  </label>

                  <select
                    value={returnCondition}
                    onChange={(event) =>
                      setReturnCondition(
                        event.target.value
                      )
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none focus:border-[#213767]"
                  >
                    {returnConditions.length ===
                    0 ? (
                      <option value="">
                        No conditions available
                      </option>
                    ) : (
                      returnConditions.map(
                        (condition) => (
                          <option
                            key={
                              condition.conditionId
                            }
                            value={
                              condition.conditionName
                            }
                          >
                            {
                              condition.conditionName
                            }
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Remarks
                  </label>

                  <textarea
                    rows={3}
                    value={returnRemarks}
                    onChange={(event) =>
                      setReturnRemarks(
                        event.target.value
                      )
                    }
                    placeholder="Optional return remarks..."
                    className="w-full resize-none rounded-lg border border-[#cfd7e3] px-3 py-2.5 text-[13px] outline-none focus:border-[#213767]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
                <button
                  onClick={
                    closeReturnModal
                  }
                  disabled={submitting}
                  className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
                >
                  Cancel
                </button>

                <button
                  onClick={handleReturn}
                  disabled={
                    submitting ||
                    returnConditions.length === 0
                  }
                  className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Returning..."
                    : "Confirm Return"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
