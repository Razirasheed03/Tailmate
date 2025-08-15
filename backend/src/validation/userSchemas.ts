import { z } from "zod";


export const signupSchema = z.object({
  username: z.string().min(3, "Username too short"),
  email: z.email("Invalid email address"),
  password: z.string()    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*\-]).{8,}$/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (#?!@$%^&*-)"
    }),
  confirmPassword: z.string(),
   isDoctor: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


export type SignupInput = z.infer<typeof signupSchema>;
