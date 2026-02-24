import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';

interface PlayerViewProps {
  socket: any;
  gameState: GameState;
}

export default function PlayerView({ socket, gameState }: PlayerViewProps) {
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(gameState.timeRemaining);

  useEffect(() => {
    socket.on('timeUpdate', (time: number) => {
      setTimeRemaining(time);
    });
    return () => {
      socket.off('timeUpdate');
    };
  }, [socket]);

  useEffect(() => {
    setTimeRemaining(gameState.timeRemaining);
  }, [gameState.timeRemaining]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      socket.emit('join', name.trim());
      setHasJoined(true);
    }
  };

  const handleAnswer = (index: number) => {
    socket.emit('answer', index);
  };

  const me = gameState.players[socket.id];

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md bg-slate-800 p-8 rounded-3xl shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-center mb-8">Quiz Beitreten</h1>
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-2">
                Dein Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="z.B. QuizMaster99"
                maxLength={15}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              Los geht's!
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Bist du bereit, {me?.name}?</h2>
          <p className="text-slate-400 text-lg">Warte auf den Host, um das Spiel zu starten...</p>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'question') {
    const hasAnswered = me?.currentAnswer !== null;

    if (hasAnswered) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Antwort eingeloggt!</h2>
            <p className="text-slate-400 text-lg">Warte auf die anderen Spieler...</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4">
        <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-2xl">
          <div className="font-semibold text-slate-300">{me?.name}</div>
          <div className="flex items-center gap-2 font-mono text-xl">
            <Clock className={`w-6 h-6 ${timeRemaining <= 5 ? 'text-red-500' : 'text-indigo-400'}`} />
            <span className={timeRemaining <= 5 ? 'text-red-500' : ''}>{timeRemaining}</span>
          </div>
          <div className="font-bold text-indigo-400">{me?.score} pts</div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 gap-4">
          {gameState.question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 border-2 border-slate-700 active:border-indigo-500 rounded-2xl p-6 text-xl font-medium flex items-center transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mr-4 shrink-0 text-xl font-bold">
                {['A', 'B', 'C', 'D'][i]}
              </div>
              <span className="text-left">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState.status === 'results' || gameState.status === 'image') {
    const isCorrect = me?.currentAnswer === gameState.question.correctIndex;
    const didAnswer = me?.currentAnswer !== null;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${
        !didAnswer ? 'bg-slate-900' : isCorrect ? 'bg-emerald-900' : 'bg-red-900'
      } text-white`}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          {!didAnswer ? (
            <>
              <Clock className="w-24 h-24 text-slate-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Zeit abgelaufen</h2>
              <p className="text-xl text-slate-300">Du warst leider zu langsam!</p>
            </>
          ) : isCorrect ? (
            <>
              <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4 text-emerald-100">Richtig!</h2>
              <p className="text-xl text-emerald-200">Gut gemacht, {me?.name}!</p>
            </>
          ) : (
            <>
              <XCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4 text-red-100">Falsch!</h2>
              <p className="text-xl text-red-200">Das war leider nicht richtig.</p>
            </>
          )}
          
          <div className="mt-12 bg-black/20 rounded-2xl p-6 inline-block">
            <div className="text-sm text-white/60 uppercase tracking-widest mb-1">Dein Score</div>
            <div className="text-5xl font-mono font-bold">{me?.score}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState.status === 'podium') {
    const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.name === me?.name) + 1;
    
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <Trophy className={`w-24 h-24 mx-auto mb-8 ${
          myRank === 1 ? 'text-yellow-400' : 
          myRank === 2 ? 'text-slate-400' : 
          myRank === 3 ? 'text-amber-700' : 'text-indigo-400'
        }`} />
        
        <h2 className="text-3xl font-bold mb-2">Spiel Beendet!</h2>
        <p className="text-xl text-slate-400 mb-12">Du hast den {myRank}. Platz erreicht!</p>
        
        <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-sm">
          <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">Endstand</div>
          <div className="text-6xl font-mono font-bold text-indigo-400">{me?.score}</div>
          <div className="text-slate-500 mt-2">Punkte</div>
        </div>
      </div>
    );
  }

  return null;
}
