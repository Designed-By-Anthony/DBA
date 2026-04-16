import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { role, text, sessionId } = await request.json();
    
    // We expect the frontend to pass role ('user' or 'bot') and text
    if (!text || !role) {
      return NextResponse.json({ error: 'Missing role or text' }, { status: 400, headers: corsHeaders });
    }

    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL || 'https://chat.googleapis.com/v1/spaces/AAQAwEtK-rw/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=JaiRunnqc5D6rkJKQbfnALufVrv73EiwNEHebSzPyMg';

    // Format the message for Google Chat
    const timeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
    const label = role === 'user' ? '👤 *Visitor*' : '🤖 *Tony AI*';
    const message = `${label} _(${timeStr})_\n${text}\n<font color="#9ca3af">_Session: ${sessionId || 'unknown'}_</font>`;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      })
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Chat webhook error:', error);
    return NextResponse.json(
      { error: 'Server error processing request.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
