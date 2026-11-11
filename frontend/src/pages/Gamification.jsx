import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Trophy, Zap, CheckCircle2, Star, 
  Crown, Medal, Play, RotateCcw, 
  Sparkles, Flame, Gift, Gamepad2, Shuffle, ArrowLeft, ArrowRight, Pause, RefreshCw
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Gamification({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('arcade');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(currentUser?.reward_points || 650);
  const { addToast } = useToast();

  // --------------------------------------------------------------------------
  // 1. VIP PASS CATCHER ARCADE GAME STATE
  // --------------------------------------------------------------------------
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(240);
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    paddleX: 180,
    paddleWidth: 80,
    items: [],
    score: 0,
    lives: 3,
    running: false,
    speed: 3
  });

  const awardUserPoints = (amount, activityName) => {
    setPointsBalance((prev) => prev + amount);
    fetch('http://127.0.0.1:5000/api/gamification/award-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser?.user_id || 1,
        points: amount,
        activity_name: activityName
      })
    }).catch(() => {});
  };

  const startArcadeGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameRunning(true);

    gameStateRef.current = {
      paddleX: 180,
      paddleWidth: 80,
      items: [],
      score: 0,
      lives: 3,
      running: true,
      speed: 3
    };
  };

  const movePaddle = (dir) => {
    if (!gameStateRef.current.running) return;
    if (dir === 'left') {
      gameStateRef.current.paddleX = Math.max(0, gameStateRef.current.paddleX - 40);
    } else if (dir === 'right') {
      gameStateRef.current.paddleX = Math.min(360, gameStateRef.current.paddleX + 40);
    }
  };

  // Keyboard controls for Arcade game
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') movePaddle('left');
      if (e.key === 'ArrowRight') movePaddle('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (!gameRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let spawnTimer = 0;

    const gameLoop = () => {
      const state = gameStateRef.current;
      if (!state.running) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn falling item
      spawnTimer++;
      if (spawnTimer > 40) {
        spawnTimer = 0;
        const types = [
          { symbol: '🎟️', points: 10, isBomb: false },
          { symbol: '🏆', points: 25, isBomb: false },
          { symbol: '⭐', points: 50, isBomb: false },
          { symbol: '💣', points: 0, isBomb: true }
        ];
        const randomType = types[Math.floor(Math.random() * types.length)];
        state.items.push({
          x: Math.floor(Math.random() * (canvas.width - 30)),
          y: 0,
          ...randomType
        });
      }

      // Draw & update paddle
      ctx.fillStyle = '#0A84FF';
      ctx.shadowColor = '#0A84FF';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(state.paddleX, canvas.height - 24, state.paddleWidth, 16, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw & update items
      ctx.font = '22px sans-serif';
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        item.y += state.speed;

        // Render emoji
        ctx.fillText(item.symbol, item.x, item.y);

        // Check catch collision
        if (
          item.y >= canvas.height - 35 &&
          item.y <= canvas.height - 10 &&
          item.x + 20 >= state.paddleX &&
          item.x <= state.paddleX + state.paddleWidth
        ) {
          if (item.isBomb) {
            state.lives -= 1;
            setLives(state.lives);
            if (state.lives <= 0) {
              state.running = false;
              setGameRunning(false);
              setGameOver(true);
              const ptsEarned = Math.floor(state.score / 2);
              if (ptsEarned > 0) {
                awardUserPoints(ptsEarned, 'VIP Pass Catcher Arcade');
                addToast(`🎮 Game Over! Earned +${ptsEarned} Reward Points!`, 'success');
              }
              if (state.score > highScore) setHighScore(state.score);
            }
          } else {
            state.score += item.points;
            setScore(state.score);
          }
          state.items.splice(i, 1);
          continue;
        }

        // Remove item if hit bottom
        if (item.y > canvas.height) {
          state.items.splice(i, 1);
        }
      }

      if (state.running) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameRunning]);

  // --------------------------------------------------------------------------
  // 2. SPIN THE WHEEL STATE
  // --------------------------------------------------------------------------
  const [spinning, setSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelPrize, setWheelPrize] = useState(null);

  const wheelSlices = [
    { label: '50 Pts', points: 50, color: '#0A84FF' },
    { label: '100 Pts', points: 100, color: '#30D158' },
    { label: '25 Pts', points: 25, color: '#5E5CE6' },
    { label: '500 Pts JACKPOT', points: 500, color: '#FF9F0A' },
    { label: '75 Pts', points: 75, color: '#64D2FF' },
    { label: 'Double Perks', points: 200, color: '#BF5AF2' },
    { label: '150 Pts', points: 150, color: '#FF375F' },
    { label: '30 Pts', points: 30, color: '#8E8E93' }
  ];

  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setWheelPrize(null);

    const randomIndex = Math.floor(Math.random() * wheelSlices.length);
    const selectedSlice = wheelSlices[randomIndex];
    const degreesPerSlice = 360 / wheelSlices.length;
    const targetDegree = 360 * 5 + (360 - (randomIndex * degreesPerSlice + degreesPerSlice / 2));

    setWheelAngle(targetDegree);

    setTimeout(() => {
      setSpinning(false);
      setWheelPrize(selectedSlice);
      awardUserPoints(selectedSlice.points, 'Spin the Wheel');
      addToast(`🎉 Wheel landed on ${selectedSlice.label}! Earned +${selectedSlice.points} pts!`, 'success');
    }, 4000);
  };

  // --------------------------------------------------------------------------
  // 3. MEMORY MATCH GAME STATE
  // --------------------------------------------------------------------------
  const initialCards = [
    { id: 1, name: 'VIP Ticket', icon: '🎟️' },
    { id: 2, name: 'Electric Guitar', icon: '🎸' },
    { id: 3, name: 'Esports Controller', icon: '🎮' },
    { id: 4, name: 'Golden Trophy', icon: '🏆' },
    { id: 5, name: 'Stage Spotlight', icon: '💡' },
    { id: 6, name: 'DJ Headphones', icon: '🎧' },
  ];
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [memoryWon, setMemoryWon] = useState(false);

  const initMemoryGame = () => {
    const duplicated = [...initialCards, ...initialCards].map((item, index) => ({
      ...item,
      uniqueId: index
    }));
    const shuffled = duplicated.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setMemoryWon(false);
  };

  const handleCardClick = (uniqueId) => {
    if (flippedCards.length === 2 || flippedCards.includes(uniqueId)) return;
    const clickedCard = cards.find((c) => c.uniqueId === uniqueId);
    if (matchedPairs.includes(clickedCard.id)) return;

    const newFlipped = [...flippedCards, uniqueId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = cards.find((c) => c.uniqueId === newFlipped[0]);
      const secondCard = cards.find((c) => c.uniqueId === newFlipped[1]);

      if (firstCard.id === secondCard.id) {
        setMatchedPairs((prev) => {
          const updated = [...prev, firstCard.id];
          if (updated.length === initialCards.length) {
            setMemoryWon(true);
            awardUserPoints(100, 'Memory Match Mastery');
            addToast('🏆 You matched all cards! Earned +100 bonus points!', 'success');
          }
          return updated;
        });
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4. WORD SCRAMBLE GAME STATE
  // --------------------------------------------------------------------------
  const scrambleList = [
    { original: 'FESTIVAL', scrambled: 'FEISTVAL', hint: 'Large outdoor music event' },
    { original: 'BACKSTAGE', scrambled: 'BKACSTGAE', hint: 'Behind the main stage area' },
    { original: 'HEADLINER', scrambled: 'HDELAINER', hint: 'The main attraction artist' },
    { original: 'VIPPASS', scrambled: 'SSAPPIV', hint: 'Exclusive venue access ticket' },
    { original: 'CONCERT', scrambled: 'CNROETC', hint: 'Live musical performance' }
  ];
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleCheckScramble = () => {
    const currentWord = scrambleList[scrambleIndex];
    if (userGuess.trim().toUpperCase() === currentWord.original) {
      awardUserPoints(40, 'Word Scramble');
      addToast(`✨ Unscrambled correctly! +40 Pts earned!`, 'success');
      setUserGuess('');
      setShowHint(false);
      setScrambleIndex((scrambleIndex + 1) % scrambleList.length);
    } else {
      addToast('Not quite right. Check your spelling and try again!', 'error');
    }
  };

  // Fetch Leaderboard & Badges
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/gamification/leaderboard')
      .then((res) => res.json())
      .then((res) => setLeaderboard(res.leaderboard || []))
      .catch(() => {});

    const userId = currentUser?.user_id || 1;
    fetch(`http://127.0.0.1:5000/api/gamification/user/${userId}/badges`)
      .then((res) => res.json())
      .then((res) => setUserBadges(res.badges || []))
      .catch(() => {});

    initMemoryGame();
  }, [currentUser]);

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      
      {/* Apple-Style Glass Header Banner */}
      <div className="apple-glass-card rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 apple-glow-blue">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-black text-white tracking-tight">Smart Arcade</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-[10px] font-mono text-blue-300 font-bold uppercase tracking-wider">
                  Arcade V2
                </span>
              </div>
              <p className="text-neutral-400 text-xs mt-1">
                Play mini-games, earn reward points, and unlock VIP perks across all events!
              </p>
            </div>
          </div>

          {/* Apple-Style Loyalty Balance Pill */}
          <div className="flex items-center space-x-6 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80">
            <div>
              <div className="text-[11px] font-mono text-neutral-400">Loyalty Status</div>
              <div className="text-xl font-bold text-amber-400 flex items-center space-x-1">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Gold Member</span>
              </div>
            </div>
            <div className="pl-6 border-l border-neutral-800">
              <div className="text-[11px] font-mono text-neutral-400">Reward Balance</div>
              <div className="text-2xl font-black text-blue-400 font-mono">{pointsBalance} Pts</div>
            </div>
          </div>

        </div>

        {/* Apple Activity Rings Progress Bar */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Arcade XP Progress (82% to Level 8 Master)</span>
            <span className="text-blue-400 font-bold">2,050 / 2,500 XP</span>
          </div>
          <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-800/80 p-0.5">
            <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '82%' }} />
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800/60">
          {[
            { id: 'arcade', label: 'VIP Pass Catcher', icon: Gamepad2, color: 'text-blue-400' },
            { id: 'wheel', label: 'Spin the Wheel', icon: Sparkles, color: 'text-amber-400' },
            { id: 'memory', label: 'Card Memory Match', icon: Trophy, color: 'text-emerald-400' },
            { id: 'scramble', label: 'Word Scramble', icon: Shuffle, color: 'text-purple-400' },
            { id: 'quests', label: 'Daily Activity Rings', icon: Flame, color: 'text-rose-400' },
            { id: 'leaderboard', label: 'Leaderboard', icon: Crown, color: 'text-amber-300' },
            { id: 'badges', label: 'Badge Vault', icon: Award, color: 'text-cyan-300' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg apple-glow-blue' 
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. VIP PASS CATCHER ARCADE MINI-GAME TAB */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'arcade' && (
        <div className="apple-glass-card rounded-3xl p-8 space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center justify-center space-x-2">
              <Gamepad2 className="w-6 h-6 text-blue-400" />
              <span>VIP Pass Catcher Arcade</span>
            </h2>
            <p className="text-neutral-400 text-xs font-mono">
              Catch VIP Passes (🎟️), Trophies (🏆) & Stars (⭐) while dodging Bombs (💣)!
            </p>
          </div>

          <div className="flex justify-between items-center max-w-md mx-auto bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800/80 text-xs font-mono">
            <div>Score: <span className="text-blue-400 font-extrabold text-base">{score}</span></div>
            <div>Lives: <span className="text-rose-400 text-base">{Array(lives).fill('❤️').join(' ')}</span></div>
            <div>High Score: <span className="text-amber-400 font-bold">{highScore}</span></div>
          </div>

          {/* Interactive Canvas Arcade Stage */}
          <div className="relative w-[440px] h-[340px] mx-auto bg-neutral-950 rounded-3xl border-2 border-neutral-800 overflow-hidden shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={440}
              height={340}
              className="w-full h-full"
            />

            {!gameRunning && !gameOver && (
              <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-2xl font-bold">
                  🎮
                </div>
                <div className="text-lg font-bold text-white">Press Start to Play</div>
                <p className="text-neutral-400 text-xs max-w-xs text-center font-mono">
                  Use Left & Right Arrow keys (or the on-screen buttons below) to catch passes!
                </p>
                <button
                  onClick={startArcadeGame}
                  className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl apple-glow-blue"
                >
                  Start Game
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4">
                <div className="text-3xl font-black text-rose-400">Game Over</div>
                <div className="text-neutral-300 text-xs font-mono">
                  Final Score: <strong className="text-blue-400 text-base">{score}</strong>
                </div>
                <div className="text-emerald-400 text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                  🎁 Earned +{Math.floor(score / 2)} Reward Points!
                </div>
                <button
                  onClick={startArcadeGame}
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* On-Screen Touch / Button Controls */}
          <div className="flex justify-center space-x-4 pt-2">
            <button
              onClick={() => movePaddle('left')}
              className="px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-lg flex items-center space-x-2 active:scale-95 transition-all shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
              <span>Left</span>
            </button>

            <button
              onClick={() => movePaddle('right')}
              className="px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-lg flex items-center space-x-2 active:scale-95 transition-all shadow-lg"
            >
              <span>Right</span>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. SPIN THE WHEEL TAB */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'wheel' && (
        <div className="apple-glass-card rounded-3xl p-8 space-y-8 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center justify-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Spin the Wheel of Fortune</span>
            </h2>
            <p className="text-neutral-400 text-xs font-mono">
              Spin daily to win instant reward points and jackpot prizes!
            </p>
          </div>

          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
            <div className="absolute -top-4 z-20 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-md" />

            <div 
              style={{
                transform: `rotate(${wheelAngle}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1.0)' : 'none'
              }}
              className="w-full h-full rounded-full border-4 border-neutral-700 shadow-2xl relative overflow-hidden bg-neutral-950 flex items-center justify-center"
            >
              {wheelSlices.map((slice, i) => {
                const angle = (360 / wheelSlices.length) * i;
                return (
                  <div
                    key={i}
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                    className="absolute w-full h-full flex items-start justify-center pt-3"
                  >
                    <div 
                      style={{ color: slice.color }} 
                      className="text-xs font-black font-mono tracking-tighter uppercase transform -rotate-90 bg-neutral-900/90 px-2 py-0.5 rounded border border-neutral-800"
                    >
                      {slice.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-xs font-black text-amber-400 font-mono">
                SPIN!
              </div>
            </div>
          </div>

          <div className="max-w-xs mx-auto space-y-4">
            <button
              disabled={spinning}
              onClick={handleSpinWheel}
              className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-sm tracking-wider uppercase transition-all apple-glow-blue shadow-xl"
            >
              {spinning ? 'Spinning...' : 'Spin Wheel Now'}
            </button>

            {wheelPrize && (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/40 text-amber-300 text-xs font-mono animate-bounce">
                🎉 Landed on <strong>{wheelPrize.label}</strong>! Earned +{wheelPrize.points} pts!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. CARD MEMORY MATCH TAB */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'memory' && (
        <div className="apple-glass-card rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>Event Memory Match</span>
              </h2>
              <p className="text-neutral-400 text-xs font-mono mt-0.5">
                Match identical event icons to earn +100 bonus points!
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-xs font-mono text-neutral-400">
                Moves: <span className="text-blue-400 font-bold text-sm">{moves}</span>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Matched: <span className="text-emerald-400 font-bold text-sm">{matchedPairs.length} / {initialCards.length}</span>
              </div>
              <button
                onClick={initMemoryGame}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-blue-300 border border-neutral-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {cards.map((card) => {
              const isFlipped = flippedCards.includes(card.uniqueId);
              const isMatched = matchedPairs.includes(card.id);

              return (
                <button
                  key={card.uniqueId}
                  disabled={isFlipped || isMatched}
                  onClick={() => handleCardClick(card.uniqueId)}
                  className={`h-28 rounded-2xl text-2xl flex flex-col items-center justify-center transition-all duration-300 transform ${
                    isMatched
                      ? 'bg-emerald-950/60 border-2 border-emerald-500/60 opacity-80 scale-95'
                      : isFlipped
                      ? 'bg-blue-600 border-2 border-cyan-400 text-white scale-105 shadow-xl apple-glow-blue'
                      : 'bg-neutral-950/80 border border-neutral-800 hover:border-blue-500/60 text-transparent'
                  }`}
                >
                  {(isFlipped || isMatched) ? (
                    <>
                      <span>{card.icon}</span>
                      <span className="text-[10px] font-mono text-neutral-200 mt-1 font-bold">{card.name}</span>
                    </>
                  ) : (
                    <Sparkles className="w-6 h-6 text-neutral-700" />
                  )}
                </button>
              );
            })}
          </div>

          {memoryWon && (
            <div className="p-6 rounded-3xl bg-neutral-950 border border-emerald-500/50 text-center space-y-3">
              <div className="text-2xl font-black text-emerald-400">🎉 Memory Challenge Completed!</div>
              <p className="text-neutral-300 text-xs font-mono">Solved in {moves} moves! +100 Points awarded.</p>
              <button
                onClick={initMemoryGame}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. WORD SCRAMBLE TAB */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'scramble' && (
        <div className="apple-glass-card rounded-3xl p-8 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center justify-center space-x-2">
              <Shuffle className="w-5 h-5 text-purple-400" />
              <span>Event Word Scramble</span>
            </h2>
            <p className="text-neutral-400 text-xs font-mono">Unscramble event terms to earn +40 points per word!</p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-4">
            <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
              Word {scrambleIndex + 1} of {scrambleList.length}
            </div>

            <div className="text-3xl font-black font-mono tracking-widest text-blue-400 py-2">
              {scrambleList[scrambleIndex].scrambled}
            </div>

            {showHint && (
              <div className="text-xs text-amber-300 font-mono bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                💡 Hint: {scrambleList[scrambleIndex].hint}
              </div>
            )}

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type unscrambled word..."
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCheckScramble(); }}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCheckScramble}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Submit
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs font-mono">
              <button onClick={() => setShowHint(!showHint)} className="text-amber-400 hover:underline">
                {showHint ? 'Hide Hint' : 'Need a Hint?'}
              </button>

              <button onClick={() => setScrambleIndex((scrambleIndex + 1) % scrambleList.length)} className="text-blue-400 hover:underline">
                Next Word ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. DAILY ACTIVITY RINGS & QUESTS TAB */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'quests' && (
        <div className="apple-glass-card rounded-3xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>Apple Activity Rings & Daily Quests</span>
            </h2>
            <p className="text-neutral-400 text-xs font-mono">
              Close your daily event rings by playing games and completing check-ins!
            </p>
          </div>

          {/* Activity Ring Visual Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="text-xs font-mono text-rose-400 uppercase font-bold">Move Ring</div>
              <div className="text-xl font-black text-white">Daily Check-In</div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full w-full" />
              </div>
              <div className="text-[11px] font-mono text-neutral-400">Completed (+20 Pts)</div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="text-xs font-mono text-emerald-400 uppercase font-bold">Exercise Ring</div>
              <div className="text-xl font-black text-white">Arcade Master</div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[80%]" />
              </div>
              <div className="text-[11px] font-mono text-neutral-400">80% Progress (+50 Pts)</div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="text-xs font-mono text-blue-400 uppercase font-bold">Stand Ring</div>
              <div className="text-xl font-black text-white">Wheel Spinner</div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-full" />
              </div>
              <div className="text-[11px] font-mono text-neutral-400">Completed (+30 Pts)</div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. LEADERBOARD & BADGE VAULT TABS */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'leaderboard' && (
        <div className="apple-glass-card rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Global Loyalty Leaderboard</span>
            </h2>
            <span className="text-xs font-mono text-neutral-400">Live Rankings</span>
          </div>

          <div className="space-y-3">
            {(leaderboard.length > 0 ? leaderboard : [
              { user_id: 1, full_name: 'Midhu User', reward_points: 650, loyalty_level: 'Gold', global_rank: 1 },
              { user_id: 2, full_name: 'David Kim', reward_points: 1200, loyalty_level: 'Platinum', global_rank: 2 },
              { user_id: 3, full_name: 'Emily Watson', reward_points: 280, loyalty_level: 'Silver', global_rank: 3 }
            ]).map((item) => (
              <div key={item.user_id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-xs font-mono">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    item.global_rank === 1 ? 'bg-amber-500 text-black' :
                    item.global_rank === 2 ? 'bg-neutral-300 text-black' :
                    item.global_rank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    #{item.global_rank}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.full_name}</div>
                    <div className="text-neutral-500">{item.loyalty_level} Member</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-amber-400 font-mono">{item.reward_points} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'badges' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Medal className="w-5 h-5 text-blue-400" />
            <span>Unlocked Badge Vault</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(userBadges.length > 0 ? userBadges : [
              { badge_id: 1, badge_name: 'Early Tech Pioneer', coupon_code: 'TECHGURU15', unlocked_at: '2026-08-20' },
              { badge_id: 2, badge_name: 'VIP Connoisseur', coupon_code: 'VIPELITE20', unlocked_at: '2026-08-25' }
            ]).map((badge) => (
              <div key={badge.badge_id} className="apple-glass-card rounded-3xl p-6 space-y-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 mx-auto apple-glow-blue">
                  <Award className="w-7 h-7" />
                </div>
                <div className="text-base font-bold text-white">{badge.badge_name}</div>
                <div className="text-xs font-mono text-cyan-400">Coupon: {badge.coupon_code}</div>
                <div className="text-[10px] font-mono text-neutral-500">Unlocked: {new Date(badge.unlocked_at || Date.now()).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
