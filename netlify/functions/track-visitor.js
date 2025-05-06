exports.handler = async (event) => {
  const { headers } = event;
  const visitorIp = headers['client-ip'] || headers['x-forwarded-for'];
  
  // Aqui você salvaria o IP em um DB (ex.: FaunaDB, Supabase) ou cache (Redis)
  // Retorne um ID único baseado no IP ou gere um novo:
  return {
    statusCode: 200,
    body: JSON.stringify({ visitorId: visitorIp }),
  };
};
