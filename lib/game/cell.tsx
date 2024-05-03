import { faHouse, faCat, faMouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export enum CellContentTypes {
    Cat,
    Mouse,
    Empty
}

export interface ICellContent {
    Id: number;
    Type: CellContentTypes;
    LastPositionId: number;
    GetNextMove(cells: Cell[]): number;
}

export class Cell {
    id: number;
    content: ICellContent[] = [];
    lastSeenStep: number = 0;
    isHouse: boolean = false;

    constructor(cellId: number) {
        this.id = cellId;
    }

    Print() {
        const catCount = this.content.filter((c) => c.Type === CellContentTypes.Cat).length;
        const mouseCount = this.content.filter((c) => c.Type === CellContentTypes.Mouse).length;

        if (this.isHouse) {
            return <FontAwesomeIcon className="w-5" icon={faHouse} />;
        } else if (this.content.length > 1) {
            if (catCount > 1) {
                return (
                    <>
                        <FontAwesomeIcon className="w-2" icon={faCat} />
                        {catCount}
                    </>
                );
            } else if (mouseCount > 1) {
                return (
                    <>
                        <FontAwesomeIcon className="w-2" icon={faMouse} />
                        {mouseCount}
                    </>
                );
            }

            return (
                <>
                    <FontAwesomeIcon className="w-2" icon={faCat} />
                    <FontAwesomeIcon className="w-2" icon={faMouse} />
                </>
            );
        } else if (catCount === 1) {
            return <FontAwesomeIcon className="w-5" icon={faCat} />;
        } else if (mouseCount === 1) {
            return <FontAwesomeIcon className="w-5" icon={faMouse} />;
        }

        return ' ';
    }

    GetBackgroundColor(currentStep: number) {
        const age = (this.lastSeenStep / currentStep) * 100;
        if (age > 80) return 'bg-green-500';
        if (age > 60) return 'bg-green-400';
        if (age > 40) return 'bg-green-300';
        if (age > 20) return 'bg-green-200';

        return 'bg-green-400';
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
