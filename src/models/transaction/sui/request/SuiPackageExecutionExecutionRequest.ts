import { TransactionRequest } from '../../TransactionRequest';

export interface SuiInput {
    type: string;
    value: string;
}

export interface SuiCommand {
    type: string;
}

export class SuiMoveCallCommand implements SuiCommand {
    public type: string;
    public functionName!: string;
    public inputs: SuiInput[] = [];
    public typeArguments: string[] = [];

    constructor() {
        this.type = 'moveCall';
    }
}

export class SuiObjectTransferCommand implements SuiCommand {
    public type: string;
    public vecElementType!: string;
    public elements: any[] = [];

    constructor() {
        this.type = 'transfer';
    }
}

export class SuiMakeMoveVecCommand implements SuiCommand {
    public type: string;
    public objects: string[] = [];

    constructor() {
        this.type = 'makeMoveVec';
    }
}

export class SuiPackageExecutionExecutionRequest extends TransactionRequest {
    public gasPrice?: number;
    public gasBudget?: number;
    public to!: string;
    public value!: number;
    public targetPackage!: string;
    public functionName!: string;
    public commands: SuiCommand[] = [];
    public inputs: SuiInput[] = [];
}
