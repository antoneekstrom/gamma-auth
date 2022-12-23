import { Application, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import cors from "cors";
import {
  GammaUser,
  GammaAuthOptions,
  getAccessToken,
  getUserFromGamma,
  redirectToGammaLogin,
} from "./gamma";

declare module "express-session" {
  interface SessionData {
    user?: GammaUser;
  }
}

export type GammaExpressOptions = {
  /**
   * The path to redirect to after a successful login (or logout).
   */
  hostUrl: string;
  /**
   * The path that accepts the callback redirect from gamma.
   */
  redirectPath: string;
};

export const LOGIN_PATH = "/api/auth/login";
export const LOGOUT_PATH = "/api/auth/logout";

export function configureGammaAuth(
  app: Application,
  options: GammaAuthOptions & GammaExpressOptions
) {
  configureGammaAuthCors(app, options.hostUrl);
  configureGammaAuthSession(app, options);
  configureGammaAuthRoutes(app, options);
}

function configureGammaAuthSession(
  app: Application,
  { clientSecret }: GammaAuthOptions
) {
  app.use(
    session({
      secret: clientSecret,
      store: new MemoryStore(),
      resave: false,
      saveUninitialized: false,
    })
  );
}

function configureGammaAuthRoutes(
  app: Application,
  options: GammaAuthOptions & GammaExpressOptions
) {
  redirectRoute(app, options);
  loginRoute(app, options);
  logoutRoute(app, options);
}

function configureGammaAuthCors(app: Application, origin: string) {
  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
}

function redirectRoute(
  app: Application,
  options: GammaAuthOptions & GammaExpressOptions
) {
  const { redirectPath } = options;

  app.get(redirectPath, async (req, res) => {
    const code = req.query.code;

    if (!code) {
      res.status(400).send("No code provided");
    }

    const token = await getAccessToken(code as string, options);
    const user = await getUserFromGamma(token, options);

    if (user) {
      saveUserToSession(req, user);
    } else {
      res.status(400).send("No user found");
    }

    redirectToClientHost(res, options.hostUrl);
  });
}

function loginRoute(app: Application, options: GammaAuthOptions) {
  app.get(LOGIN_PATH, (_, res) => redirectToGammaLogin(res, options));
}

function logoutRoute(app: Application, options: GammaExpressOptions) {
  app.get(LOGOUT_PATH, (req, res) => {
    deleteUserFromSession(req);
    redirectToClientHost(res, options.hostUrl);
  });
}

function saveUserToSession(req: Request, user: GammaUser) {
  req.session.user = user;
  req.session.save();
}

function deleteUserFromSession(req: Request) {
  delete req.session.user;
  req.session.save();
}

function redirectToClientHost(res: Response, clientHost: string) {
  res.status(200);
  res.redirect(clientHost);
}
