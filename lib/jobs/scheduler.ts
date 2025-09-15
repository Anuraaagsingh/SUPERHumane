import { createBrowserClient } from "@supabase/ssr"

export interface ScheduledJob {
  id: string
  type: "send_email" | "reminder" | "unsnooze"
  payload: any
  scheduled_for: string
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  max_attempts: number
  created_at: string
  updated_at: string
}

export class JobScheduler {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async scheduleEmail(emailData: any, scheduledFor: Date) {
    const { data, error } = await this.supabase
      .from("scheduled_jobs")
      .insert({
        type: "send_email",
        payload: emailData,
        scheduled_for: scheduledFor.toISOString(),
        status: "pending",
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async scheduleReminder(messageId: string, remindAt: Date) {
    const { data, error } = await this.supabase
      .from("scheduled_jobs")
      .insert({
        type: "reminder",
        payload: { message_id: messageId },
        scheduled_for: remindAt.toISOString(),
        status: "pending",
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async scheduleUnsnooze(messageId: string, unsnoozeAt: Date) {
    const { data, error } = await this.supabase
      .from("scheduled_jobs")
      .insert({
        type: "unsnooze",
        payload: { message_id: messageId },
        scheduled_for: unsnoozeAt.toISOString(),
        status: "pending",
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getPendingJobs() {
    const { data, error } = await this.supabase
      .from("scheduled_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })

    if (error) throw error
    return data || []
  }

  async markJobCompleted(jobId: string) {
    const { error } = await this.supabase
      .from("scheduled_jobs")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (error) throw error
  }

  async markJobFailed(jobId: string, attempts: number) {
    const status = attempts >= 3 ? "failed" : "pending"

    const { error } = await this.supabase
      .from("scheduled_jobs")
      .update({
        status,
        attempts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (error) throw error
  }
}

export const jobScheduler = new JobScheduler()
