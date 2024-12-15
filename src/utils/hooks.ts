import SheetsClient from './SheetsClient';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { findOrCreateSpreadsheet, initGoogleAuth } from '@/utils/googleUtils';
import { Session, getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export async function useSheetsClient() {
  const session = (await getServerSession(options)) as Session;
  console.log('sheets session', session);
  // @ts-ignore
  if (session?.error) {
    console.log('error, going to signin');
    return redirect('/api/auth/signin'); // TODO: make this a variable
  }

  const auth = initGoogleAuth(session.accessToken || '');
  session.spreadsheet_id = (await findOrCreateSpreadsheet(auth)) || ''; // Provide a default value of an empty string if session.spreadsheet_id is null

  // @ts-ignore
  return new SheetsClient(
    session.accessToken as string,
    session.spreadsheet_id as string,
    session.user,
  );
}