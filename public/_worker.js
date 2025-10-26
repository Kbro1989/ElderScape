export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/export') {
      const form = await request.formData();
      const file = form.get('file');
      const modelId = form.get('modelId');
      const type = form.get('type');

      const base64 = type === 'png' ? Buffer.from(await file.arrayBuffer()).toString('base64') : null;

      let description = '';
      if (type === 'png') {
        // Cloudflare AI for vision (free tier)
        const v = await env.AI.run('@cf/llava-1.5-7b-hf', {
          image: { base64 },
          prompt: `Describe RuneScape model ${modelId} in detail.`
        });
        description = v.response;
      }

      const wiki = await getWiki(modelId, env);
      // HF for lore (custom model)
      const loreRes = await fetch('https://api-inference.huggingface.co/models/NousResearch/Nous-Hermes-2-Mistral-7B-DPO', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Write RuneScape-style lore for model ${modelId}: ${description}. Wiki: ${wiki}`,
          parameters: { max_length: 120, temperature: 0.7 }
        })
      });
      const lore = await loreRes.json();
      const loreText = lore[0]?.generated_text || 'Lore error';

      const data = { modelId, description, lore: loreText, wiki, timestamp: Date.now() };
      await env.ELDERSCAPE_KV.put(`model:${modelId}`, JSON.stringify(data), { expirationTtl: 604800 });
      return Response.json(data);
    }
    return new Response('Not Found', { status: 404 });
  }
};

async function getWiki(id, env) {
  const cached = await env.ELDERSCAPE_KV.get(`wiki:${id}`);
  if (cached) return cached;
  const r = await fetch(`https://runescape.wiki/api.php?action=query&prop=extracts&format=json&titles=Model:${id}`);
  const j = await r.json();
  const extract = Object.values(j.query.pages)[0]?.extract || 'No info';
  await env.ELDERSCAPE_KV.put(`wiki:${id}`, extract);
  return extract;
}