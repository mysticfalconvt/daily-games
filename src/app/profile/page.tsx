import { Card, CardBody, User } from "@nextui-org/react";

import { FriendManagement } from "@/components/friends/friend-management";
import { requireUser } from "@/lib/auth-context";

export default async function Profile() {
  // While impersonating this is the impersonated user, which is the point -
  // the admin sees the profile page as they see it.
  const { user } = await requireUser();

  return (
    <div className="app-container space-y-6 py-8">
      <Card>
        <CardBody>
          <User
            name={user.name}
            description={user.email}
            avatarProps={{
              showFallback: !user.image,
              src: user.image || "",
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
