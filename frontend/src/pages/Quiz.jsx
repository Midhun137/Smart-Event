import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Clock, CheckCircle2, XCircle, ArrowRight, Award, Sparkles, Trophy, Zap, RotateCcw } from 'lucide-react';
import { Footer } from '../components/ProductUI';
import { useAuth } from '../context/AuthContext';

const Quiz = () => {
  const { user } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);

  const availableQuizzes = [
    {
      id: 1,
      title: 'SmartEvent Blockbuster Trivia',
      description: 'Test your knowledge on legendary film directors, cinema sound formats, and box office spectacles.',
      xpReward: 150,
      timeLimit: '5 mins',
      questionsCount: 3,
      questions: [
        {
          id: 1,
          question: 'Which sound format is renowned for providing multi-dimensional spatial overhead audio in modern cinema?',
          options: ['Dolby Atmos', 'Mono 1.0', 'Stereo 8-Track', 'AM Radio'],
          correctIndex: 0
        },
        {
          id: 2,
          question: 'In an IMAX dual laser auditorium, what is a primary visual enhancement?',
          options: ['Higher Contrast & Rec.2020 Color Range', 'Black & White Only', 'Standard Definition 480p', 'Lower Brightness'],
          correctIndex: 0
        },
        {
          id: 3,
          question: 'Denis Villeneuve is the acclaimed visionary director behind which sci-fi epic saga?',
          options: ['Dune', 'Fast & Furious', 'Transformers', 'Jurassic World'],
          correctIndex: 0
        }
      ]
    },
    {
      id: 2,
      title: 'Stadium Music & Concerts Challenge',
      description: 'How well do you know famous stadium arena concerts, viral tracks, and live music history?',
      xpReward: 200,
      timeLimit: '4 mins',
      questionsCount: 3,
      questions: [
        {
          id: 1,
          question: 'Which music composer won Academy Awards for Slumdog Millionaire?',
          options: ['A. R. Rahman', 'Hans Zimmer', 'John Williams', 'Ludwig Göransson'],
          correctIndex: 0
        },
        {
          id: 2,
          question: 'Rockstar Anirudh Ravichander created which viral stadium anthem for the film Jailer?',
          options: ['Hukum (Tiger Ka Hukum)', 'Why This Kolaveri', 'Arabic Kuthu', 'Badass'],
          correctIndex: 0
        },
        {
          id: 3,
          question: 'Which viral chartbuster launched artist Sai Abhyankkar to national acclaim?',
          options: ['Katchi Sera', 'Rowdy Baby', 'Enjoy Enjaami', 'Vaathi Coming'],
          correctIndex: 0
        }
      ]
    }
  ];

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setXpAwarded(0);
  };

  const handleSelectAnswer = (optionIndex) => {
    if (showResults) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) {
          correctCount += 1;
        }
      });
      const points = correctCount * 50;
      setXpAwarded(points);
      setShowResults(true);
    }
  };

  const score = activeQuiz ? activeQuiz.questions.filter((q,i)=>selectedAnswers[i]===q.correctIndex).length : 0;
  return <div className="se-product"><div className="se-container"><header className="se-page-intro se-arcade-intro"><div><span className="se-kicker">THE PLAYROOM</span><h1>A little competitive?<br/>You're in good company.</h1><p>A quick break for movie buffs, music fans, and curious minds.</p></div><div className="se-arcade-stamp" aria-hidden="true">PLAY<br/><span>JUST ONE MORE</span>↗</div></header>
    {!activeQuiz ? <><div className="se-game-grid">{availableQuizzes.map((quiz,i)=><article className={`se-game-card se-game-${i}`} key={quiz.id}><div className="se-game-art" aria-hidden="true"><span>{i===0?'01':'02'}</span><strong>{i===0?'CUT!':'ENCORE'}</strong><i>{i===0?'▶':'♫'}</i></div><div className="se-game-content"><div className="se-game-meta"><span>{i===0?'CINEMA TRIVIA':'MUSIC TRIVIA'}</span><span>{quiz.questions.length} questions</span></div><h2>{i===0?'The big-screen brain test.':'Know your headliners?'}</h2><p>{i===0?'From cult favourites to cinematic universes. How much of a film buff are you?':'Your playlist is impressive. Let’s see what else you know about the music.'}</p><button className="se-button se-button-ink" onClick={()=>handleStartQuiz(quiz)}>Play now <ArrowRight size={16}/></button></div></article>)}</div><div className="se-rewards-bottom"><div><span className="se-kicker">A DIFFERENT KIND OF WIN</span><h2>Don't miss your daily spin.</h2><p>Visit your rewards wallet to discover your daily bonus and unlocked offers.</p></div><Link className="se-button" to="/rewards">Explore rewards <ArrowRight size={16}/></Link></div></> : showResults ? <section className="se-quiz-panel se-quiz-result"><Trophy size={48}/><span className="se-kicker">THAT'S A WRAP</span><h2>{score===activeQuiz.questions.length?'You know your stuff.':'A good round. Another?'}</h2><p>You answered {score} of {activeQuiz.questions.length} questions correctly.</p><strong>{Math.round(score/activeQuiz.questions.length*100)}<small>%</small></strong><p className="se-note">This trivia round is practice. Your wallet balance is unchanged. Visit Rewards for available point-earning activities.</p><button className="se-button" onClick={()=>setActiveQuiz(null)}>Back to the playroom <ArrowRight size={16}/></button></section> : <section className="se-quiz-panel"><div className="se-game-meta"><button onClick={()=>setActiveQuiz(null)}>← Leave round</button><span>QUESTION {currentQuestion+1} / {activeQuiz.questions.length}</span></div><div className="se-quiz-progress"><span style={{width:`${(currentQuestion+1)/activeQuiz.questions.length*100}%`}}/></div><h2>{activeQuiz.questions[currentQuestion].question}</h2><div className="se-answers">{activeQuiz.questions[currentQuestion].options.map((option,index)=><button key={option} aria-pressed={selectedAnswers[currentQuestion]===index} onClick={()=>handleSelectAnswer(index)}><span>{String.fromCharCode(65+index)}</span>{option}{selectedAnswers[currentQuestion]===index&&<CheckCircle2 size={18}/>}</button>)}</div><button className="se-button se-button-ink" disabled={selectedAnswers[currentQuestion]===undefined} onClick={handleNext}>{currentQuestion===activeQuiz.questions.length-1?'See my result':'Next question'}<ArrowRight size={16}/></button></section>}
    <Footer/></div></div>;
};
export default Quiz;
