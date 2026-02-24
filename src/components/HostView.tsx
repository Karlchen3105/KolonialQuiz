import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GameState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import { Users, Timer, Trophy, ArrowRight, Play, Image as ImageIcon } from 'lucide-react';

interface HostViewProps {
  socket: any;
  gameState: GameState;
}

export default function HostView({ socket, gameState }: HostViewProps) {
  const [timeRemaining, setTimeRemaining] = useState(gameState.timeRemaining);
  const appUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;

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

  const playersList = Object.values(gameState.players);
  const playerCount = playersList.length;

  const handleStart = () => socket.emit('hostAction', 'start');
  const handleNext = () => socket.emit('hostAction', 'nextQuestion');
  const handleShowResults = () => socket.emit('hostAction', 'showResults');
  const handleShowImage = () => socket.emit('hostAction', 'showImage');
  const handleReset = () => socket.emit('hostAction', 'reset');

  if (gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold tracking-tight">Quiz: Was ist Kolonialismus?</h1>
            <p className="text-xl text-slate-300">Tritt dem Spiel bei, indem du den QR-Code scannst oder die URL aufrufst.</p>
            
            <div className="bg-white p-6 rounded-2xl inline-block">
              <QRCodeSVG value={appUrl} size={256} />
            </div>
            
            <div className="text-2xl font-mono bg-slate-800 py-3 px-6 rounded-lg inline-block">
              {appUrl}
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-3xl p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                Spieler ({playerCount})
              </h2>
              {playerCount > 0 && (
                <button 
                  onClick={handleStart}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" /> Starten
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-3">
                {playersList.map((p, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={i} 
                    className="bg-slate-700 px-4 py-2 rounded-lg font-medium"
                  >
                    {p.name}
                  </motion.div>
                ))}
                {playerCount === 0 && (
                  <div className="text-slate-400 italic w-full text-center py-12">
                    Warte auf Spieler...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'question') {
    const answersCount = playersList.filter(p => p.currentAnswer !== null).length;
    
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
        <div className="flex justify-between items-center mb-12">
          <div className="text-2xl font-semibold text-slate-400">Frage {gameState.currentQuestionIndex + 1} von 6</div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-mono bg-slate-800 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-indigo-400" />
              {answersCount} / {playerCount} Antworten
            </div>
            <div className="flex items-center gap-2 text-3xl font-mono bg-slate-800 px-6 py-3 rounded-xl">
              <Timer className={`w-8 h-8 ${timeRemaining <= 5 ? 'text-red-500' : 'text-emerald-400'}`} />
              <span className={timeRemaining <= 5 ? 'text-red-500' : ''}>{timeRemaining}s</span>
            </div>
            <button 
              onClick={handleShowResults}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
            >
              Überspringen
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-center leading-tight mb-16">
            {gameState.question.question}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {gameState.question.options.map((opt, i) => (
              <div key={i} className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 text-2xl font-medium flex items-center">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mr-6 shrink-0 text-xl">
                  {['A', 'B', 'C', 'D'][i]}
                </div>
                {opt}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'results') {
    // Calculate results
    const results = gameState.question.options.map((opt, i) => ({
      name: ['A', 'B', 'C', 'D'][i],
      count: playersList.filter(p => p.currentAnswer === i).length,
      isCorrect: i === gameState.question.correctIndex
    }));

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-semibold text-slate-400">Ergebnisse</div>
          <div className="flex gap-4">
            <button 
              onClick={handleShowImage}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
            >
              <ImageIcon className="w-5 h-5" /> Bild zeigen
            </button>
            <button 
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
            >
              Nächste Frage <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-center mb-12">
            {gameState.question.question}
          </h2>
          
          <div className="w-full h-64 mb-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {results.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCorrect ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {gameState.question.options.map((opt, i) => (
              <div key={i} className={`rounded-xl p-6 text-xl font-medium flex items-center ${
                i === gameState.question.correctIndex 
                  ? 'bg-emerald-900/50 border-2 border-emerald-500 text-emerald-100' 
                  : 'bg-slate-800 opacity-50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 font-bold ${
                  i === gameState.question.correctIndex ? 'bg-emerald-500 text-white' : 'bg-slate-700'
                }`}>
                  {['A', 'B', 'C', 'D'][i]}
                </div>
                {opt}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'image') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-semibold text-slate-400">Hintergrundinformation</div>
          <button 
            onClick={handleNext}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
          >
            Nächste Frage <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-center mb-8">
            {gameState.question.imageTitle}
          </h2>
          <div className="bg-white p-4 rounded-2xl max-w-4xl w-full">
            <img 
              src={gameState.question.imageUrl} 
              alt={gameState.question.imageTitle} 
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'podium') {
    const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);
    const top3 = sortedPlayers.slice(0, 3);
    
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl font-bold mb-16 flex items-center gap-4">
          <Trophy className="w-16 h-16 text-yellow-400" />
          Siegerehrung
        </h1>
        
        <div className="flex items-end justify-center gap-4 md:gap-8 h-80 mb-16">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '60%', opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-32 md:w-48 bg-slate-400 rounded-t-2xl flex flex-col items-center justify-start pt-6 relative"
            >
              <div className="absolute -top-16 text-center">
                <div className="text-2xl font-bold truncate w-32">{top3[1].name}</div>
                <div className="text-slate-300 font-mono">{top3[1].score} pts</div>
              </div>
              <div className="text-6xl font-black text-slate-600">2</div>
            </motion.div>
          )}
          
          {/* 1st Place */}
          {top3[0] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '100%', opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="w-32 md:w-48 bg-yellow-400 rounded-t-2xl flex flex-col items-center justify-start pt-6 relative shadow-[0_0_50px_rgba(250,204,21,0.3)] z-10"
            >
              <div className="absolute -top-20 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2 drop-shadow-lg" />
                <div className="text-3xl font-bold truncate w-32">{top3[0].name}</div>
                <div className="text-yellow-200 font-mono">{top3[0].score} pts</div>
              </div>
              <div className="text-7xl font-black text-yellow-600">1</div>
            </motion.div>
          )}
          
          {/* 3rd Place */}
          {top3[2] && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '40%', opacity: 1 }}
              transition={{ delay: 0, duration: 0.8 }}
              className="w-32 md:w-48 bg-amber-700 rounded-t-2xl flex flex-col items-center justify-start pt-6 relative"
            >
              <div className="absolute -top-16 text-center">
                <div className="text-2xl font-bold truncate w-32">{top3[2].name}</div>
                <div className="text-amber-300 font-mono">{top3[2].score} pts</div>
              </div>
              <div className="text-6xl font-black text-amber-900">3</div>
            </motion.div>
          )}
        </div>
        
        <button 
          onClick={handleReset}
          className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-xl font-semibold text-xl transition-colors"
        >
          Neues Spiel
        </button>
      </div>
    );
  }

  return null;
}
