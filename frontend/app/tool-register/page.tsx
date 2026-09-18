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

type ImportToolRow = {
  assetNumber: string;
  toolName: string;
  category: string;
  serialNumber: string;
  storeLocation: string;
};

type ImportError = {
  rowNumber: number;
  assetNumber: string | null;
  toolName: string | null;
  errors: string[];
};

type ImportResult = {
  totalRows: number;
  importedCount: number;
  rejectedCount: number;
  errors: ImportError[];
};

const API_BASE_URL = "http://localhost:5178";
const STORAGE_KEY = "toolstore-test-user-id";
const TOOLS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

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

  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<ImportToolRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTools.length / TOOLS_PER_PAGE)
  );

  const paginatedTools = useMemo(() => {
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;

    return filteredTools.slice(
      startIndex,
      startIndex + TOOLS_PER_PAGE
    );
  }, [filteredTools, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, conditionFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
  // IMPORT TOOLS
  // ============================================================

  function downloadImportTemplate() {
    const templateRows = [
      {
        "Asset Number": "TL-0006",
        "Tool Name": "Hydraulic Jack",
        Category: "Lifting Equipment",
        "Serial Number": "HJ-1001",
        "Store Location": "Main Tool Store",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tool Import Template");

    XLSX.writeFile(workbook, "NAMDOCK_Tool_Import_Template.xlsx");
  }

  function openImportModal() {
    setImportRows([]);
    setImportFileName("");
    setImportError("");
    setImportResult(null);
    setShowImportModal(true);
  }

  function closeImportModal() {
    if (importing) return;

    setShowImportModal(false);
    setImportRows([]);
    setImportFileName("");
    setImportError("");
    setImportResult(null);
  }

  async function handleImportFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImportError("");
    setImportResult(null);
    setImportRows([]);
    setImportFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The Excel file does not contain a worksheet.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
          raw: false,
        }
      );

      if (rawRows.length === 0) {
        throw new Error("The Excel file does not contain any tool rows.");
      }

      const requiredColumns = [
        "Asset Number",
        "Tool Name",
      ];

      const firstRow = rawRows[0];
      const columns = Object.keys(firstRow);

      const missingColumns = requiredColumns.filter(
        (column) => !columns.includes(column)
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required column${
            missingColumns.length === 1 ? "" : "s"
          }: ${missingColumns.join(", ")}.`
        );
      }

      const parsedRows: ImportToolRow[] = rawRows.map((row) => ({
        assetNumber: String(row["Asset Number"] ?? "").trim(),
        toolName: String(row["Tool Name"] ?? "").trim(),
        category: String(row["Category"] ?? "").trim(),
        serialNumber: String(row["Serial Number"] ?? "").trim(),
        storeLocation: String(row["Store Location"] ?? "").trim(),
      }));

      setImportRows(parsedRows);
    } catch (err) {
      console.error(err);
      setImportError(
        err instanceof Error
          ? err.message
          : "Unable to read the Excel file."
      );
    } finally {
      event.target.value = "";
    }
  }

  function getImportRowIssues(row: ImportToolRow, index: number) {
    const issues: string[] = [];

    if (!row.assetNumber) {
      issues.push("Asset Number required");
    }

    if (!row.toolName) {
      issues.push("Tool Name required");
    }
    if (row.assetNumber) {
      const duplicateInRegister = tools.some(
        (tool) =>
          tool.assetNumber.toLowerCase() ===
          row.assetNumber.toLowerCase()
      );

      if (duplicateInRegister) {
        issues.push("Asset already exists");
      }

      const duplicateInFile =
        importRows.findIndex(
          (item) =>
            item.assetNumber.toLowerCase() ===
            row.assetNumber.toLowerCase()
        ) !== index;

      if (duplicateInFile) {
        issues.push("Duplicate in file");
      }
    }

    return issues;
  }

  async function handleConfirmImport() {
    if (!canMaintainTools) return;

    if (importRows.length === 0) {
      setImportError("Please select an Excel file first.");
      return;
    }

    setImportError("");
    setImportResult(null);

    try {
      setImporting(true);

      const response = await fetch(`${API_BASE_URL}/api/tools/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          createdBy: currentUser?.displayName ?? null,
          tools: importRows,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to import tools."
        );

        throw new Error(message);
      }

      const result: ImportResult = await response.json();

      setImportResult(result);

      if (result.importedCount > 0) {
        await loadTools();
        setSuccessMessage(
          `${result.importedCount} tool${
            result.importedCount === 1 ? "" : "s"
          } imported successfully.`
        );
      }
    } catch (err) {
      console.error(err);

      setImportError(
        err instanceof Error ? err.message : "Unable to import tools."
      );
    } finally {
      setImporting(false);
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
                  onClick={openImportModal}
                  className="h-[40px] rounded-lg border border-[#d4ad18] bg-[#fff8d6] px-5 text-[12px] font-semibold text-[#715c00] hover:bg-[#F5C932]"
                >
                  Import Tools
                </button>

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
            paginatedTools.map((tool) => (
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

          {!loading && filteredTools.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3">
              <p className="text-[11px] text-[#65728a]">
                Showing{" "}
                {(currentPage - 1) * TOOLS_PER_PAGE + 1}–
                {Math.min(
                  currentPage * TOOLS_PER_PAGE,
                  filteredTools.length
                )}{" "}
                of {filteredTools.length} tools
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
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

      {/* IMPORT TOOLS MODAL */}
      {showImportModal && canMaintainTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[980px] overflow-hidden rounded-xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Tool Register
                </p>

                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  Import Tools
                </h2>

                <p className="mt-1 text-[12px] text-[#65728a]">
                  Upload an Excel file, review the tools, then confirm the import.
                </p>
              </div>

              <button
                onClick={closeImportModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
              {importError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {importError}
                </div>
              )}

              {importResult && (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-[12px] font-medium ${
                    importResult.rejectedCount === 0
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  Import complete: {importResult.importedCount} imported,{" "}
                  {importResult.rejectedCount} rejected out of{" "}
                  {importResult.totalRows} rows.
                </div>
              )}

              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-4">
                  <p className="text-[12px] font-semibold text-[#10204a]">
                    Excel format
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#65728a]">
                    Required columns: Asset Number and Tool Name. Optional
                    columns: Category, Serial Number and Store Location. New
                    tools are automatically imported as Good, Available and
                    Active.
                  </p>

                  <button
                    onClick={downloadImportTemplate}
                    className="mt-3 text-[11px] font-semibold text-[#17356d] underline underline-offset-2"
                  >
                    Download Import Template
                  </button>
                </div>

                <label className="flex min-h-[92px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#cfd7e3] bg-white px-6 text-center hover:bg-[#fbfcfe]">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportFile}
                    className="hidden"
                  />

                  <div>
                    <p className="text-[12px] font-semibold text-[#17356d]">
                      Choose Excel File
                    </p>

                    <p className="mt-1 max-w-[220px] truncate text-[10px] text-[#65728a]">
                      {importFileName || "No file selected"}
                    </p>
                  </div>
                </label>
              </div>

              {importRows.length > 0 && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#10204a]">
                        Import Preview
                      </h3>

                      <p className="mt-0.5 text-[11px] text-[#65728a]">
                        {importRows.length} row
                        {importRows.length === 1 ? "" : "s"} detected
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-[#d9e0e9]">
                    <div className="grid grid-cols-[0.6fr_1fr_1.4fr_1.1fr_1.1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.04em] text-[#364866]">
                      <span>Row</span>
                      <span>Asset No.</span>
                      <span>Tool Name</span>
                      <span>Defaults</span>
                      <span>Validation</span>
                    </div>

                    {importRows.map((row, index) => {
                      const issues = getImportRowIssues(row, index);

                      return (
                        <div
                          key={`${row.assetNumber}-${index}`}
                          className="grid grid-cols-[0.6fr_1fr_1.4fr_1.1fr_1.1fr] items-center border-b border-[#edf0f4] px-4 py-3 text-[10px] last:border-b-0"
                        >
                          <div className="text-[#65728a]">{index + 2}</div>

                          <div className="font-semibold text-[#17213c]">
                            {row.assetNumber || "—"}
                          </div>

                          <div className="text-[#33425f]">
                            {row.toolName || "—"}
                          </div>

                          <div className="text-[#536784]">
                            Good / Available
                          </div>

                          <div>
                            {issues.length === 0 ? (
                              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[9px] font-semibold text-green-700">
                                Ready
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {issues.map((issue) => (
                                  <div
                                    key={issue}
                                    className="text-[9px] font-medium text-red-700"
                                  >
                                    {issue}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {importResult && importResult.errors.length > 0 && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-[12px] font-semibold text-red-800">
                    Rejected Rows
                  </p>

                  <div className="mt-3 space-y-2">
                    {importResult.errors.map((item) => (
                      <div
                        key={`${item.rowNumber}-${item.assetNumber ?? ""}`}
                        className="text-[10px] leading-5 text-red-700"
                      >
                        Row {item.rowNumber}
                        {item.assetNumber ? ` (${item.assetNumber})` : ""}:{" "}
                        {item.errors.join("; ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={downloadImportTemplate}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#17356d]"
              >
                Download Template
              </button>

              <div className="flex gap-3">
<button
  onClick={closeImportModal}
  disabled={importing}
  className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
>
  {importResult ? "Done" : "Close"}
</button>

{!importResult && (
  <button
    onClick={handleConfirmImport}
    disabled={importing || importRows.length === 0}
    className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    {importing ? "Importing..." : "Confirm Import"}
  </button>
)}
              </div>
            </div>
          </div>
        </div>
      )}

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