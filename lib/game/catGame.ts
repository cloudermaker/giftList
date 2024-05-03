import { cloneDeep } from 'lodash';
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
        return 0;
    }
}

export class CatGame extends Game {
    catCount: number;

    constructor(catCount: number, mapSize: number) {
        super(mapSize);
        this.catCount = catCount;
    }

    override play(stepNb: number): Cell[] {
        let newCells = cloneDeep(this.cells);

        this.moveCats(newCells, stepNb);

        this.cells = newCells;

        return this.cells;
    }

    private moveCats = (newCells: Cell[], stepNb: number) => {
        for (let catCell of newCells.filter((cell) => cell.content.filter((c) => c.Type === CellContentTypes.Cat).length > 0)) {
            for (let catContent of catCell.content.filter((c) => c.Type === CellContentTypes.Cat)) {
                const availableCells: number[] = this.getAvailableCells(catCell.id).filter(
                    (a) => a !== catContent.LastPositionId
                );

                const nextCellId = Math.floor(Math.random() * availableCells.length);

                catContent.LastPositionId = catCell.id;

                newCells[availableCells[nextCellId]].content.push(catContent);
                newCells[catCell.id].content = newCells[catCell.id].content.filter((c) => c.Id !== catContent.Id);
                newCells[catCell.id].lastSeenStep = stepNb;
            }
        }
    };

    override initMap(houseCellId = 0): void {
        super.initMap(houseCellId);

        for (let i = 0; i < this.catCount; i++) {
            this.cells[houseCellId].content.push(new Cat(i));
        }
    }
}
