import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma.js";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        email:    { label: "Email",    type: "email" },
        phone:    { label: "Phone",    type: "text" },
        password: { label: "Password", type: "password" },
        type:     { label: "Type",     type: "text" },
        otpToken: { label: "OTP Token", type: "text" },
      },

      async authorize(credentials) {
        console.log("[AUTH] Authorize called with type:", credentials?.type);
        if (!credentials?.type) throw new Error("Missing login type");

        // ── SUPERADMIN: Environment variable auth ──────────────────────────────
        if (credentials.type === "superadmin") {
          const email = credentials.email;
          const password = credentials.password;
          
          if (!email || !password) throw new Error("Email and Password required");
          if (email !== process.env.SUPERADMIN_EMAIL || password !== process.env.SUPERADMIN_PASSWORD) {
            throw new Error("Invalid superadmin credentials");
          }
          
          return {
            id: "superadmin-id",
            name: "Super Admin",
            email: email,
            role: "superadmin",
          };
        }

        // ── SHOP: email/phone + password ───────────────────────────────────────────
        if (credentials.type === "shop") {
          const identifier = credentials.identifier || credentials.email || credentials.phone;
          if (!identifier) throw new Error("Email or Phone required");
          
          if (identifier === process.env.SUPERADMIN_EMAIL && credentials.password === process.env.SUPERADMIN_PASSWORD) {
            return {
              id: "superadmin-id",
              name: "Super Admin",
              email: identifier,
              role: "superadmin",
            };
          }
          
          const normalizedPhone = identifier.replace(/\D/g, '').slice(-10);

          const shop = await prisma.shop.findFirst({ 
            where: {
              OR: [
                { email: identifier },
                { phone: identifier },
                { phone: normalizedPhone }
              ]
            }
          });

          if (!shop) {
            throw new Error(`Account not found for: ${identifier}`);
          }
          
          if (!shop.password) {
            throw new Error("Account has no password. Please use OTP login.");
          }

          const valid = await bcrypt.compare(credentials.password, shop.password);
          if (!valid) throw new Error("Incorrect password. Please check and try again.");
          
          return { id: shop.id, name: shop.name || shop.phone, email: shop.email, role: "shop" };
        }

        // ── SHOP: OTP-based (after phone verify) ─────────────────────────────
        if (credentials.type === "shop-otp") {
          // The OTP has already been verified by /api/auth/otp/verify.
          // We receive the verified phone and trust it.
          const phone = credentials.phone;
          if (!phone) throw new Error("Phone required");
          const shop = await prisma.shop.findUnique({ where: { phone } });
          if (!shop) throw new Error("Shop not found after OTP verification");
          return {
            id: shop.id,
            name: shop.name || shop.phone,
            phone: shop.phone,
            role: "shop",
            onboardingStep: shop.onboardingStep,
          };
        }

        // ── CUSTOMER: phone or email + password ──────────────────────────────
        if (credentials.type === "customer") {
          const identifier = credentials.phone || credentials.email;
          if (!identifier) throw new Error("Phone or Email required");
          const customer = await prisma.customer.findFirst({
            where: { OR: [{ phone: identifier }, { email: identifier }] },
          });
          if (!customer || !customer.password) throw new Error("Customer not found");
          const valid = await bcrypt.compare(credentials.password, customer.password);
          if (!valid) throw new Error("Invalid password");
          return {
            id: customer.id,
            name: "Customer",
            phone: customer.phone,
            email: customer.email,
            role: "customer",
          };
        }

        throw new Error("Invalid login type");
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.onboardingStep = user.onboardingStep;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id             = token.id;
        session.user.role           = token.role;
        session.user.phone          = token.phone;
        session.user.onboardingStep = token.onboardingStep;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_change_in_production",
};
