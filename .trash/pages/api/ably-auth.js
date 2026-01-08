import Ably from 'ably';

export default async function handler(req, res) {
  try {
    const ably = new Ably.Rest(process.env.ABLY_API_KEY);

    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: 'dashboard-user'
    });

    res.status(200).json(tokenRequest);
  } catch (err) {
    console.error('Ably auth error:', err);
    res.status(500).json({ error: 'Ably auth failed' });
  }
}