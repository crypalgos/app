import { z, infer as zodInfer } from "zod";

const UserSchema = z.object({
    id: z.string().describe("Unique identifier for the user"),
    name: z.string().describe("Name of the registered user"),
    email: z.string().email().describe("Email address of the registered user"),
    username: z.string().describe("Username of the registered user"),
    country_code: z
        .number()
        .int()
        .optional()
        .nullable()
        .describe("Country code of the registered user"),
    phone: z
        .string()
        .optional()
        .nullable()
        .describe("Phone number of the registered user"),
    is_verified: z.boolean().describe("Verification status of the registered user"),
    created_at: z.coerce.date().describe("Creation time of the user record"),
    updated_at: z.coerce.date().describe("Last update time of the user record"),
});

const UserUpdateSchema = z.object({
    name: z
        .string()
        .min(2)
        .max(50)
        .optional()
        .nullable()
        .describe("Name of the user"),
    email: z.string().email().optional().nullable().describe("Email address of the user"),
    username: z
        .string()
        .min(3)
        .max(50)
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, underscores, and hyphens"
        )
        .optional()
        .nullable()
        .describe("Username for the user"),
    country_code: z.number().int().optional().nullable().describe("Country code of the user"),
    phone: z.string().optional().nullable().describe("Phone number of the user"),
});

const UserRegistrationSchema = z.object({
    name: z.string().min(2).max(50).describe("Name of the user"),
    email: z.string().email().describe("Email address of the user"),
    username: z
        .string()
        .min(3)
        .max(50)
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, underscores, and hyphens"
        )
        .describe("Username for the user"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .describe("Password for the user"),
});

const UserLoginSchema = z.object({
    identifier: z.string().describe("Email or username for login"),
    password: z.string().describe("Password for login"),
});

const UserLoginResponseSchema = z.object({
    user: UserSchema.describe("User details"),
    access_token: z.string().describe("JWT access token"),
    message: z.string().default("Login successful").describe("Success message"),
});

const UserRegistrationResponseSchema = z.object({
    user: UserSchema.describe("Details of the registered user"),
    message: z
        .string()
        .default("User registered successfully. Please verify your email.")
        .describe("Success message for user registration"),
});

const VerifyUserSchema = z.object({
    identifier: z.string().describe("Email address or username of the user"),
    verification_code: z.string().describe("Verification code sent to email"),
});

const CheckVerificationCodeSchema = z.object({
    identifier: z.string().describe("Email address or username of the user"),
    verification_code: z.string().describe("Verification code to check"),
});

const VerifyUserResponseSchema = z.object({
    user: UserSchema.describe("User details"),
    tokens: z.record(z.string(), z.any()).describe("Authentication tokens"),
    message: z
        .string()
        .default("User verified and logged in successfully")
        .describe("Success message"),
});

const ForgotPasswordSchema = z.object({
    identifier: z.string().describe("Email address or username of the user"),
});

const ResetPasswordSchema = z.object({
    identifier: z.string().describe("Email address or username of the user"),
    verification_code: z.string().describe("Verification code sent to email"),
    new_password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .describe("New password"),
});

const ResendVerificationSchema = z.object({
    identifier: z.string().describe("Email address or username of the user"),
});

const RefreshTokenSchema = z.object({
    refresh_token: z.string().describe("Refresh token for getting new access token"),
});

const GenericMessageSchema = z.object({
    message: z.string().describe("Generic message response"),
});

const CheckUsernameAvailabilitySchema = z.object({
    username: z
        .string()
        .min(3)
        .max(50)
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, underscores, and hyphens"
        )
        .describe("Username to check availability"),
});

const UsernameAvailabilityResponseSchema = z.object({
    available: z.boolean().describe("Whether the username is available"),
    username: z.string().describe("The username that was checked"),
    message: z.string().describe("Response message"),
});

type IUserSchema = zodInfer<typeof UserSchema>;
type IUserUpdateSchema = zodInfer<typeof UserUpdateSchema>;
type IUserRegistrationSchema = zodInfer<typeof UserRegistrationSchema>;
type IUserLoginSchema = zodInfer<typeof UserLoginSchema>;
type IUserLoginResponseSchema = zodInfer<typeof UserLoginResponseSchema>;
type IUserRegistrationResponseSchema = zodInfer<typeof UserRegistrationResponseSchema>;
type IVerifyUserSchema = zodInfer<typeof VerifyUserSchema>;
type ICheckVerificationCodeSchema = zodInfer<typeof CheckVerificationCodeSchema>;
type IVerifyUserResponseSchema = zodInfer<typeof VerifyUserResponseSchema>;
type IForgotPasswordSchema = zodInfer<typeof ForgotPasswordSchema>;
type IResetPasswordSchema = zodInfer<typeof ResetPasswordSchema>;
type IResendVerificationSchema = zodInfer<typeof ResendVerificationSchema>;
type IRefreshTokenSchema = zodInfer<typeof RefreshTokenSchema>;
type IGenericMessageSchema = zodInfer<typeof GenericMessageSchema>;
type ICheckUsernameAvailabilitySchema = zodInfer<typeof CheckUsernameAvailabilitySchema>;
type IUsernameAvailabilityResponseSchema = zodInfer<
    typeof UsernameAvailabilityResponseSchema
>;

export {
    UserSchema,
    UserUpdateSchema,
    UserRegistrationSchema,
    UserLoginSchema,
    UserLoginResponseSchema,
    UserRegistrationResponseSchema,
    VerifyUserSchema,
    CheckVerificationCodeSchema,
    VerifyUserResponseSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ResendVerificationSchema,
    RefreshTokenSchema,
    GenericMessageSchema,
    CheckUsernameAvailabilitySchema,
    UsernameAvailabilityResponseSchema,
};

export type {
    IUserSchema,
    IUserUpdateSchema,
    IUserRegistrationSchema,
    IUserLoginSchema,
    IUserLoginResponseSchema,
    IUserRegistrationResponseSchema,
    IVerifyUserSchema,
    ICheckVerificationCodeSchema,
    IVerifyUserResponseSchema,
    IForgotPasswordSchema,
    IResetPasswordSchema,
    IResendVerificationSchema,
    IRefreshTokenSchema,
    IGenericMessageSchema,
    ICheckUsernameAvailabilitySchema,
    IUsernameAvailabilityResponseSchema,
};
