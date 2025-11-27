import { useState, useEffect } from 'react';

const Timer = ({ startTime, expectedEndTime, status, onViolation }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isViolation, setIsViolation] = useState(false);

    useEffect(() => {
        if (status !== 'ONGOING') return;

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(expectedEndTime);
            const diff = Math.floor((end - now) / 1000);

            if (diff < 0) {
                setIsViolation(true);
                setTimeLeft(Math.abs(diff));
                if (onViolation) onViolation();
            } else {
                setIsViolation(false);
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expectedEndTime, status, onViolation]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`text-4xl font-mono font-bold ${isViolation ? 'text-red-600' : 'text-green-600'}`}>
            {isViolation ? '+' : ''}{formatTime(timeLeft)}
        </div>
    );
};

export default Timer;
