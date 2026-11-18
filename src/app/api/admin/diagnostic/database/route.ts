import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie",
  "X-Robots-Tag": "noindex, nofollow",
};

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noCacheHeaders });
}

function getSanitizedEndpoint(): { id: string; region: string } | null {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return null;

  try {
    const hostname = new URL(connectionString).hostname;
    const match = hostname.match(
      /^(ep-[a-z0-9-]+?)(?:-pooler)?\.c-[a-z0-9-]+\.(ap-[a-z]+-\d)\.aws\.neon\.tech$/i,
    );
    return match ? { id: match[1], region: match[2] } : null;
  } catch {
    return null;
  }
}

type DatabaseIdentity = {
  database: string;
  role: string;
  version: string;
  schema: string | null;
  serverVersion: string;
};

export async function GET() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return response({ error: "authentication_unavailable" }, 503);
  }

  if (!user) return response({ error: "authentication_required" }, 401);
  if (user.role !== UserRole.ADMIN) {
    return response({ error: "admin_required" }, 403);
  }

  let identity: DatabaseIdentity;
  try {
    identity = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      const rows = await tx.$queryRaw<DatabaseIdentity[]>`
        SELECT current_database() AS "database",
               current_user AS "role",
               version() AS "version",
               current_schema() AS "schema",
               current_setting('server_version') AS "serverVersion"
      `;
      return rows[0];
    });
  } catch {
    return response({ error: "database_identity_query_failed" }, 503);
  }

  if (!identity) return response({ error: "database_identity_unavailable" }, 503);

  const endpoint = getSanitizedEndpoint();
  const deploymentId = process.env["VERCEL_DEPLOYMENT_ID"] ?? null;
  const commit = process.env["VERCEL_GIT_COMMIT_SHA"];

  return response({
    database: identity.database,
    endpoint,
    role: identity.role,
    version: identity.version,
    schema: identity.schema,
    serverVersion: identity.serverVersion,
    deployment: {
      id: deploymentId,
      commit: commit ? commit.slice(0, 12) : null,
    },
    matchesExpected:
      identity.database === "attendx" &&
      endpoint?.id === "ep-polished-band-azqcznav" &&
      endpoint?.region === "ap-southeast-1",
  });
}
