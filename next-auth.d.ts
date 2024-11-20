import NextAuth from "next-auth";


declare module 'next-auth' {
  interface Session {
    user: {
      email?: string;
      name?: string;
      image?: string;
      sub?: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: string;
    spreadsheet_id?: string;
  }

  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user: {
      email?: string;
      name?: string;
      image?: string;
      sub?: string;
    };
  }
}