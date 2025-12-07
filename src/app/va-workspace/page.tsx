'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Clock, PlayCircle, AlertCircle, Eye, Calendar, CheckCircle2, Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  task_description: string;
  task_type: string;
  status: string;
  priority: string;
  due_date: string;
  completion_percent: number;
  notes: string;
  opportunity?: {
    id: string;
    opp_number: string;
    contact_first_name: string;
    contact_last_name: string;
    company?: {
      company_name: string;
    } | null;
  };
}

interface Recommendation {
  id: string;
  recommendation_number: string;
  status: string;
  created_at: string;
  section_count?: number;
  total_area_sqm?: number;
  total_packs_required?: number;
  opportunity?: {
    id: string;
    opp_number: string;
    contact_first_name: string;
    contact_last_name: string;
    company?: {
      company_name: string;
    } | null;
  };
}

export default function VAWorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and sorting
  const [taskSearch, setTaskSearch] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'due_date' | 'status'>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Task stats
  const [taskStats, setTaskStats] = useState({
    new: 0,
    inProgress: 0,
  });

  // Recommendation stats
  const [recStats, setRecStats] = useState({
    draft: 0,
    submitted: 0,
  });

  useEffect(() => {
    loadVAData();
  }, []);

  const loadVAData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Authentication will be implemented in next phase
      // For now, try to get the first VA user, or any team member if no VA exists
      let teamMember = null;
      
      const { data: vaUser } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'VA')
        .limit(1)
        .maybeSingle();

      if (vaUser) {
        teamMember = vaUser;
      } else {
        // Fallback: get any team member
        const { data: anyUser } = await supabase
          .from('team_members')
          .select('id, first_name, last_name, email, role')
          .limit(1)
          .maybeSingle();
        
        if (anyUser) {
          teamMember = anyUser;
        } else {
          // Create a mock user for demo purposes
          teamMember = {
            id: '00000000-0000-0000-0000-000000000000',
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@example.com',
            role: 'VA'
          };
        }
      }

      setCurrentUser(teamMember);

      // Load tasks assigned to this VA user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          task_description,
          task_type,
          status,
          priority,
          due_date,
          completion_percent,
          notes,
          opportunity_id
        `)
        .eq('assigned_to_user_id', teamMember.id)
        .eq('is_active', true)
        .in('status', ['Not Started', 'In Progress'])
        .order('due_date', { ascending: true })
        .order('priority', { ascending: false });

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
      } else {
        // Fetch opportunity details separately for each task
        const tasksWithOpps = await Promise.all(
          (tasksData || []).map(async (task) => {
            const { data: opp } = await supabase
              .from('opportunities')
              .select(`
                id,
                opp_number,
                contact_first_name,
                contact_last_name,
                company_id
              `)
              .eq('id', task.opportunity_id)
              .single();

            let companyData = null;
            if (opp?.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('company_name')
                .eq('id', opp.company_id)
                .single();
              companyData = company;
            }

            return {
              ...task,
              opportunity: opp ? {
                ...opp,
                company: companyData
              } : undefined
            };
          })
        );

        setTasks(tasksWithOpps);
        
        const newTasks = tasksWithOpps.filter(t => t.status === 'Not Started').length;
        const inProgressTasks = tasksWithOpps.filter(t => t.status === 'In Progress').length;
        
        setTaskStats({
          new: newTasks,
          inProgress: inProgressTasks,
        });
      }

      // Load recent recommendations
      const { data: recsData, error: recsError } = await supabase
        .from('product_recommendations')
        .select(`
          id,
          recommendation_number,
          status,
          created_at,
          section_count,
          total_area_sqm,
          total_packs_required,
          opportunity_id
        `)
        .eq('created_by_user_id', teamMember.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recsError) {
        console.error('Error loading recommendations:', recsError);
      } else {
        // Fetch opportunity details for each recommendation
        const recsWithOpps = await Promise.all(
          (recsData || []).map(async (rec) => {
            const { data: opp } = await supabase
              .from('opportunities')
              .select(`
                id,
                opp_number,
                contact_first_name,
                contact_last_name,
                company_id
              `)
              .eq('id', rec.opportunity_id)
              .maybeSingle();

            let companyData = null;
            if (opp?.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('company_name')
                .eq('id', opp.company_id)
                .single();
              companyData = company;
            }

            return {
              ...rec,
              opportunity: opp ? {
                ...opp,
                company: companyData
              } : undefined
            };
          })
        );

        setRecommendations(recsWithOpps);
        
        const draft = (recsWithOpps || []).filter(r => r.status === 'Draft').length;
        const submitted = (recsWithOpps || []).filter(r => r.status === 'Submitted').length;
        
        setRecStats({ draft, submitted });
      }

    } catch (err) {
      console.error('Error loading VA data:', err);
      setError('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (task: Task) => {
    if (!task.opportunity) return 'Unknown';
    
    const opp = task.opportunity;
    if (opp.company?.company_name) {
      return opp.company.company_name;
    }
    return `${opp.contact_first_name} ${opp.contact_last_name}`;
  };

  const getContactPerson = (task: Task) => {
    if (!task.opportunity || !task.opportunity.company?.company_name) return null;
    const opp = task.opportunity;
    return `${opp.contact_first_name} ${opp.contact_last_name}`;
  };

  const priorityColors: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-700',
    'Normal': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700',
  };

  const statusColors: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Submitted': 'bg-green-100 text-green-700',
    'Converted to Quote': 'bg-purple-100 text-purple-700',
  };
  
  const priorityOrder: Record<string, number> = {
    'Urgent': 4,
    'High': 3,
    'Normal': 2,
    'Low': 1,
  };
  
  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      if (!taskSearch) return true;
      const searchLower = taskSearch.toLowerCase();
      return (
        task.task_description.toLowerCase().includes(searchLower) ||
        task.task_type.toLowerCase().includes(searchLower) ||
        task.opportunity?.opp_number.toLowerCase().includes(searchLower) ||
        getCustomerName(task).toLowerCase().includes(searchLower)
      );
    });
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'priority') {
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortField === 'due_date') {
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [tasks, taskSearch, sortField, sortDirection]);
  
  const handleSort = (field: 'priority' | 'due_date' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-700">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Workspace</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadVAData()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">VA Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {currentUser?.first_name || 'VA User'}
            </p>
          </div>
          <Link
            href="/va-workspace/new"
            className="px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Recommendation
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-6">
        {/* Task Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* New Tasks Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">New Tasks</h3>
                  <p className="text-sm text-gray-500">Not started yet</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {taskStats.new}
              </div>
            </div>
            {taskStats.new > 0 && (
              <p className="text-sm text-blue-600">
                You have {taskStats.new} new {taskStats.new === 1 ? 'task' : 'tasks'} to review
              </p>
            )}
          </div>

          {/* In Progress Tasks Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">In Progress</h3>
                  <p className="text-sm text-gray-500">Currently working on</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {taskStats.inProgress}
              </div>
            </div>
            {taskStats.inProgress > 0 && (
              <p className="text-sm text-yellow-600">
                {taskStats.inProgress} {taskStats.inProgress === 1 ? 'task' : 'tasks'} in progress
              </p>
            )}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">{taskSearch ? 'No tasks match your search' : 'No active tasks'}</p>
              <p className="text-sm text-gray-400 mt-1">
                {taskSearch ? 'Try a different search term' : 'New tasks will appear here when assigned'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Priority
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Status
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('due_date')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Due Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';
                    const customerName = getCustomerName(task);
                    const contactPerson = getContactPerson(task);
                    
                    return (
                      <tr key={task.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{task.task_type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.opportunity?.company?.company_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.opportunity ? `${task.opportunity.contact_first_name} ${task.opportunity.contact_last_name}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.opportunity && (
                            <span className="text-sm font-medium text-blue-600">
                              {task.opportunity.opp_number}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'Not Started' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {task.completion_percent > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${task.completion_percent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{task.completion_percent}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not started</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'
                          }`}>
                            {new Date(task.due_date).toLocaleDateString('en-NZ', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {isOverdue && (
                            <span className="text-xs text-red-600 font-medium">Overdue</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {task.opportunity && (
                            <Link
                              href={`/va-workspace/new?opportunityId=${task.opportunity.id}`}
                              className={`inline-flex items-center px-3 py-1.5 rounded text-white ${
                                task.status === 'Not Started' 
                                  ? 'bg-blue-600 hover:bg-blue-700' 
                                  : 'bg-yellow-600 hover:bg-yellow-700'
                              }`}
                            >
                              {task.status === 'Not Started' ? 'Start' : 'Continue'}
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Recommendations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Recommendations</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {recStats.draft} draft, {recStats.submitted} submitted
            </p>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No recommendations yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first product recommendation to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommendation #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recommendations.map((rec) => {
                    const companyName = rec.opportunity?.company?.company_name || '-';
                    const contactPerson = rec.opportunity ? 
                      `${rec.opportunity.contact_first_name || ''} ${rec.opportunity.contact_last_name || ''}`.trim() : '-';
                    
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">{rec.recommendation_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{companyName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{contactPerson}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rec.opportunity && (
                            <span className="text-sm text-gray-900">{rec.opportunity.opp_number}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {rec.section_count !== undefined && <div>{rec.section_count} sections</div>}
                            {rec.total_area_sqm !== undefined && <div>{rec.total_area_sqm.toFixed(1)} m²</div>}
                            {rec.total_packs_required !== undefined && <div>{rec.total_packs_required} packs</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[rec.status]}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rec.created_at).toLocaleDateString('en-NZ', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/va-workspace/${rec.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}