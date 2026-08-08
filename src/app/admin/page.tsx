import Link from "next/link";

import { Avatar } from "@nextui-org/react";

import { AdminPrivacyToggles } from "@/components/admin/admin-privacy-toggles";
import {
  Badge,
  EmptyRow,
  Panel,
  StatTile,
  td,
  th,
} from "@/components/admin/admin-ui";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { AdminService } from "@/services/admin-service";
import {
  formatDate,
  formatDateTime,
  formatRelative,
} from "@/utils/format-date";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

// Admin views must never be served from a cache - they are all live state.
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [overview, users, recentLogins, auditLog, games] = await Promise.all([
    AdminService.getOverview(),
    AdminService.listUsers(),
    AdminService.getRecentLogins(15),
    AdminService.getAuditLog(25),
    AdminService.getGameBreakdown(),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Users" value={overview.totalUsers} />
        <StatTile
          label="Active 7d"
          value={overview.activeUsers7d}
          hint={`${overview.logins7d} logins`}
        />
        <StatTile
          label="New 7d"
          value={overview.newUsers7d}
          hint={`${overview.neverLoggedIn} never logged in`}
        />
        <StatTile
          label="Scores"
          value={overview.totalScores}
          hint={`${overview.scoresToday} today · ${overview.scores7d} this week`}
        />
        <StatTile
          label="Interactions"
          value={overview.totalComments + overview.totalReactions}
          hint={`${overview.totalComments} comments · ${overview.totalReactions} reactions`}
        />
        <StatTile
          label="Friend pairs"
          value={overview.friendPairs}
          hint={`${overview.pendingRequests} pending`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Admins" value={overview.adminUsers} />
        <StatTile
          label="Private scores"
          value={overview.privateScoreUsers}
          hint="friends-only feed"
        />
        <StatTile
          label="Private activity"
          value={overview.privateActivityUsers}
          hint="friends-only comments"
        />
        <StatTile label="Active sessions" value={overview.activeSessions} />
      </div>

      <Panel
        title="Users"
        description="Sorted by most recent login. Counts are all-time. Privacy switches take effect immediately and are written to the audit log."
      >
        <table className="w-full min-w-[64rem]">
          <thead className="bg-default-100">
            <tr>
              <th className={th}>User</th>
              <th className={th}>Privacy</th>
              <th className={th}>Joined</th>
              <th className={th}>Last login</th>
              <th className={th}>Logins</th>
              <th className={th}>Sessions</th>
              <th className={th}>Scores</th>
              <th className={th}>Last score</th>
              <th className={th}>Friends</th>
              <th className={th}>Comments</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default-200">
            {users.length === 0 && (
              <EmptyRow colSpan={11}>No users yet</EmptyRow>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-default-50">
                <td className={td}>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-2"
                  >
                    <Avatar
                      src={user.image}
                      name={user.name ?? user.email}
                      showFallback
                      size="sm"
                    />
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1 font-medium underline">
                        {user.name ?? "(no name)"}
                        {user.role === "admin" && (
                          <Badge tone="danger">admin</Badge>
                        )}
                      </span>
                      <span className="text-xs text-default-500">
                        {user.email}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className={td}>
                  <AdminPrivacyToggles
                    userId={user.id}
                    initial={{
                      isPrivate: user.isPrivate,
                      interactionsPrivate: user.interactionsPrivate,
                    }}
                  />
                </td>
                <td className={td}>{formatDate(user.createdAt)}</td>
                <td className={td} title={formatDateTime(user.lastLoginAt)}>
                  {formatRelative(user.lastLoginAt)}
                </td>
                <td className={`${td} tabular-nums`}>{user.loginCount}</td>
                <td className={`${td} tabular-nums`}>{user.activeSessions}</td>
                <td className={`${td} tabular-nums`}>{user.scoreCount}</td>
                <td className={td}>{formatRelative(user.lastScoreAt)}</td>
                <td className={`${td} tabular-nums`}>{user.friendCount}</td>
                <td className={`${td} tabular-nums`}>{user.commentCount}</td>
                <td className={td}>
                  {user.role === "admin" ? (
                    <span className="text-xs text-default-400">—</span>
                  ) : (
                    <ImpersonateButton userId={user.id} label="View as" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent logins">
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>User</th>
                <th className={th}>When</th>
                <th className={th}>Provider</th>
                <th className={th}>IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {recentLogins.length === 0 && (
                <EmptyRow colSpan={4}>
                  No logins recorded yet — this starts filling in after the next
                  sign-in
                </EmptyRow>
              )}
              {recentLogins.map((login) => (
                <tr key={login.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/users/${login.userId}`}
                      className="underline"
                    >
                      {login.user?.name ?? login.user?.email ?? login.userId}
                    </Link>
                    {login.isNewUser && (
                      <>
                        {" "}
                        <Badge tone="success">new</Badge>
                      </>
                    )}
                  </td>
                  <td className={td} title={formatDateTime(login.createdAt)}>
                    {formatRelative(login.createdAt)}
                  </td>
                  <td className={td}>{login.provider ?? "—"}</td>
                  <td className={td}>{login.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Admin activity"
          description="Impersonation and role changes. Append-only."
        >
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>Action</th>
                <th className={th}>Admin</th>
                <th className={th}>Target</th>
                <th className={th}>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {auditLog.length === 0 && (
                <EmptyRow colSpan={4}>Nothing logged yet</EmptyRow>
              )}
              {auditLog.map((entry) => (
                <tr key={entry.id}>
                  <td className={td}>
                    <Badge
                      tone={
                        entry.action.startsWith("impersonation")
                          ? "warning"
                          : "default"
                      }
                    >
                      {entry.action}
                    </Badge>
                  </td>
                  <td className={td}>
                    {entry.adminUser?.name ?? entry.adminUser?.email ?? "—"}
                  </td>
                  <td className={td}>{entry.targetUser?.email ?? "—"}</td>
                  <td className={td} title={formatDateTime(entry.createdAt)}>
                    {formatRelative(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Games" description="All-time score volume per game.">
        <table className="w-full">
          <thead className="bg-default-100">
            <tr>
              <th className={th}>Game</th>
              <th className={th}>Scores</th>
              <th className={th}>Players</th>
              <th className={th}>Last played</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default-200">
            {games.length === 0 && (
              <EmptyRow colSpan={4}>No scores yet</EmptyRow>
            )}
            {games.map((game) => (
              <tr key={game.gameType}>
                <td className={td}>{getPrettyGameType(game.gameType)}</td>
                <td className={`${td} tabular-nums`}>{game.total}</td>
                <td className={`${td} tabular-nums`}>{game.players}</td>
                <td className={td}>{formatRelative(game.lastPlayedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
