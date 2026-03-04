import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../tenant/tenant.service';
import { AppointmentService } from '../appointment/appointment.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
    private readonly appointmentService: AppointmentService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');
  }

  /**
   * Ask GPT-4 for smart suggestions based on appointment context
   */
  async suggest(
    tenantId: string,
    prompt: string,
    context?: Record<string, any>,
  ): Promise<{ suggestion: string; confidence: number }> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      return { suggestion: 'Tenant not found', confidence: 0 };
    }

    let systemPrompt: string;

    if (context?.systemInstruction) {
      // External caller (e.g. Telegram bot) with custom system prompt
      // Append safe business context — no customer names or private data
      const today = new Date().toISOString().split('T')[0];
      const availableSlots = await this.appointmentService.getAvailableSlots(
        tenantId,
        today,
      );
      const freeSlots = availableSlots
        .filter((s) => s.available)
        .map((s) => s.time);
      const profile = tenant.soloProfile || {};
      systemPrompt = [
        context.systemInstruction,
        `\nBusiness name: "${tenant.name}"`,
        `Services: ${(profile.services || []).join(', ') || 'various'}`,
        `Slot duration: ${profile.slotDuration || 30} minutes`,
        `Today (${today}) free time slots: ${freeSlots.length > 0 ? freeSlots.join(', ') : 'no available slots today'}`,
        profile.address ? `Address: ${profile.address}` : '',
        profile.phone ? `Contact: ${profile.phone}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      // Internal CRM usage — full appointment context
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = await this.appointmentService.findDaily(
        tenantId,
        today,
      );
      systemPrompt = this.buildSystemPrompt(tenant, todayAppointments);
    }

    const response = await this.chatCompletion(systemPrompt, prompt);

    return {
      suggestion: response,
      confidence: 0.85,
    };
  }

  /**
   * Optimize the daily schedule — analyze gaps, suggest rearrangements
   */
  async optimizeSchedule(
    tenantId: string,
    date: string,
  ): Promise<{
    insights: string[];
    recommendations: string[];
    optimizedSlots: string[];
  }> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      return { insights: [], recommendations: [], optimizedSlots: [] };
    }

    const appointments = await this.appointmentService.findDaily(
      tenantId,
      date,
    );
    const availableSlots = await this.appointmentService.getAvailableSlots(
      tenantId,
      date,
    );

    const systemPrompt = `You are a scheduling optimization AI for "${tenant.name}" business.
Analyze the following schedule data and provide optimization insights.

Business profile:
- Type: ${tenant.soloProfile?.businessType || 'general'}
- Services: ${(tenant.soloProfile?.services || []).join(', ') || 'various'}
- Slot duration: ${tenant.soloProfile?.slotDuration || 30} minutes
- Break between slots: ${tenant.soloProfile?.breakBetweenSlots || 5} minutes

Today's appointments (${appointments.length}):
${appointments.map((a) => `  ${a.timeSlot} - ${a.customerName} (${a.service}) [${a.status}]`).join('\n')}

Available slots: ${availableSlots
      .filter((s) => s.available)
      .map((s) => s.time)
      .join(', ')}

Respond in JSON format with three arrays:
1. "insights" — brief observations about the current schedule (3-5 items)
2. "recommendations" — actionable suggestions to improve the day (2-4 items)
3. "optimizedSlots" — the best available slots to recommend to new clients

Keep each item concise (one sentence). Respond ONLY with valid JSON.`;

    const response = await this.chatCompletion(
      systemPrompt,
      `Optimize the schedule for ${date}`,
    );

    try {
      const parsed = JSON.parse(response);
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        optimizedSlots: Array.isArray(parsed.optimizedSlots)
          ? parsed.optimizedSlots
          : [],
      };
    } catch {
      this.logger.warn('Failed to parse AI optimization response');
      return {
        insights: [response],
        recommendations: [],
        optimizedSlots: [],
      };
    }
  }

  /**
   * Generate AI-powered dashboard insights from analytics data.
   * Uses GPT-4 to analyze trends, employee performance, and queue patterns.
   */
  async dashboardInsights(
    tenantId: string,
    analyticsData: Record<string, any>,
  ): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    topPerformers: string[];
    alerts: string[];
  }> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      return {
        summary: 'Tenant not found',
        insights: [],
        recommendations: [],
        topPerformers: [],
        alerts: [],
      };
    }

    const systemPrompt = `You are an AI analytics assistant for "${tenant.name}", a queue management system.
Analyze the provided dashboard data and generate actionable insights.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "A 1-2 sentence executive summary of today's performance",
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "topPerformers": ["observation about top staff/counters"],
  "alerts": ["any warnings or concerns"]
}

Keep each item concise (one sentence). Focus on actionable business intelligence.
Highlight patterns, anomalies, and optimization opportunities.`;

    const userPrompt = `Here is the current dashboard data:\n${JSON.stringify(analyticsData, null, 2)}\n\nProvide analysis and insights.`;

    const response = await this.chatCompletion(systemPrompt, userPrompt);

    try {
      const parsed = JSON.parse(response);
      return {
        summary: parsed.summary || '',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        topPerformers: Array.isArray(parsed.topPerformers)
          ? parsed.topPerformers
          : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      };
    } catch {
      this.logger.warn('Failed to parse AI dashboard insights response');
      return {
        summary: response,
        insights: [],
        recommendations: [],
        topPerformers: [],
        alerts: [],
      };
    }
  }

  /* ─── private helpers ─── */

  private buildSystemPrompt(tenant: any, todayAppointments: any[]): string {
    const profile = tenant.soloProfile || {};
    const booked = todayAppointments
      .filter((a) => a.status !== 'CANCELLED')
      .map((a) => `${a.timeSlot} - ${a.customerName} (${a.service})`)
      .join('\n');

    return `You are an intelligent scheduling assistant for "${tenant.name}".
Business type: ${profile.businessType || 'general'}
Services offered: ${(profile.services || []).join(', ') || 'various services'}
Slot duration: ${profile.slotDuration || 30} minutes

Today's booked appointments:
${booked || '  (no appointments yet)'}

Help the business owner with scheduling decisions, client management, and optimization.
Be concise, professional, and actionable. Answer in the same language as the user's prompt.`;
  }

  private async chatCompletion(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured — returning fallback');
      return 'AI suggestions require an OpenAI API key. Please add OPENAI_API_KEY to your environment variables.';
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        this.logger.error(`OpenAI API error: ${res.status} — ${errorBody}`);
        return 'AI service temporarily unavailable. Please try again later.';
      }

      const data = await res.json();
      return (
        data.choices?.[0]?.message?.content?.trim() ||
        'No suggestion available.'
      );
    } catch (error) {
      this.logger.error('OpenAI request failed', error);
      return 'Failed to connect to AI service. Check your network and API key.';
    }
  }
}
