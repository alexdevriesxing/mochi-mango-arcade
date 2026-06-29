export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({ ok: true, name: 'Mochi Mango Arcade' });
    if (url.pathname === '/api/games') return env.ASSETS.fetch(new Request(new URL('/assets/data/games.json', url)));
    if (url.pathname === '/api/products') return env.ASSETS.fetch(new Request(new URL('/assets/data/products.json', url)));
    if (url.pathname.startsWith('/api/game/')) {
      const slug = url.pathname.split('/').pop();
      const games = await (await env.ASSETS.fetch(new Request(new URL('/assets/data/games.json', url)))).json();
      const game = games.find(g => g.slug === slug);
      return Response.json(game || null, { status: game ? 200 : 404 });
    }
    return env.ASSETS.fetch(request);
  }
};
