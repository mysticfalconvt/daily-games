import Link from "next/link";
import { notFound } from "next/navigation";

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
import { formatDateTime, formatRelative } from "@/utils/format-date";
import { getPrettyGameType } from "@/utils/get-pretty-game-type";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detail = await AdminService.getUserDetail(params.id);

  if (!detail) {
    notFound();
  }

  const {
    user,
    logins,
    activeSessions,
    linkedAccounts,
    friends,
    recentScores,
    recentComments,
    incomingRequests,
    outgoingRequests,
    tallies,
  } = detail;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-default-200 bg-content1 p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={user.image}
            name={user.name ?? user.email}
            showFallback
            size="lg"
          />
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              {user.name ?? "(no name)"}
              {user.role === "admin" && <Badge tone="danger">admin</Badge>}
            </h2>
            <p className="text-sm text-default-500">{user.email}</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {user.emailVerified ? (
                <Badge tone="success">email verified</Badge>
              ) : (
                <Badge>email unverified</Badge>
              )}
            </p>
            <p className="mt-1 text-xs text-default-400">
              Joined {formatDateTime(user.createdAt)} · Last login{" "}
              {formatDateTime(user.lastLoginAt)} · {user.loginCount} logins
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {user.role === "admin" ? (
            <p className="text-xs text-default-400">
              Admins cannot be impersonated
            </p>
          ) : (
            <ImpersonateButton
              userId={user.id}
              label="View app as this user"
              size="md"
            />
          )}
          <Link href="/admin" className="text-sm underline">
            Back to overview
          </Link>
        </div>
      </div>

      <Panel
        title="Privacy"
        description="Changing these on someone's behalf takes effect immediately and is recorded in the audit log. Turning a switch off widens who can see them."
      >
        <div className="flex flex-col gap-3 p-4">
          <AdminPrivacyToggles
            userId={user.id}
            initial={{
              isPrivate: user.isPrivate,
              interactionsPrivate: user.interactionsPrivate,
            }}
            layout="stacked"
          />
          <p className="text-xs text-default-400">
            <strong>Scores</strong> controls who can see the scores they post.{" "}
            <strong>Activity</strong> controls who can see their comments and
            reactions, including on other people&apos;s scores. Both mean
            friends-only when on.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Scores" value={tallies.scoreCount} />
        <StatTile label="Comments" value={tallies.commentCount} />
        <StatTile label="Reactions" value={tallies.reactionCount} />
        <StatTile label="Friends" value={tallies.friendCount} />
        <StatTile label="Active sessions" value={activeSessions.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Login history" description="Most recent 25 sign-ins.">
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>When</th>
                <th className={th}>Provider</th>
                <th className={th}>IP</th>
                <th className={th}>User agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {logins.length === 0 && (
                <EmptyRow colSpan={4}>
                  No logins recorded — tracking starts at their next sign-in
                </EmptyRow>
              )}
              {logins.map((login) => (
                <tr key={login.id}>
                  <td className={td} title={formatDateTime(login.createdAt)}>
                    {formatRelative(login.createdAt)}
                    {login.isNewUser && (
                      <>
                        {" "}
                        <Badge tone="success">signup</Badge>
                      </>
                    )}
                  </td>
                  <td className={td}>{login.provider ?? "—"}</td>
                  <td className={td}>{login.ipAddress ?? "—"}</td>
                  <td
                    className="max-w-[16rem] truncate px-3 py-2 text-xs text-default-500"
                    title={login.userAgent ?? undefined}
                  >
                    {login.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Active sessions"
            description="Unexpired rows in the session table."
          >
            <table className="w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className={th}>Expires</th>
                  <th className={th}>Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {activeSessions.length === 0 && (
                  <EmptyRow colSpan={2}>No active sessions</EmptyRow>
                )}
                {activeSessions.map((session) => (
                  <tr key={session.sessionToken}>
                    <td className={td}>{formatDateTime(session.expires)}</td>
                    {/* Truncated: a full session token is a credential. */}
                    <td className={`${td} font-mono text-xs`}>
                      {session.sessionToken.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Linked accounts">
            <table className="w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className={th}>Provider</th>
                  <th className={th}>Type</th>
                  <th className={th}>Token expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {linkedAccounts.length === 0 && (
                  <EmptyRow colSpan={3}>No linked accounts</EmptyRow>
                )}
                {linkedAccounts.map((account) => (
                  <tr key={`${account.provider}-${account.providerAccountId}`}>
                    <td className={td}>{account.provider}</td>
                    <td className={td}>{account.type}</td>
                    <td className={td}>
                      {account.expiresAt
                        ? formatDateTime(new Date(account.expiresAt * 1000))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Friends (${friends.length})`}>
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {friends.length === 0 && (
                <EmptyRow colSpan={2}>No friends</EmptyRow>
              )}
              {friends.map((friend) => (
                <tr key={friend.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/users/${friend.id}`}
                      className="underline"
                    >
                      {friend.name ?? "(no name)"}
                    </Link>
                  </td>
                  <td className={td}>{friend.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Pending friend requests"
          description="Useful when someone says an invite never arrived."
        >
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>Direction</th>
                <th className={th}>Person</th>
                <th className={th}>Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {incomingRequests.length === 0 &&
                outgoingRequests.length === 0 && (
                  <EmptyRow colSpan={3}>No pending requests</EmptyRow>
                )}
              {incomingRequests.map((request) => (
                <tr key={request.id}>
                  <td className={td}>
                    <Badge>incoming</Badge>
                  </td>
                  <td className={td}>{request.sender?.email ?? "—"}</td>
                  <td className={td}>{formatRelative(request.createdAt)}</td>
                </tr>
              ))}
              {outgoingRequests.map((request) => (
                <tr key={request.id}>
                  <td className={td}>
                    <Badge>outgoing</Badge>
                  </td>
                  <td className={td}>{request.receiver?.email ?? "—"}</td>
                  <td className={td}>{formatRelative(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent scores" description="Most recent 20.">
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>Game</th>
                <th className={th}>Rating</th>
                <th className={th}>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {recentScores.length === 0 && (
                <EmptyRow colSpan={3}>No scores</EmptyRow>
              )}
              {recentScores.map((score) => (
                <tr key={score.id}>
                  <td className={td}>{getPrettyGameType(score.gameType)}</td>
                  <td className={`${td} tabular-nums`}>{score.rating}</td>
                  <td className={td} title={formatDateTime(score.createdAt)}>
                    {formatRelative(score.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recent comments" description="Most recent 20.">
          <table className="w-full">
            <thead className="bg-default-100">
              <tr>
                <th className={th}>Comment</th>
                <th className={th}>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {recentComments.length === 0 && (
                <EmptyRow colSpan={2}>No comments</EmptyRow>
              )}
              {recentComments.map((comment) => (
                <tr key={comment.id}>
                  <td className="max-w-[24rem] px-3 py-2 text-sm">
                    {comment.content}
                  </td>
                  <td className={td} title={formatDateTime(comment.createdAt)}>
                    {formatRelative(comment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
