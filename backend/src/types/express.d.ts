declare namespace Express {
    export interface Request {
      userId: string; // Add our custom userId property to the Request type
    }
  }