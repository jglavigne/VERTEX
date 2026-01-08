import Ably from 'ably';

export default async function handler(req, res) {
  try {
    const ably = new Ably.Rest(process.env.ABLY_API_KEY);

    const channel = ably.channels.get('getting-started-widget');
    // await channel.publish('test', { data: 'world' });
    await channel.publish('test', 'world');
    res.status(200).json({ message: 'Message sent to Ably' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}