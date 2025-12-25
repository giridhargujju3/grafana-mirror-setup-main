import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState, useEffect } from "react";
import { Users, Plus, Search, Shield, Mail, MoreVertical, UserCog, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";

interface ServiceAccount {
  id: string;
  name: string;
  role: string;
  created: string;
  lastUsed?: string;
  expires?: string;
  key?: string;
}

const users = [
  { name: "Admin User", email: "admin@grafana.local", role: "Admin", lastSeen: "Online", avatar: "A" },
  { name: "John Doe", email: "john@example.com", role: "Editor", lastSeen: "2 hours ago", avatar: "J" },
  { name: "Jane Smith", email: "jane@example.com", role: "Viewer", lastSeen: "1 day ago", avatar: "J" },
  { name: "Bob Wilson", email: "bob@example.com", role: "Editor", lastSeen: "3 days ago", avatar: "B" },
];

const teams = [
  { name: "Platform Team", members: 5, email: "platform@grafana.local" },
  { name: "DevOps", members: 8, email: "devops@grafana.local" },
  { name: "SRE", members: 4, email: "sre@grafana.local" },
];

const tabs = ["Users", "Teams", "Service accounts", "Org settings"];

function AdminContent() {
  const [activeTab, setActiveTab] = useState("Users");
  const [searchQuery, setSearchQuery] = useState("");

  // Service Accounts State
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountRole, setNewAccountRole] = useState("Viewer");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchServiceAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/keys`);
      if (res.ok) {
        const data = await res.json();
        setServiceAccounts(data);
      } else {
        toast.error("Failed to load service accounts");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load service accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Service accounts") {
      fetchServiceAccounts();
    }
  }, [activeTab]);

  const handleCreateServiceAccount = async () => {
    if (!newAccountName) {
      toast.error("Name is required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccountName, role: newAccountRole })
      });

      const data = await res.json();
      
      if (res.ok) {
        setGeneratedKey(data.key);
        fetchServiceAccounts();
        toast.success("Service account created");
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch (err) {
      toast.error("Failed to create service account");
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setGeneratedKey(null);
    setNewAccountName("");
    setNewAccountRole("Viewer");
  };

  const handleDeleteServiceAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service account?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/keys/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchServiceAccounts();
        toast.success("Service account deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Failed to delete service account");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">Administration</h1>
        </header>

        <main className="flex-1 overflow-auto">
          {/* Tabs */}
          <div className="border-b border-border px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors border-b-2",
                    activeTab === tab
                      ? "text-primary border-primary"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "Users" && (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <div className="relative w-full max-w-md flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 grafana-input"
                    />
                  </div>
                  <button
                    onClick={() => toast.success("Invite user dialog opened")}
                    className="grafana-btn grafana-btn-primary w-full md:w-auto justify-center"
                  >
                    <Plus size={16} />
                    Invite user
                  </button>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Last seen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <tr key={user.email} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                                {user.avatar}
                              </div>
                              <span className="font-medium text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "grafana-badge",
                              user.role === "Admin" && "bg-grafana-red/20 text-grafana-red",
                              user.role === "Editor" && "bg-grafana-blue/20 text-grafana-blue",
                              user.role === "Viewer" && "bg-muted text-muted-foreground"
                            )}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.lastSeen}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toast.info(`Managing ${user.name}...`)}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "Teams" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">Manage teams and their permissions</p>
                  <button
                    onClick={() => toast.success("Create team dialog opened")}
                    className="grafana-btn grafana-btn-primary"
                  >
                    <Plus size={16} />
                    New team
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <div
                      key={team.name}
                      onClick={() => toast.info(`Opening team: ${team.name}`)}
                      className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-secondary rounded">
                          <Users size={20} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{team.name}</div>
                          <div className="text-sm text-muted-foreground">{team.members} members</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={14} />
                        {team.email}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Service accounts" && (
              <>
                {serviceAccounts.length === 0 && !isLoading ? (
                  <div className="text-center py-12">
                    <UserCog size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No service accounts</h2>
                    <p className="text-muted-foreground mb-4">Service accounts are used for machine-to-machine access</p>
                    <button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="grafana-btn grafana-btn-primary"
                    >
                      <Plus size={16} />
                      Create service account
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-muted-foreground">Manage API keys and service accounts</p>
                      <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="grafana-btn grafana-btn-primary"
                      >
                        <Plus size={16} />
                        Create service account
                      </button>
                    </div>

                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">API Key</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Used</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {serviceAccounts.map((account) => (
                            <tr key={account.id} className="hover:bg-secondary/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{account.name}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "grafana-badge",
                                  account.role === "Admin" && "bg-grafana-red/20 text-grafana-red",
                                  account.role === "Editor" && "bg-grafana-blue/20 text-grafana-blue",
                                  account.role === "Viewer" && "bg-muted text-muted-foreground"
                                )}>
                                  {account.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {account.key && (
                                  <button
                                    onClick={() => copyToClipboard(account.key!)}
                                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                                    title="Copy API Key"
                                  >
                                    <Copy size={16} />
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{new Date(account.created).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {account.lastUsed ? new Date(account.lastUsed).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleDeleteServiceAccount(account.id)}
                                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                  title="Delete Service Account"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "Org settings" && (
              <div className="max-w-xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Organization name</label>
                  <input type="text" defaultValue="Main Org." className="w-full grafana-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Organization ID</label>
                  <input type="text" value="1" disabled className="w-full grafana-input opacity-50" />
                </div>
                <button
                  onClick={() => toast.success("Organization settings saved")}
                  className="grafana-btn grafana-btn-primary"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <SearchModal />

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Service Account</DialogTitle>
            <DialogDescription>
              Create a new service account token for machine-to-machine access.
            </DialogDescription>
          </DialogHeader>
          
          {!generatedKey ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. CI/CD Pipeline" 
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newAccountRole} onValueChange={setNewAccountRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md border border-border">
                <p className="text-sm font-medium mb-2 text-foreground">Service Account Token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background p-2 rounded border border-border font-mono text-sm break-all">
                    {generatedKey}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(generatedKey)}
                    className="p-2 hover:bg-secondary rounded-md"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-yellow-600 dark:text-yellow-400">
                  Make sure to copy this token now. You won't be able to see it again!
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!generatedKey ? (
              <div className="flex justify-end gap-2">
                <button 
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateServiceAccount}
                  className="grafana-btn grafana-btn-primary"
                >
                  Create
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCloseDialog}
                className="grafana-btn grafana-btn-primary w-full"
              >
                Done
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardProvider>
      <AdminContent />
    </DashboardProvider>
  );
}
