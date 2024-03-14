<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as socketio from 'socket.io-client';
	import { floatplaneState, wdbSocketState } from '$lib/stores.ts';

	import type { WanDb_FloatplaneData } from '$lib/wdb_types.ts';

	// Interface sent by the WDB websocket on connection
	interface WdbConnectState {
		version: string;
		features: number;
		state: WdbMessage;
	}

	// This is the message format that the WDB websocket sends to the client
	interface WdbMessage {
		live: boolean;
		isWAN: boolean;
		isAfterparty: boolean;
		title: string;
		description: string;
		thumbnail: {
			url: string;
			width: number;
			height: number;
			childImages: any[];
		};
		imminence: 0 | 1 | 2 | 3 | 4;
		sponsors: any[];
	}

	let socket: socketio.Socket | undefined;

	onMount(() => {
		socket = socketio.connect('wss://mq.thewandb.com', { transports: ['websocket'] });
		socket.on('connect', () => {
			console.debug('[wdb] Connected to WDB');
		});

		// Handle the connection message (which includes initial state)
		socket.on('state_sync', (data: WdbConnectState) => {
			console.debug('[wdb] Received State Sync message');
			console.debug('[wdb] Using WDB Protocol Version: ' + data.version);
			console.debug('[wdb] WDB Features: ' + data.features);
			floatplaneState.set(data.state as unknown as WanDb_FloatplaneData);
			if (!socket) return console.error('[wdb] Socket is undefined - unable to proceeed');
			socket.emit(
				'join',
				JSON.stringify({
					id: 'live'
				})
			);
		});

		// Handle the live state updates (revised for protocol 0.1.2)
		socket.on('live', (message: string) => {
			const body = JSON.parse(message) as WdbMessage;
			floatplaneState.set(body as unknown as WanDb_FloatplaneData);

			wdbSocketState.update((value) => {
				value.lastReceive = Date.now();
				return value;
			});
		});

		socket.on('disconnect', (code: number) => {
			console.debug('[wdb] Disconnected from WDB (with code: ' + code + ')');
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
			socket = undefined;
		}
	});
</script>
