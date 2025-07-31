import { z } from "zod";

// Signup Schema (add as needed)
export const signupSchema = z.object({
  username: z.string().min(3, "Username too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Add confirmPassword if you want backend to double-check match:
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// You can export the TypeScript type like this:
export type SignupInput = z.infer<typeof signupSchema>;
