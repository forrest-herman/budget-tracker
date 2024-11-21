// @ts-nocheck
import { initGoogleAuth, findOrCreateSpreadsheet } from '@/utils/googleUtils';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';


const { GOOGLE_ID, GOOGLE_SECRET, JWT_SECRET } = process.env;

const scopes = [
  'email',
  'openid',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_ID as string,
      clientSecret: GOOGLE_SECRET as string,
      authorization: {
        params: {
          scope: scopes.join(' '),
          prompt: 'consent', // TODO: how to work with none or select_account
          access_type: 'offline',
          include_granted_scopes: true,
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for session handling
    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // TODO: how can I make this work?
  // jwt: {
  //   secret: JWT_SECRET, // Ensure this is set in your environment variables
  // },
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('account', account);
      console.log('profile', profile);

      if (account && profile) {
        // Initial sign-in if account exists
        // Save the access token and refresh token in the JWT on the initial login, as well as the user details
        token.user = {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Save the refresh token
        token.accessTokenExpires = account.expires_at * 1000; // Expiry time in epoch msec
      }

      console.log('token', token);

      // Return the previous token if it's still valid
      if ((Date.now() < token.accessTokenExpires) as number) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      console.log('session params', { session, token });
      // Pass the token data to the session
      session.user.email = token.user.email;
      session.user.name = token.user.name;
      session.user.image = token.user.picture ?? token.user.image;
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      return session;
    },
    // unnecessary
    // async signIn({ account, profile }) {
    //   // Use the signIn() callback to control if a user is allowed to sign in.
    //   console.log('account', account);
    //   console.log('profile', profile);
    //   // initialize app
    //   if (account && account.access_token) {
    //     try {
    //       const auth = initGoogleAuth(account.access_token);
    //       await findOrCreateSpreadsheet(auth);
    //       return true;
    //     } catch (err) {
    //       print(err);
    //       return false;
    //     }
    //   } else return false;
    // },
  },
};

/**
 * Function to refresh the Google access token
 * @param {Object} token - The JWT token containing access and refresh tokens
 * @returns {Object} - Updated token with new access and refresh tokens
 */
async function refreshAccessToken(token: any) {
  try {
    const url = 'https://oauth2.googleapis.com/token';

    // Prepare the request body
    const requestBody = new URLSearchParams({
      client_id: process.env.GOOGLE_ID as string,
      client_secret: process.env.GOOGLE_SECRET as string,
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token',
    });

    // Use fetch to send the request
    const response = await fetch(url, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Handle non-200 response status codes
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    // Parse the response data
    const refreshedTokens = await response.json();

    console.log('refreshedTokens', refreshedTokens);

    return {
      ...token, // Keep the previous token properties
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000, // Expires in ms
      refreshToken: refreshedTokens.refresh_token || token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    redirect('/api/auth/signin'); // TODO: testing this

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}