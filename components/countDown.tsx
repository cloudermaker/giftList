import React from 'react';
import { useState, useEffect } from 'react';

const currentYear = new Date().getFullYear();

export default function CountDown() {
    const [currentMillisecond, setCurrentMillisecond] = useState<number>(0);
    const [currentMin, setCurrentMin] = useState<number>(0);
    const [currentHours, setCurrentHours] = useState<number>(0);
    const [currentDay, setCurrentDay] = useState<number>(0);
    const [currentMonth, setCurrentMonth] = useState<number>(0);

    useEffect(() => {
        let sampleInterval = setInterval(() => {
            const currentDate = new Date();

            setCurrentMillisecond(59 - currentDate.getSeconds());
            setCurrentMin(59 - currentDate.getMinutes());
            setCurrentHours(23 - currentDate.getHours());
            setCurrentDay(24 - currentDate.getDate());
            setCurrentMonth(11 - currentDate.getMonth());
        }, 300);

        return () => {
            clearInterval(sampleInterval);
        };
    });

    const toStr = (i: number): string => {
        return i < 10 ? `0${i}` : `${i}`;
    };

    if (currentDay < 0 || currentMonth < 0 || currentMin < 0 || currentMillisecond < 0) {
        return <b className="text-red-500">L&apos;évènement est terminé &#128532;</b>;
    }

    return (
        <>
            {toStr(currentMonth)} Months, {toStr(currentDay)} days - {toStr(currentHours)}:{toStr(currentMin)}:{toStr(currentMillisecond)}
        </>
    );
}
