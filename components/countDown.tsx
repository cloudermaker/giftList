import React from 'react';
import { useState, useEffect } from 'react';

export default function CountDown() {
    const [currentMillisecond, setCurrentMillisecond] = useState<number>(0);
    const [currentMin, setCurrentMin] = useState<number>(0);
    const [currentHours, setCurrentHours] = useState<number>(0);
    const [currentDay, setCurrentDay] = useState<number>(0);
    const [currentMonth, setCurrentMonth] = useState<number>(0);

    useEffect(() => {
        let sampleInterval = setInterval(() => {
            const currentDate = new Date();
            const targetDate = new Date(currentDate.getFullYear(), 11, 24, 23);
            const diffDate = new Date((targetDate as any) - (currentDate as any));

            setCurrentMillisecond(diffDate.getSeconds());
            setCurrentMin(diffDate.getMinutes());
            setCurrentHours(diffDate.getHours());
            setCurrentDay(diffDate.getDate());
            setCurrentMonth(diffDate.getMonth());
        }, 300);

        return () => {
            clearInterval(sampleInterval);
        };
    });

    const toStr = (i: number): string => {
        return i < 10 ? `0${i}` : `${i}`;
    };

    if (currentDay < 0) {
        return <b className="text-red-500">L&apos;évènement est terminé &#128532;</b>;
    }

    return (
        <>
            {toStr(currentMonth)} Mois, {toStr(currentDay)} Jours - {toStr(currentHours)}:{toStr(currentMin)}:
            {toStr(currentMillisecond)}
        </>
    );
}
