import { faCat } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cloneDeep, random } from 'lodash';
import { useEffect, useState } from 'react';

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

class Cell {
    id: number;
    background: CellBackgroundTypes;
    content: CellContentTypes = CellContentTypes.Empty;

    constructor(lineSize: number, cellId: number) {
        this.id = cellId;
        this.background = this.GetType(lineSize);

        this.InitContent(cellId);
    }

    Print() {
        if (this.content === CellContentTypes.Cat) {
            return <FontAwesomeIcon className="w-5" icon={faCat} />;
        }

        return '.';
    }

    GetType(lineSize: number) {
        return CellBackgroundTypes.Grass;
    }

    GetColor() {
        if (this.background === CellBackgroundTypes.Sea) return 'bg-blue-300';
        if (this.background === CellBackgroundTypes.Grass) return 'bg-green-300';
        return 'bg-white';
    }

    InitContent(cellId: number) {
        if (cellId == 0) {
            this.content = CellContentTypes.Cat;
        }
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
    const size = 10;
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [maps, setMaps] = useState<Cell[]>(new Array(size * size).fill(0).map((_, idx) => new Cell(size, idx)));

    const getAvailableCells = (cellId: number): number[] => {
        const cellUpId = cellId > size ? cellId - size : -1;
        const cellDownId = cellId < size * size - size ? cellId + size : -1;
        const cellRightId = cellId % size !== size - 1 ? cellId + 1 : -1;
        const cellLeftId = cellId % size !== 0 ? cellId - 1 : -1;

        return [cellUpId, cellDownId, cellRightId, cellLeftId].filter((id) => id !== -1);
    };

    useEffect(() => {
        const MoveCat = () => {
            const catCellId = maps.filter((cell) => cell.content === CellContentTypes.Cat)[0].id;
            if (catCellId >= 0) {
                const newMaps = cloneDeep(maps);
                const availableCells: number[] = getAvailableCells(catCellId);
                const nextCellId = Math.floor(Math.random() * availableCells.length);

                newMaps[availableCells[nextCellId]].content = CellContentTypes.Cat;
                newMaps[catCellId].content = CellContentTypes.Empty;

                setMaps(newMaps);
            }
        };

        if (isStarted) {
            setTimeout(() => {
                MoveCat();
            }, 500);
        }
    }, [maps, isStarted]);

    return (
        <>
            <h1>Welcome on games page</h1>

            <span>
                <button onClick={() => setIsStarted(true)} className="mx-2">
                    Start
                </button>

                <button onClick={() => setIsStarted(false)} className="mx-2">
                    End
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
                                            key={`cell_${cell.id}`}
                                            id={`cell_${cell.id}`}
                                            className={`cursor-pointer tooltip-container w-9 border-1 border-black text-center flex justify-center ${maps[
                                                idx1 * size + idx2
                                            ].GetColor()}`}
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
        </>
    );
};

export default Game;
