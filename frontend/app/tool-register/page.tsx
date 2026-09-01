"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type UserRole = "Storeman" | "Manager" | "Admin";

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

type ToolCondition = {
  conditionId: number;
  conditionName: string;
  allowedOnIssue: boolean;
  allowedOnReturn: boolean;
  resultingStatusId: number | null;
  resultingStatusName: string | null;
};

type ToolStatus = {
  statusId: number;
  statusName: string;
  canBookOut: boolean;
};

type ActiveUser = {
  userId: number;
  employeeNumber: string | null;
  displayName: string;
  emailAddress: string;
  role: UserRole;
  isActive: boolean;
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

const API_BASE_URL = "http://localhost:5178";
const STORAGE_KEY = "toolstore-test-user-id";

export default function ToolRegisterPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [conditions, setConditions] = useState<ToolCondition[]>([]);
  const [statuses, setStatuses] = useState<ToolStatus[]>([]);
  const [allocations, setAllocations] = useState<CurrentAllocation[]>([]);

  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const [assetNumber, setAssetNumber] = useState("");
  const [toolName, setToolName] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");

  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canMaintainTools =
    currentRole === "Manager" || currentRole === "Admin";

  // ============================================================
  // LOAD CURRENT TEST USER
  // ============================================================

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const storedUserId = localStorage.getItem(STORAGE_KEY);

        if (!storedUserId) {
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users`);

        if (!response.ok) {
          throw new Error("Unable to load current test user.");
        }

        const activeUsers: ActiveUser[] = await response.json();

        const selectedUser = activeUsers.find(
          (user) => user.userId === Number(storedUserId)
        );

        if (selectedUser) {
          setCurrentUser(selectedUser);
          setCurrentRole(selectedUser.role);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadCurrentUser();
  }, []);

  // ============================================================
  // LOAD DATA
  // ============================================================

  async function loadTools() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/tools`);

      if (!response.ok) {
        throw new Error("Unable to load tools.");
      }

      const data: Tool[] = await response.json();
      setTools(data);
    } catch (err) {
      console.error(err);
      setError("Could not load Tool Register.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAllocations() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tooltransactions/current`
      );

      if (!response.ok) {
        throw new Error("Unable to load current allocations.");
      }

      const data: CurrentAllocation[] = await response.json();
      setAllocations(data);
    } catch (err) {
      console.error(err);
      setError("Could not load current tool allocations.");
    }
  }

  async function loadMasterData() {
    try {
      const [conditionsResponse, statusesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/masterdata/conditions`),
        fetch(`${API_BASE_URL}/api/masterdata/statuses`),
      ]);

      if (!conditionsResponse.ok || !statusesResponse.ok) {
        throw new Error("Unable to load master data.");
      }

      const conditionData: ToolCondition[] =
        await conditionsResponse.json();

      const statusData: ToolStatus[] =
        await statusesResponse.json();

      setConditions(conditionData);
      setStatuses(statusData);
    } catch (err) {
      console.error(err);
      setError("Could not load Tool Register master data.");
    }
  }

  useEffect(() => {
    loadTools();
    loadMasterData();
    loadAllocations();
  }, []);

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesSearch =
        !search ||
        tool.assetNumber.toLowerCase().includes(search) ||
        tool.toolName.toLowerCase().includes(search) ||
        (tool.category ?? "").toLowerCase().includes(search) ||
        (tool.serialNumber ?? "").toLowerCase().includes(search) ||
        (tool.storeLocation ?? "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || tool.status === statusFilter;

      const matchesCondition =
        conditionFilter === "All" ||
        tool.condition === conditionFilter;

      return matchesSearch && matchesStatus && matchesCondition;
    });
  }, [tools, searchTerm, statusFilter, conditionFilter]);

  // ============================================================
  // MODAL
  // ============================================================

  function openAddModal() {
    setEditingTool(null);

    setAssetNumber("");
    setToolName("");
    setCategory("");
    setSerialNumber("");
    setStoreLocation("");

    const defaultCondition =
      conditions.find(
        (item) =>
          item.conditionName.toLowerCase() === "good"
      )?.conditionName ??
      conditions[0]?.conditionName ??
      "";

    const defaultStatus =
      statuses.find(
        (item) =>
          item.statusName.toLowerCase() === "available"
      )?.statusName ??
      statuses[0]?.statusName ??
      "";

    setCondition(defaultCondition);
    setStatus(defaultStatus);

    setModalError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function openEditModal(tool: Tool) {
    setEditingTool(tool);

    setAssetNumber(tool.assetNumber);
    setToolName(tool.toolName);
    setCategory(tool.category ?? "");
    setSerialNumber(tool.serialNumber ?? "");
    setStoreLocation(tool.storeLocation ?? "");
    setCondition(tool.condition);
    setStatus(tool.status);

    setModalError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setEditingTool(null);
    setModalError("");
  }

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  async function getErrorMessage(
    response: Response,
    fallback: string
  ) {
    const text = await response.text();

    if (!text) return fallback;

    try {
      const data = JSON.parse(text);

      if (typeof data === "string") return data;
      if (data.message) return data.message;
      if (data.title) return data.title;

      return fallback;
    } catch {
      return text;
    }
  }

  // ============================================================
  // SAVE TOOL
  // ============================================================

  async function handleSaveTool() {
    setModalError("");
    setSuccessMessage("");

    const trimmedAssetNumber = assetNumber.trim();
    const trimmedToolName = toolName.trim();

    if (!trimmedAssetNumber) {
      setModalError("Please enter an asset number.");
      return;
    }

    if (!trimmedToolName) {
      setModalError("Please enter a tool name.");
      return;
    }

    if (!condition) {
      setModalError("Please select a condition.");
      return;
    }

    if (!status) {
      setModalError("Please select a status.");
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = editingTool !== null;

      const url = isEditing
        ? `${API_BASE_URL}/api/tools/${editingTool.toolId}`
        : `${API_BASE_URL}/api/tools`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetNumber: trimmedAssetNumber,
          toolName: trimmedToolName,
          category: category.trim() || null,
          serialNumber: serialNumber.trim() || null,
          storeLocation: storeLocation.trim() || null,
          condition,
          status,
          createdBy: currentUser?.displayName ?? null,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          isEditing
            ? "Unable to update tool."
            : "Unable to create tool."
        );

        throw new Error(message);
      }

      await loadTools();

      setShowModal(false);

      setSuccessMessage(
        isEditing
          ? `${trimmedAssetNumber} was updated successfully.`
          : `${trimmedAssetNumber} was added successfully.`
      );

      setEditingTool(null);
    } catch (err) {
      console.error(err);

      setModalError(
        err instanceof Error
          ? err.message
          : "Unable to save tool."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // ACTIVATE / DEACTIVATE
  // ============================================================

  async function handleToggleActive(tool: Tool) {
    setError("");
    setSuccessMessage("");

    const newValue = !tool.isActive;
    const actionWord = newValue ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${tool.assetNumber} - ${tool.toolName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tools/${tool.toolId}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: newValue,
          }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          `Unable to ${actionWord} tool.`
        );

        throw new Error(message);
      }

      await loadTools();

      setSuccessMessage(
        `${tool.assetNumber} was ${
          newValue ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${actionWord} tool.`
      );
    }
  }

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  function handleExportExcel() {
    if (!canMaintainTools) return;

    if (filteredTools.length === 0) {
      setError("There are no tools in the current view to export.");
      return;
    }

    setError("");
    setSuccessMessage("");

    const allocationByToolId = new Map(
      allocations.map((allocation) => [allocation.toolId, allocation])
    );

    const reportRows = filteredTools.map((tool) => {
      const allocation = allocationByToolId.get(tool.toolId);

      return {
        "Asset Number": tool.assetNumber,
        "Tool Name": tool.toolName,
        Category: tool.category ?? "",
        "Serial Number": tool.serialNumber ?? "",
        Condition: tool.condition,
        Status: tool.status,
        "Store Location": tool.storeLocation ?? "",
        "Current Artisan": allocation?.artisanName ?? "",
        Project: allocation?.projectName ?? "",
        Active: tool.isActive ? "Yes" : "No",
      };
    });

    const generatedAt = new Date();
    const generatedText = generatedAt.toLocaleString("en-GB");

    const worksheetData = [
      ["NAMDOCK Tool Store Management System"],
      ["Tool Register Status Report"],
      [`Generated: ${generatedText}`],
      [
        `Filters: Condition = ${conditionFilter}; Status = ${statusFilter}; Search = ${
          searchTerm.trim() || "None"
        }`,
      ],
      [],
      Object.keys(reportRows[0]),
      ...reportRows.map((row) => Object.values(row)),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 10 },
    ];

    worksheet["!merges"] = [
      XLSX.utils.decode_range("A1:J1"),
      XLSX.utils.decode_range("A2:J2"),
      XLSX.utils.decode_range("A3:J3"),
      XLSX.utils.decode_range("A4:J4"),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tool Register");

    const year = generatedAt.getFullYear();
    const month = String(generatedAt.getMonth() + 1).padStart(2, "0");
    const day = String(generatedAt.getDate()).padStart(2, "0");

    XLSX.writeFile(
      workbook,
      `NAMDOCK_Tool_Register_${year}-${month}-${day}.xlsx`
    );

    setSuccessMessage(
      `${filteredTools.length} tool${
        filteredTools.length === 1 ? "" : "s"
      } exported successfully.`
    );
  }

  // ============================================================
  // STATUS STYLE
  // ============================================================

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

  return (
    <>
      <div className="px-8 py-7">

        {/* HEADER */}
        <div className="mb-7">

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[34px] font-bold leading-tight text-[#10204a]">
                Tool Register
              </h1>

              <p className="mt-1.5 text-[14px] text-[#536784]">
                View and maintain tools registered in the store.
              </p>
            </div>

            {canMaintainTools && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                >
                  Export Excel
                </button>

                <button
                  onClick={openAddModal}
                  className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white hover:bg-[#0d336d]"
                >
                  + Add Tool
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-medium text-green-700">
            <span>{successMessage}</span>

            <button
              onClick={() => setSuccessMessage("")}
              className="ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* REGISTER */}
        <section className="overflow-hidden rounded-lg border border-[#d9e0e9] bg-white">

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9e0e9] px-5 py-4">

            <div>
              <h2 className="text-[16px] font-bold text-[#101e40]">
                Registered Tools
              </h2>

              <p className="mt-0.5 text-[12px] text-[#65728a]">
                {filteredTools.length} tool
                {filteredTools.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search tools..."
                className="h-[38px] w-[240px] rounded-lg border border-[#cfd7e3] bg-white px-3 text-[12px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
              />

              <select
                value={conditionFilter}
                onChange={(event) =>
                  setConditionFilter(event.target.value)
                }
                className="h-[38px] rounded-lg border border-[#cfd7e3] bg-white px-3 text-[12px] text-[#33425f] outline-none"
              >
                <option value="All">All Conditions</option>

                {conditions.map((item) => (
                  <option
                    key={item.conditionId}
                    value={item.conditionName}
                  >
                    {item.conditionName}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-[38px] rounded-lg border border-[#cfd7e3] bg-white px-3 text-[12px] text-[#33425f] outline-none"
              >
                <option value="All">All Statuses</option>

                {statuses.map((item) => (
                  <option
                    key={item.statusId}
                    value={item.statusName}
                  >
                    {item.statusName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-[0.8fr_1.25fr_1fr_1fr_0.9fr_0.9fr_1fr_0.7fr_1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
            <span>Asset No.</span>
            <span>Tool Name</span>
            <span>Category</span>
            <span>Serial No.</span>
            <span>Condition</span>
            <span>Status</span>
            <span>Store Location</span>
            <span>Active</span>
            <span>Action</span>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
              Loading tools...
            </div>
          )}

          {/* EMPTY */}
          {!loading && filteredTools.length === 0 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <p className="text-[14px] font-semibold text-[#10204a]">
                No tools found.
              </p>

              <p className="mt-1 text-[12px] text-[#65728a]">
                Adjust your search or filters.
              </p>
            </div>
          )}

          {/* ROWS */}
          {!loading &&
            filteredTools.map((tool) => (
              <div
                key={tool.toolId}
                className="grid grid-cols-[0.8fr_1.25fr_1fr_1fr_0.9fr_0.9fr_1fr_0.7fr_1fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
              >
                <div className="font-semibold text-[#17213c]">
                  {tool.assetNumber}
                </div>

                <div className="font-medium text-[#33425f]">
                  {tool.toolName}
                </div>

                <div className="text-[#536784]">
                  {tool.category || "—"}
                </div>

                <div className="text-[#536784]">
                  {tool.serialNumber || "—"}
                </div>

                <div className="text-[#536784]">
                  {tool.condition}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(
                      tool.status
                    )}`}
                  >
                    {tool.status}
                  </span>
                </div>

                <div className="text-[#536784]">
                  {tool.storeLocation || "—"}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      tool.isActive
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tool.isActive ? "Yes" : "No"}
                  </span>
                </div>

                <div>
                  {canMaintainTools ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleActive(tool)}
                        className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${
                          tool.isActive
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {tool.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[#8b97aa]">View only</span>
                  )}
                </div>
              </div>
            ))}
        </section>
      </div>

      {/* ADD / EDIT TOOL MODAL */}
      {showModal && canMaintainTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">

          <div className="w-full max-w-[620px] overflow-hidden rounded-xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Tool Register
                </p>

                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  {editingTool ? "Edit Tool" : "Add Tool"}
                </h2>

                <p className="mt-1 text-[12px] text-[#65728a]">
                  Maintain the master record for this tool.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">

              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Asset Number *
                  </label>

                  <input
                    value={assetNumber}
                    onChange={(event) =>
                      setAssetNumber(event.target.value)
                    }
                    placeholder="e.g. TL-0006"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Tool Name *
                  </label>

                  <input
                    value={toolName}
                    onChange={(event) =>
                      setToolName(event.target.value)
                    }
                    placeholder="e.g. Hydraulic Jack"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Category
                  </label>

                  <input
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    placeholder="e.g. Lifting Equipment"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Serial Number
                  </label>

                  <input
                    value={serialNumber}
                    onChange={(event) =>
                      setSerialNumber(event.target.value)
                    }
                    placeholder="Optional"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Store Location
                </label>

                <input
                  value={storeLocation}
                  onChange={(event) =>
                    setStoreLocation(event.target.value)
                  }
                  placeholder="e.g. Main Tool Store"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Condition *
                  </label>

                  <select
                    value={condition}
                    onChange={(event) =>
                      setCondition(event.target.value)
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"
                  >
                    <option value="">
                      Select condition
                    </option>

                    {conditions.map((item) => (
                      <option
                        key={item.conditionId}
                        value={item.conditionName}
                      >
                        {item.conditionName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Status *
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"
                  >
                    <option value="">
                      Select status
                    </option>

                    {statuses.map((item) => (
                      <option
                        key={item.statusId}
                        value={item.statusName}
                      >
                        {item.statusName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[11px] leading-5 text-[#65728a]">
                Condition and Status are controlled by Tool Store master data.
                New tools are created as Active.
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">

              <button
                onClick={closeModal}
                disabled={submitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveTool}
                disabled={submitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : editingTool
                    ? "Save Changes"
                    : "Add Tool"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}