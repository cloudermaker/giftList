import { faCat, faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cloneDeep, random } from 'lodash';
import { useEffect, useState } from 'react';
import { inherits } from 'util';

enum CellBackgroundTypes {
    Grass,
    Sea,
    Empty
}

enum CellContentTypes {
    Cat,
    Mouse,
    Empty
}

interface ICellContent {
    Id: number;
    Type: CellContentTypes;
    LastPositionId: number;
    GetNextMove(cells: Cell[]): number;
}

class Cat implements ICellContent {
    Id: number;
    LastPositionId: number = -1;
    Type: CellContentTypes = CellContentTypes.Cat;

    constructor(id: number) {
        this.Id = id;
    }

    GetNextMove(cells: Cell[]): number {
        return 0;
    }
}

class Cell {
    id: number;
    background: CellBackgroundTypes;
    content: ICellContent[] = [];
    lastSeenStep: number = 0;
    isHouse: boolean = false;

    constructor(lineSize: number, cellId: number, isHouse: boolean) {
        this.id = cellId;
        this.background = CellBackgroundTypes.Grass;
        this.isHouse = isHouse;
    }

    Print() {
        const catCount = this.content.filter((c) => c.Type === CellContentTypes.Cat).length;

        if (this.isHouse) {
            return <FontAwesomeIcon className="w-5" icon={faHouse} />;
        } else if (catCount > 1) {
            return (
                <>
                    <FontAwesomeIcon className="w-2" icon={faCat} />
                    {catCount}
                </>
            );
        } else if (catCount === 1) {
            return <FontAwesomeIcon className="w-5" icon={faCat} />;
        }

        return ' ';
    }

    GetBackgroundColor(currentStep: number) {
        if (this.background === CellBackgroundTypes.Sea) return 'bg-blue-300';
        if (this.background === CellBackgroundTypes.Grass) {
            const age = (this.lastSeenStep / currentStep) * 100;
            if (age > 80) return 'bg-green-500';
            if (age > 60) return 'bg-green-400';
            if (age > 40) return 'bg-green-300';
            if (age > 20) return 'bg-green-200';

            return 'bg-green-100';
        }

        return 'bg-white';
    }

    ToolTip() {
        return (
            <>
                <div className="tooltip">
                    <b>{this.id}</b>
                </div>
            </>
        );
    }
}

const Game = (): JSX.Element => {
    const size = 50;
    const catCount = 20;

    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [stepNb, setStepNb] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(500);
    const [maps, setMaps] = useState<Cell[]>([]);

    const getAvailableCells = (cellId: number): number[] => {
        const canGoLeft = cellId % size !== 0;
        const canGoRight = cellId % size !== size - 1;
        const canGoUp = cellId > size;
        const canGoDown = cellId < size * size - size;

        const cellUpId = canGoUp ? cellId - size : -1;
        const cellDownId = canGoDown ? cellId + size : -1;
        const cellRightId = canGoRight ? cellId + 1 : -1;
        const cellLeftId = canGoLeft ? cellId - 1 : -1;

        const cellUpLeftId = canGoUp && canGoLeft ? cellId - size - 1 : -1;
        const cellDownLeftId = canGoDown && canGoLeft ? cellId + size - 1 : -1;
        const cellUpRightId = canGoUp && canGoRight ? cellId - size + 1 : -1;
        const cellDownRightId = canGoDown && canGoRight ? cellId + size + 1 : -1;

        return [
            cellUpId,
            cellDownId,
            cellRightId,
            cellLeftId,
            cellUpLeftId,
            cellDownLeftId,
            cellUpRightId,
            cellDownRightId
        ].filter((id) => id !== -1);
    };

    useEffect(() => {
        const MoveCats = () => {
            const newMaps = cloneDeep(maps);
            for (let catCell of maps.filter((cell) => cell.content.filter((c) => c.Type === CellContentTypes.Cat).length > 0)) {
                for (let catContent of catCell.content.filter((c) => c.Type === CellContentTypes.Cat)) {
                    const availableCells: number[] = getAvailableCells(catCell.id).filter((a) => a !== catContent.LastPositionId);

                    const nextCellId = Math.floor(Math.random() * availableCells.length);

                    catContent.LastPositionId = catCell.id;

                    newMaps[availableCells[nextCellId]].content.push(catContent);
                    newMaps[catCell.id].content = newMaps[catCell.id].content.filter((c) => c.Id !== catContent.Id);
                    newMaps[catCell.id].lastSeenStep = stepNb;
                }
            }

            setMaps(newMaps);
        };

        if (isStarted) {
            setTimeout(() => {
                MoveCats();
                setStepNb((old) => old + 1);
            }, speed);
        }
    }, [maps, isStarted]);

    const initMap = (): void => {
        setIsStarted(false);
        const cells = new Array(size * size).fill(0).map((_, idx) => new Cell(size, idx, idx === 0));

        for (let i = 0; i < catCount; i++) {
            const randX = Math.floor(Math.random() * size);
            const randY = Math.floor(Math.random() * size);

            //cells[randX * size + randY].content.push(new Cat(i));
            cells[0].content.push(new Cat(i));
        }

        setMaps(cells);
    };

    return (
        <>
            <h1>Welcome on games page</h1>

            <span>
                <button onClick={initMap} className="mx-2">
                    Init
                </button>

                <button onClick={() => setIsStarted(true)} className="mx-2" disabled={maps.length === 0 || isStarted}>
                    Start
                </button>

                <button onClick={() => setIsStarted(false)} className="mx-2" disabled={maps.length === 0 || !isStarted}>
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

            <div className="justify-center flex my-5">
                <ul className="border-2 border-black w-fit">
                    {new Array(size).fill(0).map((_, idx1) => (
                        <li key={`line_${idx1}`}>
                            <ul className="flex">
                                {new Array(size).fill(0).map((_, idx2) => {
                                    var cell = maps[idx1 * size + idx2];
                                    return (
                                        <li
                                            key={`cell_${idx1 * size + idx2}`}
                                            id={`cell_${idx1 * size + idx2}`}
                                            className={`cursor-pointer tooltip-container h-4 w-4 border-1 border-black text-center flex justify-center text-xs ${
                                                maps[idx1 * size + idx2]?.GetBackgroundColor(stepNb) ?? ''
                                            }`}
                                        >
                                            {cell?.Print()}
                                            {cell?.ToolTip()}
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Game;
