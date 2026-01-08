// pages/api/pushersend.js
// import Pusher from "pusher";
const Pusher = require("pusher"); // require au lieu de import

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  try {
    // Publier sur le channel presence
    await pusher.trigger(
      "presence-getting-started-widget",
      "test",
      { data: "world" }
    );

    res.status(200).json({ message: "Message sent to Pusher" });
  } catch (err) {
    console.error("Pusher send error:", err);
    res.status(500).json({ error: err.message });
  }
}
