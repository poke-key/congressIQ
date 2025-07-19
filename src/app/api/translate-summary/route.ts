import { NextRequest, NextResponse } from 'next/server';

async function callLLM(prompt: string, max_tokens = 1024) {
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
      max_tokens,
      temperature: 0.4
    })
  });
  if (!response.ok) {
    const err = await response.text();
    console.error('OpenRouter API error:', err);
    throw new Error('LLM API error: ' + err);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const { summary, fullText, title, sponsor, actions } = await request.json();
    if (!summary && !fullText) {
      return NextResponse.json({ error: 'Missing summary or fullText' }, { status: 400 });
    }
    // Always use fullText if available, otherwise fallback to summary
    const contextText = fullText && fullText.length > 0 ? fullText : (summary || '');
    // Build context prompt
    const contextParts = [];
    if (title) contextParts.push(`Title: ${title}`);
    if (sponsor) contextParts.push(`Sponsor: ${sponsor}`);
    if (actions && Array.isArray(actions) && actions.length > 0) {
      contextParts.push(`Recent Actions: ${actions.join('; ')}`);
    }
    contextParts.push(`Bill Text: ${contextText}`);
    const contextBlock = contextParts.join('\n');
    const prompt = `Here is the official title, sponsor, recent actions, and full text for a U.S. Congressional bill.\nPlease provide a detailed, plain-English analysis, including:\n- Main objectives and key provisions\n- Potential impact on businesses and the public\n- Any controversial or noteworthy aspects\n\n${contextBlock}`;
    const translation = await callLLM(prompt, 1024);
    return NextResponse.json({ translation });
  } catch (err) {
    console.error('API route error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error', details: err }, { status: 500 });
  }
}  