import { findSpreadsheet, initGoogleAuth, initSheetsClient, initDriveClient, findOrCreateSpreadsheet } from "@/utils/googleUtils";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
const { GOOGLE_ID, GOOGLE_SECRET } = process.env;

const scopes = ["email", "openid", "profile", "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"];

export const options: NextAuthOptions = {
    session: {
        maxAge: 60 * 60, // match the time of the tokens from google
    },
    providers: [
        GoogleProvider({
            clientId: GOOGLE_ID as string,
            clientSecret: GOOGLE_SECRET as string,
            authorization: {
                params: {
                    scope: scopes.join(" "),
                    prompt: "consent",
                    access_type: "offline",
                    expiry_date: Date.now() + 12096e5,
                },
            },
            httpOptions: {
                timeout: 10000,
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            console.log("jwt callback params:", { token, account });
            if (account) {
                // Save the access token and refresh token in the JWT on the initial login, as well as the user details
                console.log("first sign in");

                return {
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    refresh_token: account.refresh_token,
                    user: token,
                };
            } else if (Date.now() < (token.expires_at as number) * 1000) {
                console.log("token not expired");
                // If the access token has not expired yet, return it
                return token;
            } else {
                if (!token.refresh_token) throw new Error("Missing refresh token");

                // If the access token has expired, try to refresh it
                console.log("trying to refresh token");
                try {
                    // https://accounts.google.com/.well-known/openid-configuration
                    // We need the `token_endpoint`.
                    const response = await fetch("https://oauth2.googleapis.com/token", {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: GOOGLE_ID as string,
                            client_secret: GOOGLE_SECRET as string,
                            grant_type: "refresh_token",
                            refresh_token: token.refresh_token as string,
                        }),
                        method: "POST",
                    });

                    const tokens = await response.json();

                    if (!response.ok) throw tokens;

                    return {
                        ...token, // Keep the previous token properties
                        access_token: tokens.access_token,
                        expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
                        // Fall back to old refresh token, but note that
                        // many providers may only allow using a refresh token once.
                        refresh_token: tokens.refresh_token ?? token.refresh_token,
                    };
                } catch (error) {
                    console.error("Error refreshing access token", error);
                    // The error property will be used client-side to handle the refresh token error
                    return { ...token, error: "RefreshAccessTokenError" as const };
                }
            }
        },
        async session({ session, token }) {
            console.log("session params", { session, token });
            session.error = token.error;
            return {
                ...session,
                ...token,
            };
        },
        // Use the signIn() callback to control if a user is allowed to sign in.
        async signIn(params) {
            console.log("signIn", params);
            const { account, profile } = params;
            //next-auth handles rejection of oauth

            //initialize app
            // if (account && account.access_token) {
            //     try {
            //         const auth = initGoogleAuth(account.access_token);
            //         await findOrCreateSpreadsheet(auth);
            //         return true;
            //     } catch (err) {
            //         return false;
            //     }
            // } else {
            //     return false;
            // }
            return false;
        },
    },
};