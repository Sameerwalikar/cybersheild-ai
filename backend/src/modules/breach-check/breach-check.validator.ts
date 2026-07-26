import { z } from "zod";

export const breachCheckSchema = z.object({
  email: z.string().email("Invalid email format"),
});
