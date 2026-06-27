import { z } from "zod";
import {infer as zodInfer } from 'zod';


export const UserLoginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type IUserLoginSchema = z.infer<typeof UserLoginSchema>;

export const UserRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type IUserRegistrationSchema = z.infer<typeof UserRegistrationSchema>;

export const VerifyUserSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  verification_code: z.string().length(6),
});
export type IVerifyUserSchema = z.infer<typeof VerifyUserSchema>;

export const CheckVerificationCodeSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  verification_code: z.string().length(6),
});
export type ICheckVerificationCodeSchema = z.infer<typeof CheckVerificationCodeSchema>;

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
});
export type IForgotPasswordSchema = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  verification_code: z.string().length(6),
  new_password: z.string().min(8),
});
export type IResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;

export const ResendVerificationSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
});
export type IResendVerificationSchema = z.infer<typeof ResendVerificationSchema>;

export const CheckUsernameAvailabilitySchema = z.object({
  username: z.string().min(3),
});
export type ICheckUsernameAvailabilitySchema = z.infer<typeof CheckUsernameAvailabilitySchema>;




const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const UpdateUserSchema = z.object({
    name: z.string()
        .min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be at most 50 characters long"),
    username: z.string()
        .regex(usernameRegex, "Username must be 3-20 characters, letters, numbers, or underscores only"),
    country_code: z.number().min(1, "Country code must be a valid number").max(999, "Country code must be a valid number"),
    phone: z.string()
        .min(10, "Phone must be at least 10 characters long").max(15, "Phone must be at most 15 characters long")
})

type IUpdateUserSchema = zodInfer<typeof UpdateUserSchema>;

export type {
    IUpdateUserSchema
}

export {
    UpdateUserSchema
}
