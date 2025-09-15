import { jobScheduler, type ScheduledJob } from "./scheduler"
import { createBrowserClient } from "@supabase/ssr"

export class JobProcessor {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  private isProcessing = false

  async start() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log("[v0] Job processor started")

    // Process jobs every 30 seconds
    setInterval(() => {
      this.processJobs()
    }, 30000)

    // Initial processing
    this.processJobs()
  }

  async stop() {
    this.isProcessing = false
    console.log("[v0] Job processor stopped")
  }

  private async processJobs() {
    if (!this.isProcessing) return

    try {
      const jobs = await jobScheduler.getPendingJobs()
      console.log(`[v0] Processing ${jobs.length} pending jobs`)

      for (const job of jobs) {
        await this.processJob(job)
      }
    } catch (error) {
      console.error("[v0] Error processing jobs:", error)
    }
  }

  private async processJob(job: ScheduledJob) {
    try {
      console.log(`[v0] Processing job ${job.id} of type ${job.type}`)

      switch (job.type) {
        case "send_email":
          await this.processSendEmail(job)
          break
        case "reminder":
          await this.processReminder(job)
          break
        case "unsnooze":
          await this.processUnsnooze(job)
          break
        default:
          console.warn(`[v0] Unknown job type: ${job.type}`)
      }

      await jobScheduler.markJobCompleted(job.id)
      console.log(`[v0] Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`[v0] Error processing job ${job.id}:`, error)
      await jobScheduler.markJobFailed(job.id, job.attempts + 1)
    }
  }

  private async processSendEmail(job: ScheduledJob) {
    const response = await fetch("/api/jobs/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job.payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }

    console.log(`[v0] Scheduled email sent successfully`)
  }

  private async processReminder(job: ScheduledJob) {
    const { message_id } = job.payload

    // Create notification or update message status
    const { error } = await this.supabase
      .from("messages")
      .update({
        has_reminder: true,
        reminder_triggered_at: new Date().toISOString(),
      })
      .eq("id", message_id)

    if (error) throw error

    console.log(`[v0] Reminder processed for message ${message_id}`)
  }

  private async processUnsnooze(job: ScheduledJob) {
    const { message_id } = job.payload

    // Unsnooze the message
    const { error } = await this.supabase
      .from("messages")
      .update({
        is_snoozed: false,
        snoozed_until: null,
      })
      .eq("id", message_id)

    if (error) throw error

    console.log(`[v0] Message ${message_id} unsnoozed`)
  }
}

export const jobProcessor = new JobProcessor()
