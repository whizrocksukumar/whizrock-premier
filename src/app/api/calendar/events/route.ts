// app/api/calendar/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, getCalendarEvents, CalendarEvent } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    // Get events from Google Calendar
    const events = await getCalendarEvents(startDate, endDate);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assessmentId,
      clientName,
      siteAddress,
      installerName,
      startDateTime,
      endDateTime,
    } = body;

    if (!clientName || !siteAddress || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Google Calendar event
    const calendarEvent: CalendarEvent = {
      summary: `Assessment - ${clientName} - ${siteAddress}`,
      description: `Site Address: ${siteAddress}\nClient: ${clientName}\nInstaller: ${installerName || 'TBD'}`,
      location: siteAddress,
      start: {
        dateTime: startDateTime,
        timeZone: 'Pacific/Auckland',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Pacific/Auckland',
      },
    };

    const calendarEventId = await createCalendarEvent(calendarEvent);

    return NextResponse.json({
      success: true,
      calendarEventId,
    });
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}