import { db } from "@/lib/firebase";
import type { ActivityType, Prospect, ProspectHealthStatus, SupportTicket } from "./types";

const SCORE_WEIGHTS: Record<ActivityType, number> = {
  form_submission: 10,
  audit_completed: 20,
  email_sent: 1,
  email_opened: 5,
  email_clicked: 12,
  call_booked: 40,
  call_completed: 30,
  note_added: 0,
  status_changed: 0,
  contract_sent: 25,
  contract_signed: 50,
  payment_received: 50,
  file_uploaded: 15,
  ticket_created: 5, // Seeking support implies engagement
  ticket_replied: 2,
  milestone_shared: 5,
};

/**
 * Recalculates the algorithmic Lead Score (0-100) based on historical activity and time decay.
 */
export async function recalculateLeadScore(prospectId: string): Promise<void> {
  try {
    const activitiesSnap = await db.collection("activities").where("prospectId", "==", prospectId).get();
    
    let rawScore = 0;
    let lastEngagementDate: Date | null = null;
    
    activitiesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const type = data.type as ActivityType;
      rawScore += SCORE_WEIGHTS[type] || 0;
      
      const date = new Date(data.createdAt);
      if (!lastEngagementDate || date > lastEngagementDate) {
        lastEngagementDate = date;
      }
    });
    
    // Time decay factor: subtract 2 points for every full day of inactivity
    if (lastEngagementDate) {
      const lastDate = lastEngagementDate as Date;
      const daysElapsed = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const decay = Math.max(0, daysElapsed * 2);
      rawScore -= decay;
    }
    
    // Normalize to 0-100 ceiling/floor
    const finalScore = Math.max(0, Math.min(100, Math.floor(rawScore)));
    
    await db.collection("prospects").doc(prospectId).update({ leadScore: finalScore });
  } catch (error) {
    console.error(`[Intelligence] Failed to calculate lead score for ${prospectId}:`, error);
  }
}

/**
 * Predicts the Churn/Health Status of a prospect based on engagement gaps and unresolved friction (tickets).
 */
export async function evaluateProspectHealth(prospectId: string): Promise<void> {
  try {
    const doc = await db.collection("prospects").doc(prospectId).get();
    if (!doc.exists) return;
    
    const prospect = doc.data() as Prospect;
    
    // Exclude leads and fully launched clients from intense churn monitoring for the moment, unless desired.
    // For now, we apply to everything except 'lead' where we just want them to score high
    if (prospect.status === 'lead') {
      if (prospect.healthStatus !== 'healthy') {
        await db.collection("prospects").doc(prospectId).update({ healthStatus: 'healthy' });
      }
      return;
    }

    let health: ProspectHealthStatus = 'healthy';
    
    // 1. Inactivity assessment
    const daysSinceContact = prospect.lastContactedAt 
      ? Math.floor((Date.now() - new Date(prospect.lastContactedAt as string).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
        
    // 2. Open friction (tickets)
    const ticketsSnap = await db.collection("tickets")
      .where("prospectId", "==", prospectId)
      .where("status", "in", ["open", "in_progress"])
      .get();
    
    let oldestTicketDays = 0;
    ticketsSnap.docs.forEach((t) => {
      const ticketData = t.data() as SupportTicket;
      const age = Math.floor((Date.now() - new Date(ticketData.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (age > oldestTicketDays) oldestTicketDays = age;
    });
    
    // 3. Proactive Thresholds
    if (oldestTicketDays >= 5 || daysSinceContact >= 14) {
      health = 'churn_risk';
    } else if (oldestTicketDays >= 2 || daysSinceContact >= 7) {
      health = 'at_risk';
    }
    
    if (prospect.healthStatus !== health) {
      await db.collection("prospects").doc(prospectId).update({ healthStatus: health });
    }
  } catch (error) {
    console.error(`[Intelligence] Failed to evaluate health for ${prospectId}:`, error);
  }
}
