"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5178";

type ToolStatus = {
  statusId: number;
  statusName: string;
  canBookOut: boolean;
  isActive: boolean;
  createdDate: string;
};

type ToolCondition = {
  conditionId: number;
  conditionName: string;
  allowedOnIssue: boolean;
  allowedOnReturn: boolean;
  resultingStatusId: number | null;
  resultingStatusName: string | null;
  isActive: boolean;
  createdDate: string;
};

type Project = {
  projectId: number;
  projectNumber: string;
  projectName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

type Artisan = {
  artisanId: number;
  employeeNumber: string;
  fullName: string;
  department: string | null;
  trade: string | null;
  isActive: boolean;
  createdDate: string;
};

type User = {
  userId: number;
  employeeNumber: string | null;
  displayName: string;
  emailAddress: string;
  role: "Storeman" | "Manager" | "Admin";
  isActive: boolean;
  createdDate: string;
};

type TabName =
  | "Tool Statuses"
  | "Tool Conditions"
  | "Artisans"
  | "Projects"
  | "Users";

export default function AdministrationPage() {
  const [activeTab, setActiveTab] =
    useState<TabName>("Projects");

  const [currentRole, setCurrentRole] =
    useState<"Storeman" | "Manager" | "Admin" | null>(null);

  const [statuses, setStatuses] =
    useState<ToolStatus[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectNumber, setProjectNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectModalError, setProjectModalError] = useState("");
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [artisansLoading, setArtisansLoading] = useState(true);
  const [showArtisanModal, setShowArtisanModal] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);
  const [artisanEmployeeNumber, setArtisanEmployeeNumber] = useState("");
  const [artisanFullName, setArtisanFullName] = useState("");
  const [artisanDepartment, setArtisanDepartment] = useState("");
  const [artisanTrade, setArtisanTrade] = useState("");
  const [artisanModalError, setArtisanModalError] = useState("");
  const [artisanSubmitting, setArtisanSubmitting] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEmployeeNumber, setUserEmployeeNumber] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmailAddress, setUserEmailAddress] = useState("");
  const [userRole, setUserRole] = useState<"Storeman" | "Manager" | "Admin">("Storeman");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [userModalError, setUserModalError] = useState("");
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const [conditions, setConditions] = useState<ToolCondition[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ToolCondition | null>(null);
  const [conditionName, setConditionName] = useState("");
  const [allowedOnIssue, setAllowedOnIssue] = useState(false);
  const [allowedOnReturn, setAllowedOnReturn] = useState(true);
  const [resultingStatusId, setResultingStatusId] = useState("");
  const [conditionModalError, setConditionModalError] = useState("");
  const [conditionSubmitting, setConditionSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingStatus, setEditingStatus] =
    useState<ToolStatus | null>(null);

  const [statusName, setStatusName] =
    useState("");

  const [canBookOut, setCanBookOut] =
    useState(false);

  const [modalError, setModalError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const tabs: TabName[] = [
    "Projects",
    "Artisans",
    ...(currentRole === "Admin" ? (["Users"] as TabName[]) : []),
    "Tool Conditions",
    "Tool Statuses",
  ];

  async function loadProjects() {
    try {
      setProjectsLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/projects/all`, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Unable to load projects.");
      }

      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Could not load project data.");
    } finally {
      setProjectsLoading(false);
    }
  }

  function openAddProjectModal() {
    setEditingProject(null);
    setProjectNumber("");
    setProjectName("");
    setProjectStartDate("");
    setProjectEndDate("");
    setProjectModalError("");
    setSuccessMessage("");
    setShowProjectModal(true);
  }

  function openEditProjectModal(project: Project) {
    setEditingProject(project);
    setProjectNumber(project.projectNumber);
    setProjectName(project.projectName);
    setProjectStartDate(project.startDate ? project.startDate.slice(0, 10) : "");
    setProjectEndDate(project.endDate ? project.endDate.slice(0, 10) : "");
    setProjectModalError("");
    setSuccessMessage("");
    setShowProjectModal(true);
  }

  function closeProjectModal() {
    if (projectSubmitting) return;

    setShowProjectModal(false);
    setEditingProject(null);
    setProjectNumber("");
    setProjectName("");
    setProjectStartDate("");
    setProjectEndDate("");
    setProjectModalError("");
  }

  async function handleSaveProject() {
    setProjectModalError("");
    setSuccessMessage("");

    const trimmedNumber = projectNumber.trim();
    const trimmedName = projectName.trim();

    if (!trimmedNumber) {
      setProjectModalError("Please enter a project number.");
      return;
    }

    if (!trimmedName) {
      setProjectModalError("Please enter a project name.");
      return;
    }

    if (
      projectStartDate &&
      projectEndDate &&
      projectEndDate < projectStartDate
    ) {
      setProjectModalError(
        "End date cannot be earlier than start date."
      );
      return;
    }

    try {
      setProjectSubmitting(true);

      const isEditing = editingProject !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/projects/${editingProject.projectId}`
        : `${API_BASE_URL}/api/projects`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectNumber: trimmedNumber,
          projectName: trimmedName,
          startDate: projectStartDate || null,
          endDate: projectEndDate || null,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          isEditing ? "Unable to update project." : "Unable to create project."
        );
        throw new Error(message);
      }

      await loadProjects();
      setShowProjectModal(false);
      setSuccessMessage(
        isEditing
          ? `${trimmedNumber} was updated successfully.`
          : `${trimmedNumber} was added successfully.`
      );

      setEditingProject(null);
      setProjectNumber("");
      setProjectName("");
      setProjectStartDate("");
      setProjectEndDate("");
    } catch (err) {
      console.error(err);
      setProjectModalError(
        err instanceof Error ? err.message : "Unable to save project."
      );
    } finally {
      setProjectSubmitting(false);
    }
  }

  async function handleProjectStatus(project: Project) {
    setError("");
    setSuccessMessage("");

    const isActive = project.status === "Active";
    const newStatus = isActive ? "Closed" : "Active";
    const actionWord = isActive ? "close" : "reopen";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${project.projectNumber} - ${project.projectName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project.projectId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          `Unable to ${actionWord} project.`
        );
        throw new Error(message);
      }

      await loadProjects();
      setSuccessMessage(
        `${project.projectNumber} was ${
          newStatus === "Active" ? "reopened" : "closed"
        } successfully.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : `Unable to ${actionWord} project.`
      );
    }
  }

  function formatProjectDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  async function loadArtisans() {
    try {
      setArtisansLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/artisans/all`, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Unable to load artisans.");
      }

      const data: Artisan[] = await response.json();
      setArtisans(data);
    } catch (err) {
      console.error(err);
      setError("Could not load artisan data.");
    } finally {
      setArtisansLoading(false);
    }
  }

  function openAddArtisanModal() {
    setEditingArtisan(null);
    setArtisanEmployeeNumber("");
    setArtisanFullName("");
    setArtisanDepartment("");
    setArtisanTrade("");
    setArtisanModalError("");
    setSuccessMessage("");
    setShowArtisanModal(true);
  }

  function openEditArtisanModal(artisan: Artisan) {
    setEditingArtisan(artisan);
    setArtisanEmployeeNumber(artisan.employeeNumber);
    setArtisanFullName(artisan.fullName);
    setArtisanDepartment(artisan.department ?? "");
    setArtisanTrade(artisan.trade ?? "");
    setArtisanModalError("");
    setSuccessMessage("");
    setShowArtisanModal(true);
  }

  function closeArtisanModal() {
    if (artisanSubmitting) return;

    setShowArtisanModal(false);
    setEditingArtisan(null);
    setArtisanEmployeeNumber("");
    setArtisanFullName("");
    setArtisanDepartment("");
    setArtisanTrade("");
    setArtisanModalError("");
  }

  async function handleSaveArtisan() {
    setArtisanModalError("");
    setSuccessMessage("");

    const employeeNumber = artisanEmployeeNumber.trim();
    const fullName = artisanFullName.trim();
    const department = artisanDepartment.trim();
    const trade = artisanTrade.trim();

    if (!employeeNumber) {
      setArtisanModalError("Please enter a staff number.");
      return;
    }

    if (!fullName) {
      setArtisanModalError("Please enter the artisan's full name.");
      return;
    }

    if (!department) {
      setArtisanModalError("Please enter a department.");
      return;
    }

    if (!trade) {
      setArtisanModalError("Please enter a trade.");
      return;
    }

    try {
      setArtisanSubmitting(true);

      const isEditing = editingArtisan !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/artisans/${editingArtisan.artisanId}`
        : `${API_BASE_URL}/api/artisans`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeNumber,
          fullName,
          department,
          trade,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          isEditing ? "Unable to update artisan." : "Unable to create artisan."
        );
        throw new Error(message);
      }

      await loadArtisans();
      setShowArtisanModal(false);
      setSuccessMessage(
        isEditing
          ? `${employeeNumber} was updated successfully.`
          : `${employeeNumber} was added successfully.`
      );

      setEditingArtisan(null);
      setArtisanEmployeeNumber("");
      setArtisanFullName("");
      setArtisanDepartment("");
      setArtisanTrade("");
    } catch (err) {
      console.error(err);
      setArtisanModalError(
        err instanceof Error ? err.message : "Unable to save artisan."
      );
    } finally {
      setArtisanSubmitting(false);
    }
  }

  async function handleArtisanActive(artisan: Artisan) {
    setError("");
    setSuccessMessage("");

    const newValue = !artisan.isActive;
    const actionWord = newValue ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${artisan.employeeNumber} - ${artisan.fullName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/artisans/${artisan.artisanId}/active`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newValue }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          `Unable to ${actionWord} artisan.`
        );
        throw new Error(message);
      }

      await loadArtisans();
      setSuccessMessage(
        `${artisan.employeeNumber} was ${
          newValue ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : `Unable to ${actionWord} artisan.`
      );
    }
  }

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/users/all`, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Unable to load users.");
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Could not load user data.");
    } finally {
      setUsersLoading(false);
    }
  }

  function openAddUserModal() {
    setEditingUser(null);
    setUserEmployeeNumber("");
    setUserDisplayName("");
    setUserEmailAddress("");
    setUserRole("Storeman");
    setUserPassword("");
    setUserConfirmPassword("");
    setUserModalError("");
    setSuccessMessage("");
    setShowUserModal(true);
  }

  function openEditUserModal(user: User) {
    setEditingUser(user);
    setUserEmployeeNumber(user.employeeNumber ?? "");
    setUserDisplayName(user.displayName);
    setUserEmailAddress(user.emailAddress);
    setUserRole(user.role);
    setUserPassword("");
    setUserConfirmPassword("");
    setUserModalError("");
    setSuccessMessage("");
    setShowUserModal(true);
  }

  function closeUserModal() {
    if (userSubmitting) return;

    setShowUserModal(false);
    setEditingUser(null);
    setUserEmployeeNumber("");
    setUserDisplayName("");
    setUserEmailAddress("");
    setUserRole("Storeman");
    setUserPassword("");
    setUserConfirmPassword("");
    setUserModalError("");
  }

  async function handleSaveUser() {
    setUserModalError("");
    setSuccessMessage("");

    const employeeNumber = userEmployeeNumber.trim();
    const displayName = userDisplayName.trim();
    const emailAddress = userEmailAddress.trim();

    if (!employeeNumber) {
      setUserModalError("Please enter a staff number.");
      return;
    }

    if (!displayName) {
      setUserModalError("Please enter the user's name.");
      return;
    }

    if (!emailAddress) {
      setUserModalError("Please enter an email address.");
      return;
    }

    if (!editingUser) {
      if (!userPassword) {
        setUserModalError("Please enter a password.");
        return;
      }

      if (userPassword.length < 8) {
        setUserModalError("Password must be at least 8 characters.");
        return;
      }

      if (userPassword !== userConfirmPassword) {
        setUserModalError("Passwords do not match.");
        return;
      }
    }

    try {
      setUserSubmitting(true);

      const isEditing = editingUser !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/users/${editingUser.userId}`
        : `${API_BASE_URL}/api/users`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeNumber,
          displayName,
          emailAddress,
          role: userRole,
          ...(!isEditing ? { password: userPassword } : {}),
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          isEditing ? "Unable to update user." : "Unable to create user."
        );
        throw new Error(message);
      }

      await loadUsers();
      setShowUserModal(false);
      setSuccessMessage(
        isEditing
          ? `${employeeNumber} was updated successfully.`
          : `${employeeNumber} was added successfully.`
      );

      setEditingUser(null);
      setUserEmployeeNumber("");
      setUserDisplayName("");
      setUserEmailAddress("");
      setUserRole("Storeman");
    } catch (err) {
      console.error(err);
      setUserModalError(
        err instanceof Error ? err.message : "Unable to save user."
      );
    } finally {
      setUserSubmitting(false);
    }
  }

  async function handleUserActive(user: User) {
    setError("");
    setSuccessMessage("");

    const newValue = !user.isActive;
    const actionWord = newValue ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${user.employeeNumber ?? ""} - ${user.displayName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${user.userId}/active`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newValue }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          `Unable to ${actionWord} user.`
        );
        throw new Error(message);
      }

      await loadUsers();
      setSuccessMessage(
        `${user.employeeNumber ?? user.displayName} was ${
          newValue ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : `Unable to ${actionWord} user.`
      );
    }
  }

  function openResetPasswordModal(user: User) {
    setResetPasswordUser(user);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetPasswordError("");
    setSuccessMessage("");
  }

  function closeResetPasswordModal() {
    if (resetPasswordSubmitting) return;

    setResetPasswordUser(null);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetPasswordError("");
  }

  async function handleResetPassword() {
    if (!resetPasswordUser) return;

    setResetPasswordError("");
    setSuccessMessage("");

    if (!resetPassword) {
      setResetPasswordError("Please enter a new password.");
      return;
    }

    if (resetPassword.length < 8) {
      setResetPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetPasswordError("Passwords do not match.");
      return;
    }

    try {
      setResetPasswordSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/users/${resetPasswordUser.userId}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password: resetPassword }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to reset password."
        );
        throw new Error(message);
      }

      const displayName = resetPasswordUser.displayName;
      closeResetPasswordModal();
      setResetPasswordUser(null);
      setResetPassword("");
      setResetConfirmPassword("");
      setResetPasswordError("");
      setSuccessMessage(`Password for ${displayName} was reset successfully.`);
    } catch (err) {
      console.error(err);
      setResetPasswordError(
        err instanceof Error ? err.message : "Unable to reset password."
      );
    } finally {
      setResetPasswordSubmitting(false);
    }
  }

  async function loadConditions() {
    try {
      setConditionsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/masterdata/conditions/all`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load tool conditions.");
      const data: ToolCondition[] = await response.json();
      setConditions(data);
    } catch (err) {
      console.error(err);
      setError("Could not load tool condition data.");
    } finally {
      setConditionsLoading(false);
    }
  }

  function openAddConditionModal() {
    setEditingCondition(null);
    setConditionName("");
    setAllowedOnIssue(false);
    setAllowedOnReturn(true);
    setResultingStatusId("");
    setConditionModalError("");
    setSuccessMessage("");
    setShowConditionModal(true);
  }

  function openEditConditionModal(condition: ToolCondition) {
    setEditingCondition(condition);
    setConditionName(condition.conditionName);
    setAllowedOnIssue(condition.allowedOnIssue);
    setAllowedOnReturn(condition.allowedOnReturn);
    setResultingStatusId(condition.resultingStatusId?.toString() ?? "");
    setConditionModalError("");
    setSuccessMessage("");
    setShowConditionModal(true);
  }

  function closeConditionModal() {
    if (conditionSubmitting) return;
    setShowConditionModal(false);
    setEditingCondition(null);
    setConditionModalError("");
  }

  async function handleSaveCondition() {
    setConditionModalError("");
    setSuccessMessage("");
    const trimmedName = conditionName.trim();
    if (!trimmedName) {
      setConditionModalError("Please enter a condition name.");
      return;
    }
    if (!resultingStatusId) {
      setConditionModalError("Please select the resulting tool status.");
      return;
    }
    if (!allowedOnIssue && !allowedOnReturn) {
      setConditionModalError("The condition must be allowed on issue, return, or both.");
      return;
    }
    try {
      setConditionSubmitting(true);
      const isEditing = editingCondition !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/masterdata/conditions/${editingCondition.conditionId}`
        : `${API_BASE_URL}/api/masterdata/conditions`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionName: trimmedName,
          allowedOnIssue,
          allowedOnReturn,
          resultingStatusId: Number(resultingStatusId),
        }),
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, isEditing ? "Unable to update condition." : "Unable to create condition.");
        throw new Error(message);
      }
      await loadConditions();
      setShowConditionModal(false);
      setSuccessMessage(isEditing ? `${trimmedName} was updated successfully.` : `${trimmedName} was added successfully.`);
      setEditingCondition(null);
    } catch (err) {
      console.error(err);
      setConditionModalError(err instanceof Error ? err.message : "Unable to save condition.");
    } finally {
      setConditionSubmitting(false);
    }
  }

  async function handleConditionActive(condition: ToolCondition) {
    setError("");
    setSuccessMessage("");
    const newValue = !condition.isActive;
    const actionWord = newValue ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${actionWord} "${condition.conditionName}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/masterdata/conditions/${condition.conditionId}/active`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newValue }),
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, `Unable to ${actionWord} condition.`);
        throw new Error(message);
      }
      await loadConditions();
      setSuccessMessage(`${condition.conditionName} was ${newValue ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : `Unable to ${actionWord} condition.`);
    }
  }

  async function loadStatuses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/masterdata/statuses/all`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load tool statuses."
        );
      }

      const data: ToolStatus[] =
        await response.json();

      setStatuses(data);
    } catch (err) {
      console.error(err);

      setError(
        "Could not load administration data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadCurrentRole() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load authenticated user.");
        }

        const authenticatedUser: User = await response.json();
        setCurrentRole(authenticatedUser.role);
      } catch (err) {
        console.error(err);
        setCurrentRole(null);
      }
    }

    loadCurrentRole();
  }, []);

  useEffect(() => {
    if (currentRole !== "Admin" && activeTab === "Users") {
      setActiveTab("Projects");
    }
  }, [currentRole, activeTab]);

  useEffect(() => {
    loadProjects();
    loadArtisans();

    if (currentRole === "Admin") {
      loadUsers();
    }

    loadStatuses();
    loadConditions();
  }, [currentRole]);

  function openAddModal() {
    setEditingStatus(null);
    setStatusName("");
    setCanBookOut(false);
    setModalError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function openEditModal(status: ToolStatus) {
    setEditingStatus(status);
    setStatusName(status.statusName);
    setCanBookOut(status.canBookOut);
    setModalError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setEditingStatus(null);
    setStatusName("");
    setCanBookOut(false);
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

  async function handleSaveStatus() {
    setModalError("");
    setSuccessMessage("");

    const trimmedName = statusName.trim();

    if (!trimmedName) {
      setModalError(
        "Please enter a status name."
      );
      return;
    }

    try {
      setSubmitting(true);

      const isEditing =
        editingStatus !== null;

      const url = isEditing
        ? `${API_BASE_URL}/api/masterdata/statuses/${editingStatus.statusId}`
        : `${API_BASE_URL}/api/masterdata/statuses`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          statusName: trimmedName,
          canBookOut,
        }),
      });

      if (!response.ok) {
        const message =
          await getErrorMessage(
            response,
            isEditing
              ? "Unable to update status."
              : "Unable to create status."
          );

        throw new Error(message);
      }

      await loadStatuses();

      setShowModal(false);

      setSuccessMessage(
        isEditing
          ? `${trimmedName} was updated successfully.`
          : `${trimmedName} was added successfully.`
      );

      setEditingStatus(null);
      setStatusName("");
      setCanBookOut(false);
    } catch (err) {
      console.error(err);

      setModalError(
        err instanceof Error
          ? err.message
          : "Unable to save status."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(
    status: ToolStatus
  ) {
    setError("");
    setSuccessMessage("");

    const newValue = !status.isActive;

    const actionWord = newValue
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${status.statusName}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/masterdata/statuses/${status.statusId}/active`,
        {
          method: "PATCH",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive: newValue,
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getErrorMessage(
            response,
            `Unable to ${actionWord} status.`
          );

        throw new Error(message);
      }

      await loadStatuses();

      setSuccessMessage(
        `${status.statusName} was ${
          newValue
            ? "activated"
            : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${actionWord} status.`
      );
    }
  }

  return (
    <>
      <div className="px-8 py-7">
        {/* PAGE HEADER */}
        <div className="mb-7">

          <h1 className="text-[34px] font-bold leading-tight text-[#10204a]">
            Administration
          </h1>

          <p className="mt-1.5 text-[14px] text-[#536784]">
            Manage Tool Store master data and
            system configuration.
          </p>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-medium text-green-700">
            <span>
              {successMessage}
            </span>

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

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* ADMIN CARD */}
        <section className="overflow-hidden rounded-lg border border-[#d9e0e9] bg-white">
          {/* TABS */}
          <div className="border-b border-[#d9e0e9] bg-[#fbfcfe] px-5">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => {
                const isActive =
                  activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(tab)
                    }
                    className={`relative h-[54px] text-[12px] font-semibold transition ${
                      isActive
                        ? "text-[#10204a]"
                        : "text-[#65728a] hover:text-[#10204a]"
                    }`}
                  >
                    {tab}

                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-[#F5C932]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PROJECTS TAB */}
          {activeTab === "Projects" && (
            <>
              <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#101e40]">
                    Projects
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#65728a]">
                    Manage projects available for tool allocation.
                  </p>
                </div>

                <button
                  onClick={openAddProjectModal}
                  className="h-[38px] rounded-lg bg-[#08285a] px-4 text-[11px] font-semibold text-white hover:bg-[#0d336d]"
                >
                  + Add Project
                </button>
              </div>

              <div className="grid grid-cols-[0.9fr_1.5fr_0.8fr_0.9fr_0.9fr_1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
                <span>Project Number</span>
                <span>Project Name</span>
                <span>Status</span>
                <span>Start Date</span>
                <span>End Date</span>
                <span>Action</span>
              </div>

              {projectsLoading && (
                <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
                  Loading projects...
                </div>
              )}

              {!projectsLoading && projects.length === 0 && (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <p className="text-[14px] font-semibold text-[#10204a]">
                    No projects found.
                  </p>
                  <p className="mt-1 text-[12px] text-[#65728a]">
                    Add a project to get started.
                  </p>
                </div>
              )}

              {!projectsLoading &&
                projects.map((project) => {
                  const isActive = project.status === "Active";

                  return (
                    <div
                      key={project.projectId}
                      className="grid grid-cols-[0.9fr_1.5fr_0.8fr_0.9fr_0.9fr_1fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
                    >
                      <div className="font-semibold text-[#17213c]">
                        {project.projectNumber}
                      </div>
                      <div className="text-[#33425f]">
                        {project.projectName}
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <div className="text-[#536784]">
                        {formatProjectDate(project.startDate)}
                      </div>
                      <div className="text-[#536784]">
                        {formatProjectDate(project.endDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditProjectModal(project)}
                          className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleProjectStatus(project)}
                          className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${
                            isActive
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {isActive ? "Close" : "Reopen"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </>
          )}

          {/* ARTISANS TAB */}
          {activeTab === "Artisans" && (
            <>
              <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#101e40]">
                    Artisans
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#65728a]">
                    Manage artisans available for tool allocation.
                  </p>
                </div>

                <button
                  onClick={openAddArtisanModal}
                  className="h-[38px] rounded-lg bg-[#08285a] px-4 text-[11px] font-semibold text-white hover:bg-[#0d336d]"
                >
                  + Add Artisan
                </button>
              </div>

              <div className="grid grid-cols-[0.9fr_1.4fr_1fr_1fr_0.8fr_1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
                <span>Staff Number</span>
                <span>Full Name</span>
                <span>Department</span>
                <span>Trade</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {artisansLoading && (
                <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
                  Loading artisans...
                </div>
              )}

              {!artisansLoading && artisans.length === 0 && (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <p className="text-[14px] font-semibold text-[#10204a]">
                    No artisans found.
                  </p>
                  <p className="mt-1 text-[12px] text-[#65728a]">
                    Add an artisan to get started.
                  </p>
                </div>
              )}

              {!artisansLoading &&
                artisans.map((artisan) => (
                  <div
                    key={artisan.artisanId}
                    className="grid grid-cols-[0.9fr_1.4fr_1fr_1fr_0.8fr_1fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
                  >
                    <div className="font-semibold text-[#17213c]">
                      {artisan.employeeNumber}
                    </div>
                    <div className="text-[#33425f]">{artisan.fullName}</div>
                    <div className="text-[#536784]">
                      {artisan.department || "—"}
                    </div>
                    <div className="text-[#536784]">
                      {artisan.trade || "—"}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          artisan.isActive
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {artisan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditArtisanModal(artisan)}
                        className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArtisanActive(artisan)}
                        className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${
                          artisan.isActive
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {artisan.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}

          {/* USERS TAB */}
          {currentRole === "Admin" && activeTab === "Users" && (
            <>
              <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#101e40]">
                    Users
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#65728a]">
                    Manage Tool Store users, roles and account status.
                  </p>
                </div>

                <button
                  onClick={openAddUserModal}
                  className="h-[38px] rounded-lg bg-[#08285a] px-4 text-[11px] font-semibold text-white hover:bg-[#0d336d]"
                >
                  + Add User
                </button>
              </div>

              <div className="grid grid-cols-[0.85fr_1.25fr_1.6fr_0.8fr_0.8fr_1.5fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
                <span>Staff Number</span>
                <span>Name</span>
                <span>Email Address</span>
                <span>Role</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {usersLoading && (
                <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
                  Loading users...
                </div>
              )}

              {!usersLoading && users.length === 0 && (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <p className="text-[14px] font-semibold text-[#10204a]">
                    No users found.
                  </p>
                  <p className="mt-1 text-[12px] text-[#65728a]">
                    Add a user to get started.
                  </p>
                </div>
              )}

              {!usersLoading &&
                users.map((user) => (
                  <div
                    key={user.userId}
                    className="grid grid-cols-[0.85fr_1.25fr_1.6fr_0.8fr_0.8fr_1.5fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
                  >
                    <div className="font-semibold text-[#17213c]">
                      {user.employeeNumber || "—"}
                    </div>
                    <div className="text-[#33425f]">{user.displayName}</div>
                    <div className="text-[#536784]">{user.emailAddress}</div>
                    <div>
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          user.isActive
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleUserActive(user)}
                        className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${
                          user.isActive
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}

          {/* TOOL CONDITIONS TAB */}
          {activeTab === "Tool Conditions" && (
            <>
              <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#101e40]">Tool Conditions</h2>
                  <p className="mt-0.5 text-[12px] text-[#65728a]">Map tool conditions to the status that should result when that condition is applied.</p>
                </div>
                <button onClick={openAddConditionModal} className="h-[38px] rounded-lg bg-[#08285a] px-4 text-[11px] font-semibold text-white hover:bg-[#0d336d]">+ Add Condition</button>
              </div>
              <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr_0.8fr_1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
                <span>Condition</span><span>On Issue</span><span>On Return</span><span>Resulting Status</span><span>State</span><span>Action</span>
              </div>
              {conditionsLoading && <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">Loading conditions...</div>}
              {!conditionsLoading && conditions.length === 0 && <div className="flex min-h-[260px] flex-col items-center justify-center text-center"><p className="text-[14px] font-semibold text-[#10204a]">No conditions found.</p><p className="mt-1 text-[12px] text-[#65728a]">Add a condition to get started.</p></div>}
              {!conditionsLoading && conditions.map((condition) => (
                <div key={condition.conditionId} className="grid grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr_0.8fr_1fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]">
                  <div className="font-semibold text-[#17213c]">{condition.conditionName}</div>
                  <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${condition.allowedOnIssue ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{condition.allowedOnIssue ? "Yes" : "No"}</span></div>
                  <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${condition.allowedOnReturn ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{condition.allowedOnReturn ? "Yes" : "No"}</span></div>
                  <div><span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{condition.resultingStatusName || "—"}</span></div>
                  <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${condition.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{condition.isActive ? "Active" : "Inactive"}</span></div>
                  <div className="flex items-center gap-2"><button onClick={() => openEditConditionModal(condition)} className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]">Edit</button><button onClick={() => handleConditionActive(condition)} className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${condition.isActive ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}>{condition.isActive ? "Deactivate" : "Activate"}</button></div>
                </div>
              ))}
            </>
          )}

          {/* TOOL STATUSES TAB */}
          {activeTab ===
            "Tool Statuses" && (
            <>
              {/* TOOLBAR */}
              <div className="flex items-center justify-between border-b border-[#d9e0e9] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#101e40]">
                    Tool Statuses
                  </h2>

                  <p className="mt-0.5 text-[12px] text-[#65728a]">
                    Control tool availability
                    and booking behaviour.
                  </p>
                </div>

                <button
                  onClick={openAddModal}
                  className="h-[38px] rounded-lg bg-[#08285a] px-4 text-[11px] font-semibold text-white hover:bg-[#0d336d]"
                >
                  + Add Status
                </button>
              </div>

              {/* TABLE HEADER */}
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-[#d9e0e9] bg-[#fbfcfe] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.05em] text-[#364866]">
                <span>
                  Status
                </span>

                <span>
                  Can Book Out
                </span>

                <span>
                  State
                </span>

                <span>
                  Action
                </span>
              </div>

              {/* LOADING */}
              {loading && (
                <div className="flex min-h-[260px] items-center justify-center text-[13px] text-[#65728a]">
                  Loading statuses...
                </div>
              )}

              {/* EMPTY */}
              {!loading &&
                statuses.length === 0 && (
                  <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                    <div className="mb-3 text-4xl text-[#c1cad7]">
                      ⚙
                    </div>

                    <p className="text-[14px] font-semibold text-[#10204a]">
                      No statuses found.
                    </p>

                    <p className="mt-1 text-[12px] text-[#65728a]">
                      Add a status to get started.
                    </p>
                  </div>
                )}

              {/* ROWS */}
              {!loading &&
                statuses.map(
                  (status) => (
                    <div
                      key={
                        status.statusId
                      }
                      className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-[#edf0f4] px-5 py-3 text-[11px] last:border-b-0 hover:bg-[#fbfcfe]"
                    >
                      <div>
                        <div className="font-semibold text-[#17213c]">
                          {
                            status.statusName
                          }
                        </div>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            status.canBookOut
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status.canBookOut
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            status.isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            openEditModal(
                              status
                            )
                          }
                          className="h-[30px] rounded-md border border-[#cfd7e3] bg-white px-3 text-[10px] font-semibold text-[#17356d] hover:bg-[#f5f7fa]"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleToggleActive(
                              status
                            )
                          }
                          className={`h-[30px] rounded-md border px-3 text-[10px] font-semibold ${
                            status.isActive
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {status.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </div>
                  )
                )}
            </>
          )}

          {/* PLACEHOLDER TABS */}
          {activeTab !== "Tool Statuses" &&
            activeTab !== "Tool Conditions" &&
            activeTab !== "Projects" &&
            activeTab !== "Artisans" &&
            activeTab !== "Users" && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-3 text-4xl text-[#c1cad7]">
                ⚙
              </div>

              <h3 className="text-[15px] font-bold text-[#10204a]">
                {activeTab}
              </h3>

              <p className="mt-1 max-w-[360px] text-[12px] text-[#65728a]">
                This administration
                section will be added
                next.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ADD / EDIT PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Administration
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  {editingProject ? "Edit Project" : "Add Project"}
                </h2>
                <p className="mt-1 text-[12px] text-[#65728a]">
                  Maintain projects used when allocating tools.
                </p>
              </div>

              <button
                onClick={closeProjectModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {projectModalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {projectModalError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Project Number *
                </label>
                <input
                  value={projectNumber}
                  onChange={(event) => setProjectNumber(event.target.value)}
                  placeholder="e.g. PRJ003"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Project Name *
                </label>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. Vessel DEF"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(event) =>
                      setProjectStartDate(event.target.value)
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={projectEndDate}
                    min={projectStartDate || undefined}
                    onChange={(event) =>
                      setProjectEndDate(event.target.value)
                    }
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[11px] leading-5 text-[#65728a]">
                New projects are created as{" "}
                <span className="font-semibold text-[#33425f]">Active</span>.
                Use the Projects table to close or reopen a project.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={closeProjectModal}
                disabled={projectSubmitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveProject}
                disabled={projectSubmitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {projectSubmitting
                  ? "Saving..."
                  : editingProject
                    ? "Save Changes"
                    : "Add Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ARTISAN MODAL */}
      {showArtisanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Administration
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  {editingArtisan ? "Edit Artisan" : "Add Artisan"}
                </h2>
                <p className="mt-1 text-[12px] text-[#65728a]">
                  Maintain artisans who can be allocated tools.
                </p>
              </div>

              <button
                onClick={closeArtisanModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {artisanModalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {artisanModalError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Staff Number *
                </label>
                <input
                  value={artisanEmployeeNumber}
                  onChange={(event) =>
                    setArtisanEmployeeNumber(event.target.value)
                  }
                  placeholder="e.g. EMP004"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Full Name *
                </label>
                <input
                  value={artisanFullName}
                  onChange={(event) => setArtisanFullName(event.target.value)}
                  placeholder="e.g. David Shilongo"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Department *
                  </label>
                  <input
                    value={artisanDepartment}
                    onChange={(event) =>
                      setArtisanDepartment(event.target.value)
                    }
                    placeholder="e.g. Production"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                    Trade *
                  </label>
                  <input
                    value={artisanTrade}
                    onChange={(event) => setArtisanTrade(event.target.value)}
                    placeholder="e.g. Welder"
                    className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[11px] leading-5 text-[#65728a]">
                New artisans are created as{" "}
                <span className="font-semibold text-[#33425f]">Active</span>.
                Use the Artisans table to deactivate or reactivate an artisan.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={closeArtisanModal}
                disabled={artisanSubmitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveArtisan}
                disabled={artisanSubmitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {artisanSubmitting
                  ? "Saving..."
                  : editingArtisan
                    ? "Save Changes"
                    : "Add Artisan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {currentRole === "Admin" && showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Administration
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  {editingUser ? "Edit User" : "Add User"}
                </h2>
                <p className="mt-1 text-[12px] text-[#65728a]">
                  Maintain Tool Store users and assign their access role.
                </p>
              </div>

              <button
                onClick={closeUserModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {userModalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {userModalError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Staff Number *
                </label>
                <input
                  value={userEmployeeNumber}
                  onChange={(event) =>
                    setUserEmployeeNumber(event.target.value)
                  }
                  placeholder="e.g. EMP005"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Name *
                </label>
                <input
                  value={userDisplayName}
                  onChange={(event) => setUserDisplayName(event.target.value)}
                  placeholder="e.g. David Shilongo"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userEmailAddress}
                  onChange={(event) => setUserEmailAddress(event.target.value)}
                  placeholder="e.g. name@namdock.com"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Role *
                </label>
                <select
                  value={userRole}
                  onChange={(event) =>
                    setUserRole(
                      event.target.value as "Storeman" | "Manager" | "Admin"
                    )
                  }
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"
                >
                  <option value="Storeman">Storeman</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {!editingUser && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[#33425f]">
                      Password *
                    </span>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      autoComplete="new-password"
                      className="h-[40px] w-full rounded-lg border border-[#cfd7e3] px-3 text-[12px] text-[#17213c] outline-none focus:border-[#08285a]"
                      placeholder="Minimum 8 characters"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[#33425f]">
                      Confirm Password *
                    </span>
                    <input
                      type="password"
                      value={userConfirmPassword}
                      onChange={(e) => setUserConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="h-[40px] w-full rounded-lg border border-[#cfd7e3] px-3 text-[12px] text-[#17213c] outline-none focus:border-[#08285a]"
                      placeholder="Re-enter password"
                    />
                  </label>
                </div>
              )}

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[11px] leading-5 text-[#65728a]">
                <span className="font-semibold text-[#33425f]">Storeman</span>{" "}
                has access to Tool Transactions and Tool Register.{" "}
                <span className="font-semibold text-[#33425f]">Manager</span>{" "}
                has operational administration access.{" "}
                <span className="font-semibold text-[#33425f]">Admin</span>{" "}
                has full access including Users & Roles.
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={closeUserModal}
                disabled={userSubmitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUser}
                disabled={userSubmitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {userSubmitting
                  ? "Saving..."
                  : editingUser
                    ? "Save Changes"
                    : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET USER PASSWORD MODAL */}
      {currentRole === "Admin" && resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[480px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Administration
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  Reset Password
                </h2>
                <p className="mt-1 text-[12px] text-[#65728a]">
                  Set a new password for {resetPasswordUser.displayName}.
                </p>
              </div>
              <button
                onClick={closeResetPasswordModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {resetPasswordError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {resetPasswordError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  New Password *
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(event) => setResetConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] px-4 py-3 text-[11px] leading-5 text-[#65728a]">
                The new password must contain at least 8 characters.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={closeResetPasswordModal}
                disabled={resetPasswordSubmitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordSubmitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetPasswordSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT TOOL CONDITION MODAL */}
      {showConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[540px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">Administration</p><h2 className="mt-1 text-[20px] font-bold text-[#10204a]">{editingCondition ? "Edit Tool Condition" : "Add Tool Condition"}</h2><p className="mt-1 text-[12px] text-[#65728a]">Define when a condition can be used and the tool status it produces.</p></div>
              <button onClick={closeConditionModal} className="text-[24px] leading-none text-[#65728a]">×</button>
            </div>
            <div className="space-y-5 px-6 py-5">
              {conditionModalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">{conditionModalError}</div>}
              <div><label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">Condition Name *</label><input value={conditionName} onChange={(e) => setConditionName(e.target.value)} placeholder="e.g. Damaged" className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]" /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] p-4"><input type="checkbox" checked={allowedOnIssue} onChange={(e) => setAllowedOnIssue(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#213767]" /><div><p className="text-[12px] font-semibold text-[#263552]">Allowed on Issue</p><p className="mt-1 text-[11px] leading-5 text-[#65728a]">Can be selected when booking a tool out.</p></div></label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] p-4"><input type="checkbox" checked={allowedOnReturn} onChange={(e) => setAllowedOnReturn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#213767]" /><div><p className="text-[12px] font-semibold text-[#263552]">Allowed on Return</p><p className="mt-1 text-[11px] leading-5 text-[#65728a]">Can be selected when returning a tool.</p></div></label>
              </div>
              <div><label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">Resulting Tool Status *</label><select value={resultingStatusId} onChange={(e) => setResultingStatusId(e.target.value)} className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#33425f] outline-none focus:border-[#213767]"><option value="">Select resulting status</option>{statuses.filter((status) => status.isActive || status.statusId === editingCondition?.resultingStatusId).map((status) => <option key={status.statusId} value={status.statusId}>{status.statusName}</option>)}</select><p className="mt-1.5 text-[11px] text-[#65728a]">When this condition is applied, the tool will move to this status.</p></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4"><button onClick={closeConditionModal} disabled={conditionSubmitting} className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]">Cancel</button><button onClick={handleSaveCondition} disabled={conditionSubmitting} className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{conditionSubmitting ? "Saving..." : editingCondition ? "Save Changes" : "Add Condition"}</button></div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STATUS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[500px] overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#d9e0e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#65728a]">
                  Administration
                </p>

                <h2 className="mt-1 text-[20px] font-bold text-[#10204a]">
                  {editingStatus
                    ? "Edit Tool Status"
                    : "Add Tool Status"}
                </h2>

                <p className="mt-1 text-[12px] text-[#65728a]">
                  Configure how this
                  status behaves in the
                  Tool Store.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-[24px] leading-none text-[#65728a]"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-5 px-6 py-5">
              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {modalError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#33425f]">
                  Status Name *
                </label>

                <input
                  value={statusName}
                  onChange={(event) =>
                    setStatusName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Under Repair"
                  className="h-[42px] w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] outline-none placeholder:text-[#8b97aa] focus:border-[#213767]"
                />
              </div>

              <div className="rounded-lg border border-[#d9e0e9] bg-[#fbfcfe] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={canBookOut}
                    onChange={(event) =>
                      setCanBookOut(
                        event.target.checked
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-[#213767]"
                  />

                  <div>
                    <p className="text-[12px] font-semibold text-[#263552]">
                      Allow Book Out
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#65728a]">
                      Tools with this
                      status can be issued
                      to an artisan.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 border-t border-[#d9e0e9] bg-[#fbfcfe] px-6 py-4">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="h-[40px] rounded-lg border border-[#cfd7e3] bg-white px-5 text-[12px] font-semibold text-[#33425f]"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleSaveStatus
                }
                disabled={submitting}
                className="h-[40px] rounded-lg bg-[#08285a] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : editingStatus
                    ? "Save Changes"
                    : "Add Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}