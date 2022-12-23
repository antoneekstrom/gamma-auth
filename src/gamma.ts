import axios from "axios";
import { Response } from "express";

export const GAMMA_AUTH_PATH = "/api/oauth/authorize";
export const GAMMA_TOKEN_PATH = "/api/oauth/token";
export const GAMMA_PROFILE_PATH = "/api/users/me";

/**
 * An object with properties neccecary to make requests to gamma.
 */
export type GammaAuthOptions = {
  /**
   * The client id of the application.
   */
  clientId: string;
  /**
   * The client secret of the application.
   */
  clientSecret: string;
  /**
   * The URI that gamma redirects to when returning the access token.
   */
  redirectUri: string;
  /**
   * The base URL of gamma.
   */
  gammaUrl: string;
  /**
   * The local URL of gamma, used if you are running gamma inside a docker stack.
   */
  gammaLocalUrl?: string;
};

export type GammaUser = {
  cid: string;
  groups: GammaGroup[];
  language?: "en" | "sv";
};

export type GammaSuperGroup = {
  name: string;
  type: string;
};

export type GammaGroup = {
  name?: string;
  type?: string;
  superGroup: GammaSuperGroup;
};

export function redirectToGammaLogin(res: Response, options: GammaAuthOptions) {
  const url = authorizationUrl(options);
  res.redirect(url);
}

export async function getAccessToken(code: string, options: GammaAuthOptions) {
  const url = tokenUrl(code, options);
  const { data } = await axios.post(url, null, {
    headers: {
      Authorization: authorizationHeader(options),
    },
  });
  return data.access_token;
}

export async function getUserFromGamma(
  accessToken: string,
  options: GammaAuthOptions
): Promise<GammaUser | undefined> {
  const response = await axios.get<GammaUser>(profileUrl(options), {
    headers: {
      Authorization: tokenBearerHeader(accessToken),
    },
  });
  return {
    language: "en",
    ...response.data,
  };
}

export function profileUrl({ gammaLocalUrl }: GammaAuthOptions) {
  return gammaLocalUrl + GAMMA_PROFILE_PATH;
}

export function authorizationUrl({
  gammaUrl,
  clientId,
  redirectUri: redirectUrl,
}: GammaAuthOptions) {
  const url = new URL(gammaUrl + GAMMA_AUTH_PATH);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUrl);
  return url.toString();
}

export function tokenUrl(
  code: string,
  { gammaLocalUrl, redirectUri: redirectUrl }: GammaAuthOptions
) {
  const url = new URL(gammaLocalUrl + GAMMA_TOKEN_PATH);
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("code", code);
  return url.toString();
}

function authorizationHeader({ clientId, clientSecret }: GammaAuthOptions) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  )}`;
}

function tokenBearerHeader(accessToken: string) {
  return `Bearer ${accessToken}`;
}
