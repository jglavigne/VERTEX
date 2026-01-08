//pages/pushertest.js

import { useEffect } from "react";
import Pusher from "pusher-js";

export default function Home() {
  useEffect(() => {
    const userId = "dashboard-user-" + Math.floor(Math.random() * 1000);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher-auth",
      auth: {
        params: {
          user_id: userId, // envoyé au backend
        },
      },
    });

    // Presence Channel
    const channel = pusher.subscribe("presence-getting-started-widget");

    pusher.connection.bind("connected", () => {
      console.log("Socket ID:", pusher.connection.socket_id);
    });

    // Événement standard
    channel.bind("toto", (msg) => {
      console.log("Realtime data:", msg);
      fetch(`/api/log?data=${encodeURIComponent(JSON.stringify(msg))}`);
    });

    // Presence events
    channel.bind("pusher:subscription_succeeded", (members) => {
      console.log("Présence, membres connectés:", members);
    });
    channel.bind("pusher:member_added", (member) => {
      console.log("Membre ajouté:", member);
    });
    channel.bind("pusher:member_removed", (member) => {
      console.log("Membre retiré:", member);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("presence-getting-started-widget");
      console.log("pusher.unsubscribed");
      fetch(`/api/log?data=${encodeURIComponent(JSON.stringify("pusher.close"))}`);
    };
  }, []);

  return <h1>Live Dashboard presence-getting-started-widget</h1>;
}
