import React, { useState, useEffect } from 'react';
import './PomodoroTimer.css';

const PomodoroTimer = () => {
  const POMODORO_TIME = 25 * 60; // 25 minutes in seconds

  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [breakDuration, setBreakDuration] = useState(5); // break duration in minutes

  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto-switch between work and break modes
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(breakDuration * 60);
        setIsRunning(true); // Auto-start break timer
      } else {
        setMode('work');
        setTimeLeft(POMODORO_TIME);
        setIsRunning(true); // Auto-start next work session
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, breakDuration]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(POMODORO_TIME);
  };

  const handleBreakDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setBreakDuration(newDuration);
    // If currently on break and timer is not running, update the time
    if (mode === 'break' && !isRunning) {
      setTimeLeft(newDuration * 60);
    }
  };

  return (
    <div className="pomodoro-timer">
      <h1>Pomodoro Timer</h1>

      <div className={`mode-indicator ${mode}`}>
        {mode === 'work' ? 'Work Time' : 'Break Time'}
      </div>

      <div className={`timer-display ${mode}`}>
        {formatTime(timeLeft)}
      </div>

      <div className="timer-controls">
        <button
          className="btn btn-primary"
          onClick={handleStartPause}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      <div className="settings">
        <label htmlFor="break-duration">
          Break Duration:
          <input
            id="break-duration"
            type="number"
            min="1"
            max="60"
            value={breakDuration}
            onChange={handleBreakDurationChange}
            disabled={isRunning && mode === 'break'}
          />
          minutes
        </label>
      </div>
    </div>
  );
};

export default PomodoroTimer;
