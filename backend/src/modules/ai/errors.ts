import { AppError } from "../../utils/AppError.js";

export type AIErrorCode =
  | "MODEL_UNAVAILABLE"
  | "RATE_LIMITED"
  | "AUTHENTICATION_FAILED"
  | "AUTHORIZATION_FAILED"
  | "NETWORK_TIMEOUT"
  | "CONFIGURATION_ERROR"
  | "PROVIDER_ERROR";

export class AIError extends AppError {
  constructor(
    public readonly aiCode: AIErrorCode,
    public readonly rawError?: any
  ) {
    super(getFriendlyMessage(aiCode), getHttpStatus(aiCode), aiCode);
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

function getHttpStatus(code: AIErrorCode): number {
  switch (code) {
    case "MODEL_UNAVAILABLE":
      return 503;
    case "RATE_LIMITED":
      return 429;
    case "AUTHENTICATION_FAILED":
      return 401;
    case "AUTHORIZATION_FAILED":
      return 403;
    case "NETWORK_TIMEOUT":
      return 504;
    case "CONFIGURATION_ERROR":
      return 500;
    case "PROVIDER_ERROR":
    default:
      return 502;
  }
}

export function getFriendlyMessage(code: AIErrorCode): string {
  switch (code) {
    case "MODEL_UNAVAILABLE":
      return "Model temporarily unavailable.";
    case "RATE_LIMITED":
      return "AI service is busy.";
    case "AUTHENTICATION_FAILED":
    case "AUTHORIZATION_FAILED":
      return "Authentication configuration issue.";
    case "NETWORK_TIMEOUT":
      return "Network timeout.";
    case "CONFIGURATION_ERROR":
      return "AI service configuration issue.";
    case "PROVIDER_ERROR":
    default:
      return "AI service is temporarily unavailable.";
  }
}
