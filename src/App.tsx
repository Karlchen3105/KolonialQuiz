import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import { GameState } from './types';

// Connect to the same host that serves the page
const socket = io();

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Check if URL has ?host=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('host') === 'true') {
      setIsHost(true);
    }

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      socket.off('gameState');
    };
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-indigo-400">Verbinde zum Server...</div>
      </div>
    );
  }

  if (isHost) {
    return <HostView socket={socket} gameState={gameState} />;
  }

  return <PlayerView socket={socket} gameState={gameState} />;
}
