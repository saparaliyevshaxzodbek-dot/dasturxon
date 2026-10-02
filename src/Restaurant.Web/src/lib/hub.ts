import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { getToken } from '../api/client';
import type { Order, OrderTracking } from '../api/types';

export type LiveState = 'connecting' | 'live' | 'offline';

function buildConnection(withToken: boolean): HubConnection {
  return new HubConnectionBuilder()
    .withUrl('/hubs/orders', withToken ? { accessTokenFactory: () => getToken() ?? '' } : {})
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    // Aborted handshakes from React StrictMode's double mount are expected, so errors aren't logged.
    .configureLogging(LogLevel.None)
    .build();
}

function useLiveState(connection: HubConnection | null): [LiveState, (s: LiveState) => void] {
  const [state, setState] = useState<LiveState>('connecting');
  useEffect(() => {
    if (!connection) return;
    connection.onreconnecting(() => setState('connecting'));
    connection.onreconnected(() => setState('live'));
    connection.onclose(() => setState('offline'));
  }, [connection]);
  return [state, setState];
}

/** Staff screens: receives every new and changed order in real time. */
export function useStaffOrderEvents(handlers: {
  onCreated?: (order: Order) => void;
  onUpdated?: (order: Order) => void;
}): LiveState {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [state, setState] = useLiveState(connection);

  useEffect(() => {
    const hub = buildConnection(true);
    // Handlers must return nothing: SignalR treats a returned value as a client result.
    hub.on('OrderCreated', (order: Order) => {
      handlersRef.current.onCreated?.(order);
    });
    hub.on('OrderUpdated', (order: Order) => {
      handlersRef.current.onUpdated?.(order);
    });
    setConnection(hub);

    let disposed = false;
    hub
      .start()
      .then(() => !disposed && setState('live'))
      .catch(() => !disposed && setState('offline'));

    return () => {
      disposed = true;
      void hub.stop();
    };
  }, [setState]);

  return state;
}

/** Customer tracking page: subscribes to one order, identified by its number and phone. */
export function useOrderTracking(
  orderId: number,
  phone: string | null,
  onChange: (order: OrderTracking) => void,
): LiveState {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [state, setState] = useLiveState(connection);

  useEffect(() => {
    if (!phone) return;
    const hub = buildConnection(false);
    const subscribe = () =>
      hub.invoke<OrderTracking>('TrackOrder', orderId, phone).then((order) => onChangeRef.current(order));

    hub.on('OrderStatusChanged', (order: OrderTracking) => {
      onChangeRef.current(order);
    });
    // Groups are per connection, so a reconnect has to subscribe again.
    hub.onreconnected(() => {
      void subscribe();
    });
    setConnection(hub);

    let disposed = false;
    hub
      .start()
      .then(subscribe)
      .then(() => !disposed && setState('live'))
      .catch(() => {
        if (!disposed && hub.state !== HubConnectionState.Connected) setState('offline');
      });

    return () => {
      disposed = true;
      void hub.stop();
    };
  }, [orderId, phone, setState]);

  return state;
}

/** Short two-tone chime for new orders; the kitchen can hear it across the room. */
export function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Audio blocked until the user interacts with the page; the visual highlight still shows.
  }
}
