import crypto from "crypto";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";

type BreachResult = {
  name: string;
  breach_date: string;
  added_date: string;
  data_classes: string[];
  description: string;
  is_verified: boolean;
};

// Cache for results (simple in-memory for prototype, could be redis)
const cache = new Map<string, { data: any; expiry: number }>();

export const breachCheckService = {
  async checkEmail(email: string, userId?: string, ipAddress?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
    const maskedEmail = normalizedEmail.replace(/(?<=^.).*(?=@)/, "***");

    // Check cache
    const cached = cache.get(emailHash);
    if (cached && cached.expiry > Date.now()) {
      await this.logAudit(userId, emailHash, maskedEmail, cached.data.breach_count, "xposedornot_v1_cache", ipAddress);
      return cached.data;
    }

    try {
      const response = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(normalizedEmail)}`, {
        signal: AbortSignal.timeout(8000),
      });

      let breaches: BreachResult[] = [];
      let breachCount = 0;

      if (response.status === 404) {
        // No breaches found
      } else if (!response.ok) {
        throw new AppError("Unable to complete breach check at this time.", 503, "BREACH_CHECK_UNAVAILABLE");
      } else {
        const data = (await response.json()) as any;
        
        // Parse XposedOrNot response
        if (data.BreachesSummary && data.BreachesSummary.Site) {
          // XposedOrNot returns breaches in a slightly complex format, let's also fetch check-email to get the list if needed
          // Actually, let's fetch check-email first to get the list of breaches, then map them.
        }
        
        // To be safe and robust, let's try the check-email endpoint first
        const checkRes = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(normalizedEmail)}`, {
          signal: AbortSignal.timeout(8000),
        });

        if (checkRes.status === 200) {
          const checkData = (await checkRes.json()) as any;
          const breachNames = checkData.breaches && Array.isArray(checkData.breaches[0]) ? checkData.breaches[0] : (checkData.breaches || []);
          breachCount = breachNames.length;
          
          // Map to our format. If analytics data is present, we could extract descriptions, but for prototype we can use a generic description if parsing fails.
          breaches = breachNames.map((name: string) => ({
            name: name,
            breach_date: "Unknown", // Would be extracted from analytics if available
            added_date: "Unknown",
            data_classes: ["Email addresses"],
            description: `Your data was found in the ${name} data breach.`,
            is_verified: true
          }));
          
          // Attempt to merge analytics data
          try {
             if (data.ExposedBreaches) {
                 breaches = breaches.map(b => {
                     const analytics = data.ExposedBreaches.find((eb: any) => eb.breachID === b.name);
                     if (analytics) {
                         return {
                             ...b,
                             data_classes: analytics.exposedData ? analytics.exposedData.split(';') : b.data_classes,
                             description: analytics.breachedDetails || b.description,
                         }
                     }
                     return b;
                 });
             }
          } catch(e) {}
        }
      }

      const result = {
        email_checked: maskedEmail,
        breach_count: breachCount,
        breaches,
        checked_at: new Date().toISOString(),
      };

      // Set cache (15 mins)
      cache.set(emailHash, { data: result, expiry: Date.now() + 15 * 60 * 1000 });

      // Audit Log
      await this.logAudit(userId, emailHash, maskedEmail, breachCount, "xposedornot_v1", ipAddress);

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Unable to complete breach check at this time.", 503, "BREACH_CHECK_UNAVAILABLE");
    }
  },

  async logAudit(userId: string | undefined, emailHash: string, maskedEmail: string, breachCount: number, source: string, ipAddress?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: "breach_check_performed",
          entity: "breach_check",
          entityId: emailHash,
          details: {
            resource: maskedEmail,
            result: {
              breach_count: breachCount,
              status: "success",
            },
            model_version: source,
          },
          ipAddress: ipAddress || null,
        }
      });
    } catch (error) {
      console.error("Failed to write audit log", error);
    }
  }
};
