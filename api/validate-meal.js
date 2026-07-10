// Vercel serverless — validates a meal photo with Claude vision for the earn-a-premium-day loop.
// Inert (returns configured:false) until ANTHROPIC_API_KEY is set in Vercel env vars.
// Ethics (from the verified audit): returns a neutral band for REWARD gating only. The client must
// NOT show users a moralizing "junk/unhealthy" verdict — a non-healthy meal is simply logged with no
// reward and no negative label. No calorie/gram claims (2D photos are 15-25% off).

const PROMPT = `You validate a meal photo for a health app's reward system. Return ONLY compact JSON, no prose:
{"is_food":bool,"has_vegetable":bool,"has_protein":bool,"balanced":bool,"confidence":0..1,"band":"healthy"|"partial"|"not_a_plate"}
Guidance:
- Indian meals (thali, mixed curries, rice bowls, dals, sabzi+roti, khichdi) rarely separate into plate quarters — judge on the PRESENCE of vegetables and protein and rough overall balance, NOT literal proportions, or you will wrongly penalize legitimate meals.
- Do NOT moralize or label any food "good"/"bad"/"junk". No calorie or gram estimates.
- band = "healthy" if it is food AND has vegetables AND has protein AND is reasonably balanced.
- band = "partial" if it is food but missing a component or clearly unbalanced.
- band = "not_a_plate" if it is not food, or the image is too unclear to tell (set low confidence).`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(200).json({ configured: false, band: 'unknown' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  const imageUrl = body && body.imageUrl;
  if (!imageUrl) { res.status(400).json({ error: 'imageUrl required' }); return; }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: PROMPT }
        ] }]
      })
    });
    const j = await r.json();
    const text = (j.content && j.content[0] && j.content[0].text) || '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : {};
    // low confidence -> soft "review" (never fail-hard on a real user's healthy meal)
    if (parsed.band === 'healthy' && typeof parsed.confidence === 'number' && parsed.confidence < 0.55) parsed.band = 'partial';
    res.status(200).json({ configured: true, ...parsed });
  } catch (e) {
    res.status(200).json({ configured: true, band: 'review', error: 'validation_failed' });
  }
};
