import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json();
    if (!summary) {
      return NextResponse.json({ error: 'Missing summary' }, { status: 400 });
    }
    const prompt = `Rewrite the following bill summary in plain English, making it easy for anyone to understand. Avoid legal jargon.\n\nSummary: ${summary}`;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          { role: 'system', content: 'You are an expert at translating legal and government text into plain English.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter API error:', err);
      return NextResponse.json({ error: 'LLM API error', details: err }, { status: 500 });
    }
    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ translation });
  } catch (err: unknown) {
    console.error('API route error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error', details: err }, { status: 500 });
  }
} 