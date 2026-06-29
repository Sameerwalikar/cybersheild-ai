import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.get("/me", authenticate, authController.me);

export const authRouter = router;
