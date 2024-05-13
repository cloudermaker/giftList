import { cloneDeep, random } from 'lodash';
import { Game } from '.';
import { ICellContent, Cell, CellContentTypes } from './cell';

// n cats n mouses => cat & mouses on same cell => cat eat & should go back to house to spawn 2 cats
export class Cat implements ICellContent {
    Id: number;
    LastPositionId: number = -1;
    Type: CellContentTypes = CellContentTypes.Cat;

    constructor(id: number) {
        this.Id = id;
    }

    GetNextMove(availableCells: Cell[]): number {
        const nextId = Math.floor(Math.random() * availableCells.length);

        this.LastPositionId = this.Id;

        return availableCells[nextId].id;
    }
}

export class Mouse implements ICellContent {
    Id: number;
    Type: CellContentTypes = CellContentTypes.Mouse;
    LastPositionId: number = -1;

    constructor (id: number) {
        this.Id = id;
    }

    GetNextMove(availableCells: Cell[]): number {
        const nextId = Math.floor(Math.random() * availableCells.length);

        this.LastPositionId = this.Id;

        return availableCells[nextId].id;
    }
    
}

export class CatGame extends Game {
    catCount: number;
    mouseCount: number;

    constructor(catCount: number, mouseCount: number, mapSize: number) {
        super(mapSize);
        this.catCount = catCount;
        this.mouseCount = mouseCount;
    }

    override play(stepNb: number): Cell[] {
        let newCells = cloneDeep(this.cells);

        this.moveCats(newCells, stepNb);
        this.moveMouse(newCells, stepNb);

        this.cells = newCells;

        return this.cells;
    }

    private moveCats = (newCells: Cell[], stepNb: number) => {
        for (let catCell of newCells.filter((cell) => cell.content.filter((c) => c.Type === CellContentTypes.Cat).length > 0)) {
            for (let catContent of catCell.content.filter((c) => c.Type === CellContentTypes.Cat)) {
                const availableCells: Cell[] = this.getAvailableCells(catCell.id).filter(
                    (a) => a !== catContent.LastPositionId
                ).map((a) => newCells[a]);

                const nextCellId = catContent.GetNextMove(availableCells);

                newCells[nextCellId].content.push(catContent);
                newCells[catCell.id].content = newCells[catCell.id].content.filter((c) => c.Id !== catContent.Id);
                newCells[catCell.id].lastSeenStep = stepNb;
            }
        }
    };

    private moveMouse = (newCells: Cell[], stepNb: number) => {
        for (let mouseCell of newCells.filter((cell) => cell.content.filter((c) => c.Type === CellContentTypes.Mouse).length > 0)) {
            for (let mouseContent of mouseCell.content.filter((c) => c.Type === CellContentTypes.Mouse)) {
                const availableCells: Cell[] = this.getAvailableCells(mouseCell.id).filter(
                    (a) => a !== mouseContent.LastPositionId
                ).map((a) => newCells[a]);

                const nextCellId = mouseContent.GetNextMove(availableCells);

                newCells[nextCellId].content.push(mouseContent);
                newCells[mouseCell.id].content = newCells[mouseCell.id].content.filter((c) => c.Id !== mouseContent.Id);
                newCells[mouseCell.id].lastSeenStep = stepNb;
            }
        }
    };

    override initMap(houseCellId = 0): void {
        super.initMap(houseCellId);

        for (let i = 0; i < this.catCount; i++) {
            this.cells[houseCellId].content.push(new Cat(i));
        }

        for (let i = 0; i < this.mouseCount; i++) {
            this.cells[houseCellId].content.push(new Mouse(i));
        }
    }
}
