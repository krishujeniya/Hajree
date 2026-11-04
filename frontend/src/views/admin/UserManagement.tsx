import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Camera,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Role, User } from "../../types";

export const UserManagement: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("changeme");
  const [createRole, setCreateRole] = useState<Role>("student");
  const [createLoading, setCreateLoading] = useState(false);

  // Face Enrollment Modal
  const [faceModalUser, setFaceModalUser] = useState<User | null>(null);
  const [faceStatus, setFaceStatus] = useState<any>(null);
  const [faceLoading, setFaceLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createUsername.trim() || !createPassword.trim()) {
      toast.error("Please fill in required fields.");
      return;
    }

    setCreateLoading(true);
    try {
      await api.createUser({
        name: createName.trim(),
        username: createUsername.trim(),
        email: createEmail.trim() || undefined,
        password: createPassword.trim(),
        role: createRole,
      });
      toast.success(`User @${createUsername} created.`);
      setCreateModalOpen(false);
      setCreateName("");
      setCreateUsername("");
      setCreateEmail("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Delete account ${user.name} (@${user.username})?`)) {
      return;
    }
    try {
      await api.deleteUser(user.id);
      toast.success(`Deleted user @${user.username}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleOpenFaceModal = async (user: User) => {
    setFaceModalUser(user);
    setFaceLoading(true);
    try {
      const status = await api.getUserFaceStatus(user.id);
      setFaceStatus(status);
    } catch (err: any) {
      toast.error("Failed to load face profile");
    } finally {
      setFaceLoading(false);
    }
  };

  const handleUploadFace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!faceModalUser || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setFaceLoading(true);
    try {
      const res = await api.uploadUserFace(faceModalUser.id, file);
      toast.success(`Face image enrolled (${res.count}/${res.target}).`);
      const status = await api.getUserFaceStatus(faceModalUser.id);
      setFaceStatus(status);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Face processing failed");
    } finally {
      setFaceLoading(false);
    }
  };

  const handleResetFace = async () => {
    if (!faceModalUser) return;
    if (!window.confirm(`Reset face profile for ${faceModalUser.name}? All biometric images will be removed.`)) return;
    setFaceLoading(true);
    try {
      await api.resetUserFace(faceModalUser.id);
      toast.success("Biometric face profile reset successfully.");
      const status = await api.getUserFaceStatus(faceModalUser.id);
      setFaceStatus(status);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset face profile");
    } finally {
      setFaceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Account Directory
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage administrators, faculty members, and student rosters
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Add Account
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or enrollment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-white/40 transition-all"
            />
          </div>

          {/* Role Filters */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {(["all", "student", "teacher", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all apple-button ${
                  roleFilter === r
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {r === "all" ? "All Accounts" : r === "teacher" ? "Faculty" : r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Account</th>
                <th className="px-6 py-3.5">Identifier</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Biometric Profile</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/60 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {u.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm tracking-tight">{u.name}</p>
                          {u.email && (
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      @{u.username}
                    </td>
                    <td className="px-6 py-4">
                      <Badge role={u.role} />
                    </td>
                    <td className="px-6 py-4">
                      {u.role === "student" ? (
                        <button
                          onClick={() => handleOpenFaceModal(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-mono apple-button transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{u.face_image_count ?? 0} / 10 Faces</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-zinc-800 apple-button transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Account"
        description="Register a student, faculty instructor, or administrator."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Account Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["student", "teacher", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateRole(r)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize apple-button ${
                    createRole === r
                      ? "border-white bg-white text-black dark:bg-white dark:text-black font-bold"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {r === "teacher" ? "Faculty" : r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-white/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Username / ID *
            </label>
            <input
              type="text"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="e.g. 240233111099 or jdoe"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-white/40 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="jdoe@example.com"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-white/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Password *
            </label>
            <input
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-white/40"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Face Enrollment Inspector Modal */}
      <Modal
        isOpen={Boolean(faceModalUser)}
        onClose={() => setFaceModalUser(null)}
        title={`Biometric Profile: ${faceModalUser?.name}`}
        description="Vector embeddings indexed for facial attendance recognition."
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Trained Vectors
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Target: 10 facial angles for sub-second recognition
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-foreground">
              {faceStatus?.count ?? 0} / {faceStatus?.target ?? 10} Enrolled
            </span>
          </div>

          {/* Upload Face Photo Action */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
            <Upload className="w-7 h-7 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Add Face Training Photo
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Clear front or slight-angle portrait (JPEG, PNG, WebP)
            </p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs apple-button shadow-sm">
                Select Photo
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUploadFace}
                disabled={faceLoading}
              />
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border">
            {(faceStatus?.count ?? 0) > 0 ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetFace}
                disabled={faceLoading}
              >
                Reset Enrollment
              </Button>
            ) : (
              <div />
            )}
            <Button
              variant="secondary"
              onClick={() => setFaceModalUser(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
