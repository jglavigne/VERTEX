import { useEffect } from 'react';
import * as Ably from 'ably';

export default function Home() {
  useEffect(() => {
    const ably = new Ably.Realtime({
      authUrl: '/api/ably-auth'
    });

    ably.connection.on('connected', () => {
      console.log('Connected to Ably!');
    });

    const channel = ably.channels.get('getting-started-widget');

    channel.subscribe('test', msg => {
        console.log('Realtime data:',msg.data);
        fetch(`/api/log?data=${encodeURIComponent(JSON.stringify(msg.data))}`);
    });

    return () => {
        ably.close(); // IMPORTANT pour la facturation
        console.log('ably.close');
        //fetch(`/api/log?data=ably.closedd`);
        fetch(`/api/log?data=${encodeURIComponent(JSON.stringify("ably.close"))}`);
  };
  }, []);

  return <h1>Live Dashboard getting-started-widget</h1>;
}
