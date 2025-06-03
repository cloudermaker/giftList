import React, { useEffect, useState } from 'react';

const Snowfall = () => {
    const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: string; animationDuration: string }>>([]);

    useEffect(() => {
        const createSnowflake = () => ({
            id: Math.random(),
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`
        });

        // Create initial snowflakes
        const initialSnowflakes = Array.from({ length: 50 }, createSnowflake);
        setSnowflakes(initialSnowflakes);

        // Add new snowflakes periodically
        const interval = setInterval(() => {
            setSnowflakes((prev) => [...prev.slice(-49), createSnowflake()]);
        }, 200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="snowfall">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="snowflake"
                    style={{
                        left: flake.left,
                        animationDuration: flake.animationDuration
                    }}
                >
                    ❄️
                </div>
            ))}
        </div>
    );
};

export default Snowfall;
