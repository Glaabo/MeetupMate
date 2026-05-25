import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";

const hasSmtp =
  Boolean(process.env.SMTP_HOST) && Boolean(process.env.SMTP_FROM);

async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  if (hasSmtp) {
    // Minimal SMTP via nodemailer would go here; for v1 we log in dev and document SMTP in README.
    console.info(`[MeetupMate] Magic link for ${email}: ${url}`);
    return;
  }
  console.info(`[MeetupMate] Magic link for ${email}: ${url}`);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
      expiresIn: 60 * 15,
    }),
    nextCookies(),
  ],
  user: {
    additionalFields: {},
  },
});

export type Session = typeof auth.$Infer.Session;
