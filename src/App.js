import { generatePrivateKey, getEventHash, getPublicKey, relayInit, signEvent } from "nostr-tools";
import { useEffect, useState } from "react";

function App() {
  const [sk, setSk] = useState(generatePrivateKey());
  const [pk, setPk] = useState(getPublicKey(sk));
  const [relay, setRelay] = useState(null);
  const [pubStatus, setPubStatus] = useState("");
  const [newEvent, setNewEvent] = useState(null);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    const connectRelay = async () => {
      const relay = relayInit("wss://relay.damus.io");
      await relay.connect();

      relay.on("connect", () => {
        setRelay(relay);
      });
      relay.on("error", () => {
        console.log("failed to connect");
      });
    };

    connectRelay();
  });

  var event = {
    kind: 1,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: "We are testing nostr in react"
  }

  event.id = getEventHash(event);
  event.sig = signEvent(event, sk);

  const publishEvent = (event) => {
    const pub = relay.publish(event);
    
    pub.on("ok", () =>{
      setPubStatus("our event is published");
    })
    pub.on("failed", reason => {
      setPubStatus(`failed to publish message ${reason}`)
    })
  }

  const getEvent = async () => {
    var sub = relay.sub([{
      kinds: [1],
      authors: [pk]
    }])
    sub.on("event", event => {
      setNewEvent(event)
    })
  }

  const getEvents = async () => {
    var events = await relay.list([{
      kinds: [1]
    }])
    setEvents(events);
  }

  return (
    <div>
      <p>private key: {sk}</p>
      <p>public key: {pk}</p>
      {relay ? (
        <p>Connected to {relay.url}</p>
      ) : (
        <p>Could not connect to relay</p>
      )}
      <button onClick={(() => publishEvent(event))}>Publish event</button>
      <p>Publish status: {pubStatus}</p>
      <button onClick={(() => getEvent())}>subscribe event</button>
      {newEvent ? <p>Subscribed event content: {newEvent.content}</p> : <p>no new event</p>}
      <button onClick={(() => getEvents())}>load feedt</button>
      {events !== null &&
      events.map((event) =>
      <p key={event.sig} style={{borderStyle: "ridge", padding: 10}}>{event.content}</p>
      )
      }
    </div>
  );
}

export default App;
