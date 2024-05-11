import { Session, getServerSession } from "next-auth";
import SheetsClient from "./SheetsClient";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { findSpreadsheet, initGoogleAuth, initDriveClient } from "@/utils/googleUtils";

export async function useSheetsClient() {
    const session = (await getServerSession(options)) as Session;
    console.log("sheets session", session);

    const auth = initGoogleAuth(session.access_token);
    const drive = initDriveClient(auth);
    session.spreadsheet_id = await findSpreadsheet(drive);

    return new SheetsClient(session.access_token as string, session.spreadsheet_id as string, session.user);
}