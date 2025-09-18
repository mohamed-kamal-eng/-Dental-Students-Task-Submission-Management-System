// src/pages/doctor/Tasks.tsx
import { useSearchParams, useLocation, useNavigate } from "react-router-dom"; // 👈 add this
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  X,
  Calendar,
  Users,
  FileText,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Star,
  SortAsc,
  SortDesc,
} from "lucide-react";
import {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentSubmissions,   // <- now provided by api.ts
  reviewDoctorSubmission,
} from "../../lib/api";
import SubmissionReviewModal from "../../components/SubmissionReviewModal";

type UiTask = {
  id: number;
  title: string;
  type: string;
  department: string;
  deadline?: string | null; // ISO "YYYY-MM-DD"
  status: "Active" | "Draft" | "Expired" | string;
  submissions: number;
  totalStudents: number;
  description?: string | null;
};

type UiSubmission = {
  id: number;
  studentName: string;
  submittedAt?: string | null; // "YYYY-MM-DD HH:mm"
  status: "Pending Review" | "Graded" | "Needs Revision" | string;
  grade: string | null;
  files: string[];
  filePaths: (string | null)[];
};

const statusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-500/20 text-green-300";
    case "Draft":
      return "bg-yellow-500/20 text-yellow-300";
    case "Expired":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
};

const submissionBadge = (status: string) => {
  switch (status) {
    case "Graded":
      return "bg-green-500/20 text-green-300";
    case "Pending Review":
      return "bg-yellow-500/20 text-yellow-300";
    case "Needs Revision":
      return "bg-orange-500/20 text-orange-300";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const safeNum = (n: any, d = 0) => (Number.isFinite(Number(n)) ? Number(n) : d);

// Build a full URL for file paths without relying on lib/api
const asFileUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000";
  const baseClean = String(base).replace(/\/+$/, "");
  const pathClean = String(path).replace(/^\/+/, "");
  return `${baseClean}/${pathClean}`;
};

export default function Tasks() {
  // ✅ these hooks must be INSIDE a component (fixes the white-page crash)
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

const [form, setForm] = useState({
  title: "",
  description: "",
  type_id: 0,         // <- numbers!
  department_id: 0,   // <- numbers!
  deadline: todayISO(),
  status: "Active",
});



  useEffect(() => {
    if (params.get("create") === "1") {
      openCreate();
      // remove the query so refreshing/back won’t reopen it
      navigate("/doctor/tasks", { replace: true });
    }
  }, [params, navigate]);  
  // Submissions modal
  const [selectedTask, setSelectedTask] = useState<UiTask | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<UiSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Submission review modal
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);

  // Sort for tasks list
  const [sortBy, setSortBy] = useState<"deadline" | "title">("deadline");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ---- load tasks ----
  const loadTasks = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await listAssignments();
      const mapped: UiTask[] = (data ?? []).map((r: any) => {
        // liberal mapping
        const deadline = r.deadline || r.due_date || r.dueDate || null;
        const submissionsCount =
          r.submissions_count ?? r.submissionsCount ?? (r.stats ? r.stats.submissions ?? 0 : 0);
        const totalStudents =
          r.total_students ?? r.totalStudents ?? (r.stats ? r.stats.total_students ?? 0 : 0);

        return {
          id: Number(r.id ?? r.assignment_id ?? r.assignmentId),
          title: String(r.title ?? r.name ?? "Untitled"),
          type: String(r.type ?? r.assignment_type?.name ?? "-"),
          department: String(r.department?.name ?? r.department ?? r.year ?? "-"),
          deadline: deadline ? String(deadline).slice(0, 10) : null,
          status: String(r.status ?? "Active"),
          submissions: safeNum(submissionsCount, 0),
          totalStudents: safeNum(totalStudents, 0),
          description: r.description ?? "",
        };
      });
      setTasks(mapped);
    } catch (e) {
      console.error("[tasks] load failed", e);
      setLoadError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const sortedTasks = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      if (sortBy === "deadline") {
        const A = a.deadline ? new Date(a.deadline).getTime() : 0;
        const B = b.deadline ? new Date(b.deadline).getTime() : 0;
        return sortOrder === "asc" ? A - B : B - A;
      } else {
        const A = a.title.toLowerCase();
        const B = b.title.toLowerCase();
        if (A < B) return sortOrder === "asc" ? -1 : 1;
        if (A > B) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
    });
    return arr;
  }, [tasks, sortBy, sortOrder]);

  // ---- create/edit helpers ----
  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      type: "",
      department: "",
      deadline: todayISO(),
      status: "Active",
    });
    setShowCreateModal(true);
  };

  const openEdit = (t: UiTask) => {
    setEditingId(t.id);
    setForm({
      title: t.title || "",
      description: t.description || "",
      type: t.type || "",
      department: t.department || "",
      deadline: t.deadline || todayISO(),
      status: t.status || "Active",
    });
    setShowCreateModal(true);
  };

const submitForm = async () => {
  setSaveError(null);

  // Basic validation
  if (!form.title.trim()) {
    setSaveError("Title is required.");
    return;
  }
  if (!Number(form.type_id)) {
    setSaveError("Please select a task type.");
    return;
  }
  if (!Number(form.department_id)) {
    setSaveError("Please select a department.");
    return;
  }
  if (!form.deadline) {
    setSaveError("Please choose a deadline.");
    return;
  }

  setIsSaving(true);
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      type_id: Number(form.type_id),
      department_id: Number(form.department_id),
      // backend expects DATETIME (ISO). Send midnight for that date.
      deadline: `${form.deadline}T00:00:00`,
      is_active: form.status === "Active",
    };

    if (editingId) {
      await updateAssignment(editingId, payload);
    } else {
      await createAssignment(payload);
    }

    setShowCreateModal(false);
    await loadTasks();
  } catch (e: any) {
    console.error(
      "[create/update assignment]",
      e?.response?.status,
      e?.response?.config?.url,
      e?.response?.data
    );
    setSaveError(
      e?.response?.data?.detail ||
        (e?.response?.status
          ? `HTTP ${e.response.status} ${e.response.config?.url}`
          : e?.message) ||
        "Failed to save task."
    );
  } finally {
    setIsSaving(false);
  }
};

  const removeTask = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteAssignment(id);
      await loadTasks();
    } catch (e) {
      console.error("[tasks] delete failed", e);
      alert("Failed to delete task.");
    }
  };

  // ---- submissions modal ----
  const openSubmissions = async (task: UiTask) => {
    setSelectedTask(task);
    setShowSubmissions(true);
    setSubsLoading(true);
    setSubmissions([]);
    try {
      // use the alias we added: list by assignment_id
      const { data } = await listAssignmentSubmissions(task.id);
      const mapped: UiSubmission[] = (data ?? []).map((r: any) => {
        // files
        const filesArr: string[] =
          (r.files ? r.files.map((f: any) => String(f.name ?? f.filename ?? f)) : null) ??
          (r.fileName ? [String(r.fileName)] : []) ??
          [];

        const filePaths: (string | null)[] =
          (r.files ? r.files.map((f: any) => f.path ?? f.file_path ?? f.url ?? null) : null) ??
          (r.filePath ? [String(r.filePath)] : []) ??
          [];

        // normalize grade to string
        const gradeStr = typeof r.grade === "number" ? String(r.grade) : (r.grade ?? null);

        // normalize status for chips
        const uiStatus = (() => {
          const s = String(r.status ?? "").toLowerCase();
          if (s === "accepted" || s === "graded") return "Graded";
          if (s === "needsrevision" || s === "rejected") return "Needs Revision";
          return "Pending Review";
        })();

        // IMPORTANT: avoid mixing ?? with ||
        const primaryName =
          r.student_name ??
          [r.student?.first_name, r.student?.last_name].filter(Boolean).join(" ");
        const studentName = primaryName || r.student?.username || "Student";

        return {
          id: Number(r.id ?? r.submission_id ?? r.submissionId),
          studentName,
          submittedAt: r.submittedAt ?? r.submitted_at ?? null,
          status: uiStatus,
          grade: gradeStr,
          files: filesArr,
          filePaths,
        };
      });
      setSubmissions(mapped);
    } catch (e) {
      console.error("[tasks] load submissions failed", e);
      setSubmissions([]);
    } finally {
      setSubsLoading(false);
    }
  };

  const closeSubmissions = () => {
    setShowSubmissions(false);
    setSelectedTask(null);
    setSubmissions([]);
  };

  // ---- submission actions ----
  const downloadFirst = async (sub: UiSubmission) => {
    try {
      // Use the proper API endpoint for downloading submission files
      const { downloadSubmissionFile } = await import("../../lib/api");
      const res = await downloadSubmissionFile(sub.id);
      
      if (!res.data) {
        throw new Error('No file data received');
      }

      // Create blob with proper content type
      const contentType = res.headers?.['content-type'] || res.headers?.['Content-Type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      
      // Get filename from Content-Disposition header if available
      let filename = `submission-${sub.id}`;
      const contentDisposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Force download by creating a temporary link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      a.setAttribute('download', filename);
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated successfully with filename:', filename);
    } catch (err: any) {
      console.error('Download failed:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Failed to download submission: ${errorMsg}`);
    }
  };

  const viewSubmission = (sub: UiSubmission) => {
    // If you have a dedicated view page:
    // window.location.href = `/doctor/submissions?id=${sub.id}`;
    // Or just open the first file:
    downloadFirst(sub);
  };


  // Handle submission review modal save
  const handleReviewSaved = (updatedSubmission: any) => {
    setSubmissions(prev => 
      prev.map(s => 
        s.id === updatedSubmission.id 
          ? { ...s, status: updatedSubmission.status, grade: updatedSubmission.grade?.toString() || null }
          : s
      )
    );
  };

  // Local temp state for each row’s grading inputs
  const [gradeInputs, setGradeInputs] = useState<
    Record<number, { grade: string; feedback: string; showGrading?: boolean }>
  >({});
  const setGradeInput = (
    id: number,
    patch: Partial<{ grade: string; feedback: string; showGrading: boolean }>
  ) =>
    setGradeInputs((prev) => ({
      ...prev,
      [id]: {
        grade: prev[id]?.grade || "",
        feedback: prev[id]?.feedback || "",
        showGrading: prev[id]?.showGrading || false,
        ...patch,
      },
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">
              Tasks Management
            </h1>
            <p className="text-blue-200">Create and manage student assignments</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            className="px-3 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            title="Toggle sort order"
          >
            {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
          </button>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
            data-testid="button-create-task"
          >
            <Plus className="w-5 h-5" />
            {editingId ? "Edit Task" : "Create New Task"}
          </button>
        </div>
      </div>

      {/* Errors / Loading */}
      {loadError && (
        <div className="mb-4 bg-red-500/10 border border-red-400/30 text-red-200 rounded-2xl p-4">
          {loadError}
        </div>
      )}
      {loading && <div className="text-white/80 mb-4">Loading tasks…</div>}

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {sortedTasks.map((task) => {
          const total = Math.max(task.totalStudents, task.submissions);
          const progress = total ? Math.round((task.submissions / total) * 100) : 0;
          const daysLeft =
            task.deadline
              ? Math.ceil(
                  (new Date(task.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

          return (
            <div
              key={task.id}
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/15 transition-all"
              data-testid={`card-task-${task.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white" data-testid={`text-task-title-${task.id}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-gray-300 text-sm" data-testid={`text-task-type-${task.id}`}>
                        {task.type}
                      </span>
                      <span className="text-gray-300 text-sm">•</span>
                      <span className="text-gray-300 text-sm" data-testid={`text-task-department-${task.id}`}>
                        {task.department}
                      </span>
                      <span className="text-gray-300 text-sm">•</span>
                      <span className="text-gray-300 text-sm" data-testid={`text-task-deadline-${task.id}`}>
                        Due: {task.deadline || "-"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusBadge(task.status)}`} data-testid={`text-task-status-${task.id}`}>
                    {task.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                      data-testid={`button-edit-task-${task.id}`}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                      data-testid={`button-delete-task-${task.id}`}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {task.description && (
                <p className="text-gray-300 mb-4" data-testid={`text-task-description-${task.id}`}>
                  {task.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300" data-testid={`text-task-submissions-${task.id}`}>
                      {task.submissions}/{task.totalStudents} submissions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300" data-testid={`text-task-days-left-${task.id}`}>
                      {daysLeft === null ? "-" : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openSubmissions(task)}
                  className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                  data-testid={`button-view-submissions-${task.id}`}
                >
                  View Submissions
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Submission Progress</span>
                  <span className="text-gray-300 text-sm" data-testid={`text-task-progress-${task.id}`}>
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="modal-create-task">
          <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">{editingId ? "Edit Task" : "Create New Task"}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-create-modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Task Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  data-testid="input-task-title"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Enter task description..."
                  rows={4}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  data-testid="textarea-task-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
  <label
    htmlFor="task-type"
    className="block text-sm font-semibold text-white tracking-wide"
  >
    Task Type
  </label>
    <select
      id="task-type"
      value={form.type_id}
      onChange={(e) =>
        setForm((f) => ({ ...f, type_id: Number(e.target.value) }))
      }
      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
                transition-colors placeholder-gray-400"
    >
      <option value={0} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Select task type…</option>
  <option value={1} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Case Study</option>
  <option value={2} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Research Paper</option>
  <option value={3} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Presentation</option>
  <option value={4} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Assessment</option>
  <option value={5} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Practical Work</option>
    </select>
  </div>

                  <div className="space-y-2">
    <label
      htmlFor="department"
      className="block text-sm font-semibold text-white tracking-wide"
    >
      Department
    </label>
    <select
      id="department"
      value={form.department_id}
      onChange={(e) =>
        setForm((f) => ({ ...f, department_id: Number(e.target.value) }))
      }
      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                transition-colors placeholder-gray-400"
    >
      <option value={0} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Select department…</option>
  <option value={1} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Year 1</option>
  <option value={2} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Year 2</option>
  <option value={3} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Year 3</option>
  <option value={4} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Year 4</option>
  <option value={5} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Year 5</option>
    </select>
</div>

              </div>

              <div>
                <label className="block text-white font-medium mb-2">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
                  data-testid="input-task-deadline"
                />
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-400/30 text-red-200 rounded-xl p-3">
                  {saveError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                  data-testid="button-cancel-create"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
  onClick={submitForm}
  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-60"
  data-testid="button-submit-create"
  disabled={isSaving}
>
  {editingId ? (isSaving ? "Saving…" : "Save Changes") : (isSaving ? "Creating…" : "Create Task")}
</button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          data-testid="modal-submissions"
        >
          <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl border border-white/20 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white" data-testid="text-submissions-title">
                  {selectedTask.title}
                </h2>
                <p className="text-blue-200">Student Submissions</p>
              </div>
              <button
                onClick={closeSubmissions}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-submissions-modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {subsLoading && <div className="text-white/80">Loading submissions…</div>}
              {!subsLoading && submissions.length === 0 && (
                <div className="text-white/60">No submissions yet.</div>
              )}

              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white/10 rounded-2xl p-4 border border-white/10"
                    data-testid={`submission-item-${submission.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {submission.studentName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <h4
                            className="text-white font-medium"
                            data-testid={`text-submission-student-${submission.id}`}
                          >
                            {submission.studentName}
                          </h4>
                          <p
                            className="text-gray-400 text-sm"
                            data-testid={`text-submission-time-${submission.id}`}
                          >
                            Submitted:{" "}
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleString()
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${submissionBadge(submission.status)}`}
                          data-testid={`text-submission-status-${submission.id}`}
                        >
                          {submission.status}
                        </span>
                        {submission.grade && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span
                              className="text-white font-medium"
                              data-testid={`text-submission-grade-${submission.id}`}
                            >
                              {submission.grade}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Upload className="w-4 h-4" />
                          <span
                            className="text-sm"
                            data-testid={`text-submission-files-count-${submission.id}`}
                          >
                            {submission.files.length} file(s)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {submission.files.map((file, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs"
                              data-testid={`text-submission-file-${submission.id}-${index}`}
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFirst(submission)}
                          className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                          data-testid={`button-download-submission-${submission.id}`}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {submission.status === "Pending Review" && (
                          <button
                            onClick={() => setReviewingSubmissionId(submission.id)}
                            className="p-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
                            data-testid={`button-grade-submission-${submission.id}`}
                            title="Grade"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => viewSubmission(submission)}
                          className="p-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                          data-testid={`button-view-submission-${submission.id}`}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      {reviewingSubmissionId && (
        <SubmissionReviewModal
          submissionId={reviewingSubmissionId}
          onClose={() => setReviewingSubmissionId(null)}
          onSaved={handleReviewSaved}
        />
      )}
    </div>
  );
}
