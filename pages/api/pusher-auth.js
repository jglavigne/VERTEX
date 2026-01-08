// pages/api/pusher-auth.js


// export const config = {
//   api: {
//     bodyParser: true,
//   },
// };


import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default function handler(req, res) {
  try {
    const { socket_id, channel_name, user_id } = req.body;
// console.log("BODY:", req.body);
    // Presence channel → user_id obligatoire
    const authResponse = pusher.authorizeChannel(
      socket_id,
      channel_name,
      {
        user_id,
        user_info: {
          name: 'pusher-auth',
        },
      }
    );

    res.status(200).json(authResponse);
  } catch (err) {
    console.error("Pusher auth error:", err);
    res.status(500).json({ error: err.message });
  }
}
