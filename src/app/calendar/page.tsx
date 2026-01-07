'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar using date-fns
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'assessment' | 'job';
  status: string;
  clientName: string;
  address: string;
  installerName: string;
  detailUrl: string;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'assessments' | 'jobs'>('all');
  const [installerFilter, setInstallerFilter] = useState<string>('all');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [installers, setInstallers] = useState<TeamMember[]>([]);

  // Fetch installers for filter
  useEffect(() => {
    const fetchInstallers = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('role', 'Installer')
        .eq('status', 'active')
        .order('first_name');

      if (data) setInstallers(data);
    };
    fetchInstallers();
  }, []);

  // Fetch calendar events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const allEvents: CalendarEvent[] = [];

      // Fetch assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          id,
          reference_number,
          scheduled_date,
          scheduled_time,
          status,
          clients:client_id (first_name, last_name, company_name),
          sites:site_id (address_line_1, city),
          team_members:assigned_installer_id (first_name, last_name)
        `)
        .not('scheduled_date', 'is', null);

      console.log('Assessments fetched:', assessments?.length || 0, assessmentsError);
      if (assessmentsError) console.error('Error fetching assessments:', assessmentsError);

      if (assessments) {
        assessments.forEach((assessment: any) => {
          const scheduledDate = new Date(assessment.scheduled_date);

          // Parse time if available, otherwise default to 9 AM
          const timeMatch = assessment.scheduled_time?.match(/(\d{2}):(\d{2})/);
          if (timeMatch) {
            scheduledDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
          } else {
            scheduledDate.setHours(9, 0);
          }

          const endDate = new Date(scheduledDate);
          endDate.setHours(scheduledDate.getHours() + 2); // 2 hour duration

          const clientName = assessment.clients
            ? `${assessment.clients.first_name || ''} ${assessment.clients.last_name || ''}`.trim() || assessment.clients.company_name || 'Unknown'
            : 'Unknown';

          const address = assessment.sites
            ? `${assessment.sites.address_line_1 || ''}, ${assessment.sites.city || ''}`.trim()
            : 'No address';

          const installerName = assessment.team_members
            ? `${assessment.team_members.first_name || ''} ${assessment.team_members.last_name || ''}`.trim()
            : 'Unassigned';

          allEvents.push({
            id: assessment.id,
            title: assessment.reference_number || 'Assessment',
            start: scheduledDate,
            end: endDate,
            type: 'assessment',
            status: assessment.status || 'Scheduled',
            clientName,
            address,
            installerName,
            detailUrl: `/assessments/${assessment.id}`,
          });
        });
      }

      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          scheduled_date,
          status,
          clients:client_id (first_name, last_name, company_name),
          sites:site_id (address_line_1, city),
          team_members:crew_lead_id (first_name, last_name)
        `)
        .not('scheduled_date', 'is', null);

      console.log('Jobs fetched:', jobs?.length || 0, jobsError);
      if (jobsError) console.error('Error fetching jobs:', jobsError);

      if (jobs) {
        jobs.forEach((job: any) => {
          const scheduledDate = new Date(job.scheduled_date);
          scheduledDate.setHours(9, 0); // Default to 9 AM for jobs

          const endDate = new Date(scheduledDate);
          endDate.setHours(scheduledDate.getHours() + 4); // 4 hour duration

          const clientName = job.clients
            ? `${job.clients.first_name || ''} ${job.clients.last_name || ''}`.trim() || job.clients.company_name || 'Unknown'
            : 'Unknown';

          const address = job.sites
            ? `${job.sites.address_line_1 || ''}, ${job.sites.city || ''}`.trim()
            : 'No address';

          const installerName = job.team_members
            ? `${job.team_members.first_name || ''} ${job.team_members.last_name || ''}`.trim()
            : 'Unassigned';

          allEvents.push({
            id: job.id,
            title: job.job_number || 'Job',
            start: scheduledDate,
            end: endDate,
            type: 'job',
            status: job.status || 'Scheduled',
            clientName,
            address,
            installerName,
            detailUrl: `/jobs/${job.id}`,
          });
        });
      }

      console.log('Total events:', allEvents.length, allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Type filter
      if (typeFilter === 'assessments' && event.type !== 'assessment') return false;
      if (typeFilter === 'jobs' && event.type !== 'job') return false;

      // Installer filter
      if (installerFilter !== 'all') {
        const eventInstallerId = events.find(e => e.id === event.id)?.installerName;
        if (eventInstallerId !== installerFilter) return false;
      }

      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(event.status)) return false;

      return true;
    });
  }, [events, typeFilter, installerFilter, statusFilters]);

  // Get status color
  const getStatusColor = (event: CalendarEvent) => {
    const { type, status } = event;

    if (status === 'Cancelled') return '#EF4444'; // Red
    if (status === 'Completed') return type === 'assessment' ? '#10B981' : '#059669'; // Green shades
    if (status === 'In Progress') return '#F59E0B'; // Orange
    if (status === 'Scheduled') return type === 'assessment' ? '#3B82F6' : '#0EA5E9'; // Blue shades
    if (status === 'Draft') return '#6B7280'; // Gray

    return '#6B7280'; // Default gray
  };

  // Event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = getStatusColor(event);
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: event.status === 'Cancelled' ? 0.6 : 1,
      color: 'white',
      border: '0px',
      display: 'block',
      textDecoration: event.status === 'Cancelled' ? 'line-through' : 'none',
    };
    return { style };
  };

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(event.detailUrl);
  };

  // Handle event drag and drop (reschedule)
  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const updatedEvent = event as CalendarEvent;
      const newDate = format(start, 'yyyy-MM-dd');

      if (updatedEvent.type === 'assessment') {
        await supabase
          .from('assessments')
          .update({ scheduled_date: newDate, updated_at: new Date().toISOString() })
          .eq('id', updatedEvent.id);
      } else {
        await supabase
          .from('jobs')
          .update({ scheduled_date: newDate, updated_at: new Date().toISOString() })
          .eq('id', updatedEvent.id);
      }

      // Refresh events
      fetchEvents();
    } catch (error) {
      console.error('Error updating event date:', error);
    }
  };

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="text-xs p-1">
      <div className="font-semibold">{event.title}</div>
      <div className="text-[10px] opacity-90">{event.clientName}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        {/* Header with Blue Background */}
        <div className="bg-[#0066CC] text-white px-6 py-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Calendar</h1>
                <p className="text-sm text-blue-100">Assessments and Job Schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Date Navigation */}
              <input
                type="month"
                value={format(date, 'yyyy-MM')}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
                className="px-3 py-2 text-sm text-gray-900 border border-blue-400 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
              />

              <button
                onClick={() => setDate(new Date())}
                className="px-4 py-2 text-sm bg-white text-[#0066CC] rounded-lg hover:bg-blue-50 font-medium"
              >
                Today
              </button>

              <button
                onClick={() => fetchEvents()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0066CC] rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0066CC] rounded-lg hover:bg-blue-50"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">{/* Content continues */}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1 text-sm rounded ${
                      typeFilter === 'all'
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTypeFilter('assessments')}
                    className={`px-3 py-1 text-sm rounded ${
                      typeFilter === 'assessments'
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Assessments
                  </button>
                  <button
                    onClick={() => setTypeFilter('jobs')}
                    className={`px-3 py-1 text-sm rounded ${
                      typeFilter === 'jobs'
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Jobs
                  </button>
                </div>
              </div>

              {/* Installer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installer</label>
                <select
                  value={installerFilter}
                  onChange={(e) => setInstallerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="all">All Installers</option>
                  {installers.map((installer) => (
                    <option key={installer.id} value={`${installer.first_name} ${installer.last_name}`}>
                      {installer.first_name} {installer.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-3 py-1 text-xs rounded ${
                        statusFilters.includes(status)
                          ? 'bg-[#0066CC] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(typeFilter !== 'all' || installerFilter !== 'all' || statusFilters.length > 0) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setInstallerFilter('all');
                  setStatusFilters([]);
                }}
                className="mt-4 text-sm text-[#0066CC] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mb-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
              <span>Assessment - Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0EA5E9' }}></div>
              <span>Job - Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '700px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading calendar...</div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
              }}
              draggableAccessor={() => true}
              onEventDrop={handleEventDrop}
              resizable={false}
              popup
              tooltipAccessor={(event: CalendarEvent) =>
                `${event.title}\n${event.clientName}\n${event.address}\nInstaller: ${event.installerName}\nStatus: ${event.status}`
              }
            />
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-gray-900">{filteredEvents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600">Assessments</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredEvents.filter((e) => e.type === 'assessment').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600">Jobs</p>
            <p className="text-2xl font-bold text-sky-600">
              {filteredEvents.filter((e) => e.type === 'job').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredEvents.filter((e) => {
                const eventMonth = e.start.getMonth();
                const currentMonth = new Date().getMonth();
                return eventMonth === currentMonth;
              }).length}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
