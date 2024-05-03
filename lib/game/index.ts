import { Cell } from './cell';

export class Game {
    mapSize: number;
    cells: Cell[] = [];

    constructor(mapSize: number) {
        this.mapSize = mapSize;
    }

    initMap(houseCellId: number | undefined = 0): void {
        this.cells = new Array(this.mapSize * this.mapSize).fill(0).map((_, idx) => new Cell(idx));

        if (houseCellId >= 0) {
            this.cells[houseCellId].isHouse = true;
        }
    }

    play(stepNb: number): Cell[] {
        return this.cells;
    }

    getCells() {
        return this.cells;
    }

    getAvailableCells = (cellId: number): number[] => {
        const canGoLeft = cellId % this.mapSize !== 0;
        const canGoRight = cellId % this.mapSize !== this.mapSize - 1;
        const canGoUp = cellId > this.mapSize;
        const canGoDown = cellId < this.mapSize * this.mapSize - this.mapSize;

        const cellUpId = canGoUp ? cellId - this.mapSize : -1;
        const cellDownId = canGoDown ? cellId + this.mapSize : -1;
        const cellRightId = canGoRight ? cellId + 1 : -1;
        const cellLeftId = canGoLeft ? cellId - 1 : -1;

        const cellUpLeftId = canGoUp && canGoLeft ? cellId - this.mapSize - 1 : -1;
        const cellDownLeftId = canGoDown && canGoLeft ? cellId + this.mapSize - 1 : -1;
        const cellUpRightId = canGoUp && canGoRight ? cellId - this.mapSize + 1 : -1;
        const cellDownRightId = canGoDown && canGoRight ? cellId + this.mapSize + 1 : -1;

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
}
