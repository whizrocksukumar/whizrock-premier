// lib/google-calendar.ts
import { google } from 'googleapis';

interface GoogleServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

let calendarClient: ReturnType<typeof google.calendar> | null = null;

export function initializeCalendarClient() {
  if (calendarClient) return calendarClient;

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  // Only pass the required fields - filter out extras
  const credentials = {
    type: serviceAccount.type,
    project_id: serviceAccount.project_id,
    private_key_id: serviceAccount.private_key_id,
    private_key: serviceAccount.private_key,
    client_email: serviceAccount.client_email,
    client_id: serviceAccount.client_id,
    auth_uri: serviceAccount.auth_uri,
    token_uri: serviceAccount.token_uri,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
}
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export async function createCalendarEvent(event: CalendarEvent): Promise<string> {
  try {
    const calendar = initializeCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable not set');
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        status: 'confirmed',
        transparency: 'opaque',
      },
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<Array<{ id: string; summary: string; start: string; end: string }>> {
  try {
    const calendar = initializeCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable not set');
    }

    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (
      response.data.items?.map((item) => ({
        id: item.id || '',
        summary: item.summary || '',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
      })) || []
    );
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function updateCalendarEvent(eventId: string, event: CalendarEvent): Promise<void> {
  try {
    const calendar = initializeCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable not set');
    }

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
      },
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const calendar = initializeCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable not set');
    }

    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}