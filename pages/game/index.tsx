import { Layout } from '@/components/layout';
import { Game } from '@/lib/game';
import { CatGame } from '@/lib/game/catGame';
import { Cell } from '@/lib/game/cell';
import { useEffect, useState } from 'react';

const GAME_SIZE = 50;
const game: Game = new CatGame(10, GAME_SIZE);

const GameComponent = (): JSX.Element => {
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [stepNb, setStepNb] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(500);
    const [cells, setCells] = useState<Cell[]>([]);

    useEffect(() => {
        if (isStarted) {
            setTimeout(() => {
                var newCells = game.play(stepNb);
                setCells(newCells);

                setStepNb((old) => old + 1);
            }, speed);
        }
    }, [isStarted, stepNb, speed]);

    const initGame = (): void => {
        setIsStarted(false);
        setSpeed(500);
        setStepNb(0);

        game.initMap(0);

        setCells(game.cells);
    };

    return (
        <Layout withHeader={false}>
            <h1>Welcome on games page</h1>

            <span>
                <button onClick={initGame} className="mx-2">
                    Init
                </button>

                <button onClick={() => setIsStarted(true)} className="mx-2" disabled={cells.length === 0 || isStarted}>
                    Start
                </button>

                <button onClick={() => setIsStarted(false)} className="mx-2" disabled={cells.length === 0 || !isStarted}>
                    Stop
                </button>

                <button onClick={() => setSpeed((oldSpeed) => oldSpeed + 100)} className="mx-2">
                    {'<<'}
                </button>
                <span>{speed}</span>
                <button
                    onClick={() => setSpeed((oldSpeed) => (oldSpeed > 100 ? oldSpeed - 100 : 100))}
                    className="mx-2"
                    disabled={speed === 100}
                >
                    {'>>'}
                </button>
            </span>

            {cells.length > 0 && (
                <div className="justify-center flex my-5">
                    <ul className="border-2 border-black w-fit">
                        {new Array(GAME_SIZE).fill(0).map((_, idx1) => (
                            <li key={`line_${idx1}`}>
                                <ul className="flex">
                                    {new Array(GAME_SIZE).fill(0).map((_, idx2) => {
                                        var cellId = idx1 * GAME_SIZE + idx2;
                                        var cell = cells[cellId];
                                        return (
                                            <li
                                                key={`cell_${cellId}`}
                                                id={`cell_${cellId}`}
                                                className={`cursor-pointer tooltip-container h-4 w-4 border-1 border-black text-center flex justify-center ${
                                                    cells[cellId].GetBackgroundColor(stepNb) ?? ''
                                                } text-xs`}
                                            >
                                                {cell.Print()}
                                                {cell.ToolTip()}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Layout>
    );
};

export default GameComponent;
