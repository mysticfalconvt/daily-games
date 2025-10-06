import { Card, CardBody, User } from "@nextui-org/react";
import { getServerSession } from "next-auth";

import { FriendManagement } from "@/components/friends/friend-management";
import options from "@/config/auth";
import requireAuth from "@/utils/require-auth";

export default async function Profile() {
  await requireAuth();
  const session = (await getServerSession(options))!;

  return (
    <div className="mx-auto mt-4 max-w-2xl space-y-6">
      <Card>
        <CardBody>
          <User
            name={session.user?.name}
            description={session.user?.email}
            avatarProps={{
              showFallback: !session.user?.image,
              src: session.user?.image || "",
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <FriendManagement />
        </CardBody>
      </Card>
    </div>
  );
}
