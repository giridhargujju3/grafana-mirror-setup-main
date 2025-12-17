import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Users, Plus, Search, Shield, Mail, MoreVertical, UserCog } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          <div className="p-6">
            {activeTab === "Users" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative max-w-md flex-1">
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
                    className="grafana-btn grafana-btn-primary"
                  >
                    <Plus size={16} />
                    Invite user
                  </button>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
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
              <div className="text-center py-12">
                <UserCog size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-lg font-medium text-foreground mb-2">No service accounts</h2>
                <p className="text-muted-foreground mb-4">Service accounts are used for machine-to-machine access</p>
                <button
                  onClick={() => toast.success("Create service account dialog opened")}
                  className="grafana-btn grafana-btn-primary"
                >
                  <Plus size={16} />
                  Create service account
                </button>
              </div>
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
