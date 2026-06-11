import { eq } from "drizzle-orm";
import { db } from "@/db";
import { availability, feedEvents, groupMembers, groups } from "@/db/schema";
import { getSession } from "@/lib/session";

/** GDPR-style export of everything stored about the signed-in user. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user;

  const memberships = await db
    .select({
      groupId: groupMembers.groupId,
      groupName: groups.name,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, me.id));

  const blobs = await db
    .select({
      groupId: availability.groupId,
      ciphertext: availability.ciphertext,
      updatedAt: availability.updatedAt,
    })
    .from(availability)
    .where(eq(availability.userId, me.id));

  const publishedFeedEvents = await db
    .select({
      groupId: feedEvents.groupId,
      date: feedEvents.date,
      title: feedEvents.title,
    })
    .from(feedEvents)
    .where(eq(feedEvents.userId, me.id));

  const payload = {
    exportedAt: new Date().toISOString(),
    note: "availabilityBlobs are end-to-end encrypted with your group keys; the server cannot read them.",
    user: {
      id: me.id,
      name: me.name,
      email: me.email,
      createdAt: me.createdAt,
    },
    groups: memberships,
    availabilityBlobs: blobs,
    calendarFeedEvents: publishedFeedEvents,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="meetupmate-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
