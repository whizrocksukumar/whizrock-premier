// ============================================================================
// TASK HELPERS - Internal notifications and task management
// Location: src/lib/task-helpers.ts
// ============================================================================

import { supabase } from '@/lib/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Task {
  id: string
  opportunity_id: string
  task_description: string
  task_type?: string
  created_by_user_id?: string
  assigned_to_user_id?: string
  due_date?: string
  due_time?: string
  scheduled_date?: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Closed'
  priority: 'Low' | 'Normal' | 'High'
  completion_percent?: number
  completed_at?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaskWithDetails extends Task {
  created_by?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  assigned_to?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  opportunity?: {
    id: string
    opp_number: string
    stage: string
    contact_first_name: string
    contact_last_name: string
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Create a task for assessment review
 */
export async function createAssessmentReviewTask(data: {
  opportunity_id: string
  assessment_id?: string
  assigned_to_user_id: string
  created_by_user_id: string
  notes?: string
}): Promise<Task> {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: taskData, error } = await supabase
      .from('tasks')
      .insert({
        opportunity_id: data.opportunity_id,
        task_type: 'Review Assessment & Create Recommendation',
        task_description: `Review assessment findings and create product recommendation for client. Assessment ID: ${data.assessment_id || 'N/A'}`,
        assigned_to_user_id: data.assigned_to_user_id,
        created_by_user_id: data.created_by_user_id,
        status: 'Not Started',
        priority: 'High',
        due_date: tomorrow.toISOString().split('T')[0],
        notes: data.notes,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    if (!taskData) throw new Error('Task creation failed')

    return taskData as Task
  } catch (error) {
    console.error('Error creating assessment review task:', error)
    throw error
  }
}

/**
 * Create a task for recommendation to quote conversion
 */
export async function createQuoteConversionTask(data: {
  opportunity_id: string
  recommendation_id?: string
  assigned_to_user_id: string
  created_by_user_id: string
  notes?: string
}): Promise<Task> {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: taskData, error } = await supabase
      .from('tasks')
      .insert({
        opportunity_id: data.opportunity_id,
        task_type: 'Convert Recommendation to Quote',
        task_description: `Convert product recommendation to quote and send to client. Recommendation ID: ${data.recommendation_id || 'N/A'}`,
        assigned_to_user_id: data.assigned_to_user_id,
        created_by_user_id: data.created_by_user_id,
        status: 'Not Started',
        priority: 'High',
        due_date: tomorrow.toISOString().split('T')[0],
        notes: data.notes,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    if (!taskData) throw new Error('Task creation failed')

    return taskData as Task
  } catch (error) {
    console.error('Error creating quote conversion task:', error)
    throw error
  }
}

/**
 * Create a generic task
 */
export async function createTask(data: {
  opportunity_id: string
  task_type: string
  task_description: string
  assigned_to_user_id: string
  created_by_user_id: string
  due_date?: string
  priority?: 'Low' | 'Normal' | 'High'
  notes?: string
}): Promise<Task> {
  try {
    const { data: taskData, error } = await supabase
      .from('tasks')
      .insert({
        opportunity_id: data.opportunity_id,
        task_type: data.task_type,
        task_description: data.task_description,
        assigned_to_user_id: data.assigned_to_user_id,
        created_by_user_id: data.created_by_user_id,
        status: 'Not Started',
        priority: data.priority || 'Normal',
        due_date: data.due_date,
        notes: data.notes,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    if (!taskData) throw new Error('Task creation failed')

    return taskData as Task
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

/**
 * Fetch task with all details
 */
export async function fetchTaskWithDetails(taskId: string): Promise<TaskWithDetails> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError
    if (!task) throw new Error('Task not found')

    // Fetch created_by details
    let created_by = null
    if (task.created_by_user_id) {
      const { data: creatorData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email')
        .eq('id', task.created_by_user_id)
        .single()
      created_by = creatorData
    }

    // Fetch assigned_to details
    let assigned_to = null
    if (task.assigned_to_user_id) {
      const { data: assigneeData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email')
        .eq('id', task.assigned_to_user_id)
        .single()
      assigned_to = assigneeData
    }

    // Fetch opportunity details
    let opportunity = null
    if (task.opportunity_id) {
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('id, opp_number, stage, contact_first_name, contact_last_name')
        .eq('id', task.opportunity_id)
        .single()
      opportunity = oppData
    }

    return {
      ...task,
      created_by: created_by || undefined,
      assigned_to: assigned_to || undefined,
      opportunity: opportunity || undefined,
    } as TaskWithDetails
  } catch (error) {
    console.error('Error fetching task with details:', error)
    throw error
  }
}

/**
 * Fetch tasks assigned to a user
 */
export async function fetchTasksForUser(
  userId: string,
  status?: string
): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to_user_id', userId)
      .eq('is_active', true)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('due_date', {
      ascending: true,
      nullsFirst: false,
    })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching tasks for user:', error)
    throw error
  }
}

/**
 * Fetch open tasks for a user (not completed)
 */
export async function fetchOpenTasksForUser(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to_user_id', userId)
      .eq('is_active', true)
      .in('status', ['Not Started', 'In Progress'])
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching open tasks for user:', error)
    throw error
  }
}

/**
 * Fetch tasks for an opportunity
 */
export async function fetchTasksForOpportunity(opportunityId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching tasks for opportunity:', error)
    throw error
  }
}

/**
 * Fetch tasks by type
 */
export async function fetchTasksByType(
  taskType: string,
  userId?: string
): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('task_type', taskType)
      .eq('is_active', true)

    if (userId) {
      query = query.eq('assigned_to_user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching tasks by type:', error)
    throw error
  }
}

/**
 * Fetch overdue tasks
 */
export async function fetchOverdueTasks(): Promise<Task[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .in('status', ['Not Started', 'In Progress'])
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching overdue tasks:', error)
    throw error
  }
}

/**
 * Fetch tasks due soon (within next 7 days)
 */
export async function fetchTasksDueSoon(days: number = 7): Promise<Task[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const todayStr = today.toISOString().split('T')[0]
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .in('status', ['Not Started', 'In Progress'])
      .gte('due_date', todayStr)
      .lte('due_date', futureDateStr)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Error fetching tasks due soon:', error)
    throw error
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Closed'
): Promise<Task> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'Completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completion_percent = 100
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Task update failed')

    return data as Task
  } catch (error) {
    console.error('Error updating task status:', error)
    throw error
  }
}

/**
 * Update task completion percentage
 */
export async function updateTaskProgress(
  taskId: string,
  completionPercent: number
): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completion_percent: Math.min(completionPercent, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Task update failed')

    return data as Task
  } catch (error) {
    console.error('Error updating task progress:', error)
    throw error
  }
}

/**
 * Update task details
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Task update failed')

    return data as Task
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

/**
 * Mark task as completed
 */
export async function completeTask(taskId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'Completed')
}

/**
 * Mark task as in progress
 */
export async function startTask(taskId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'In Progress')
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete task (soft delete by setting is_active to false)
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date) return false
  if (task.status === 'Completed' || task.status === 'Closed') return false
  const today = new Date().toISOString().split('T')[0]
  return task.due_date < today
}

/**
 * Check if a task is due soon (within 3 days)
 */
export function isTaskDueSoon(task: Task, days: number = 3): boolean {
  if (!task.due_date) return false
  if (task.status === 'Completed' || task.status === 'Closed') return false
  const today = new Date()
  const dueDate = new Date(task.due_date)
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= days
}

/**
 * Get task priority color (for UI)
 */
export function getTaskPriorityColor(priority: string): string {
  switch (priority) {
    case 'High':
      return '#dc2626' // red
    case 'Normal':
      return '#2563eb' // blue
    case 'Low':
      return '#16a34a' // green
    default:
      return '#6b7280' // gray
  }
}

/**
 * Get task status color (for UI)
 */
export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'Completed':
      return '#16a34a' // green
    case 'In Progress':
      return '#f59e0b' // amber
    case 'Not Started':
      return '#6b7280' // gray
    case 'Closed':
      return '#6b7280' // gray
    default:
      return '#6b7280' // gray
  }
}

// ============================================================================
// END OF FILE
// ============================================================================