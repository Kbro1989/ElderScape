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
        // Dynamic routing via Gateway (vision to LLaVA)
        const gatewayRes = await fetch('https://gateway.ai.cloudflare.com/v1/6872653edcee9c791787c1b783173793/pick-of-gods/dynamic/ElderScapeRoute', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer TU0ihCMTL4NVoVbGz-fw-Vbrf65HD8s_6vy7hAkL',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'vision', // Route to LLaVA
            image: { base64 },
            prompt: `Describe RuneScape model ${modelId} in detail.`
          })
        });
        const v = await gatewayRes.json();
        description = v.result?.response || v.response || 'Description error';
      }

      const wiki = await getWiki(modelId, env);
      // Dynamic routing for lore (to Hermes-Mistral)
      const loreRes = await fetch('https://gateway.ai.cloudflare.com/v1/6872653edcee9c791787c1b783173793/pick-of-gods/dynamic/ElderScapeRoute', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer TU0ihCMTL4NVoVbGz-fw-Vbrf65HD8s_6vy7hAkL',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'lore', // Route to Hermes-Mistral
          prompt: `Write RuneScape‑style lore for model ${modelId}: ${description}. Wiki info: ${wiki}`,
          max_tokens: 120
        })
      });
      const lore = await loreRes.json();
      const loreText = lore.result?.response || lore.response || 'Lore error';

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