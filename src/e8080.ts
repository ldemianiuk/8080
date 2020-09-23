import { instructionTable, instructionSize, instructionCycles, instructionsDisasm, parityCache, instructionDescription } from './instructions';
import { Subject } from 'rxjs';
import { registerHandlers } from './instructionHandlers';


class Flags {
    S: boolean;
    Z: boolean;
    A: boolean;
    P: boolean;
    C: boolean;
}

// eslint-disable-next-line no-unused-vars
const B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, M = 6, A = 7, F = 8;

function WORD(hi: number, lo: number): number {
    return (hi << 8) | lo;
}

function LO(n: number): number {
    return n & 0xff;
}

function HI(n: number): number {
    return n >> 8;
}


// eslint-disable-next-line no-unused-vars
type Handler = (this: e8080, op: number, arg1?: number, arg2?: number) => void;


export class e8080 {
    memory: Uint8Array;
    registers: Uint8Array; // B, C, D, E, H, L, M, A
    sp: Uint16Array;
    pc: Uint16Array;
    status: Flags;
    running: boolean;
    cycles: number;
    instructions: number;
    input: number[];
    output$: Subject<number>[];
    trace: string[];
    calls: boolean[];
    traceon: boolean;

    static instructionHandlers: Record<string, Handler> = {};

    ret(addcycles: number = 6): void {
        this.pc[0] = WORD(this.memory[this.sp[0] + 1], this.memory[this.sp[0]]);
        this.sp[0] += 2;
        this.cycles += addcycles;
    }


    private carry(bit: number, a: number, b: number, c: boolean): boolean {
        const result = a + b + (c ? 1 : 0);
        const carry = result ^ a ^ b;
        return (carry & (1 << bit)) !== 0;
    }

    add(a: number, b: number, c: boolean): number {
        const result = a + b + (c ? 1 : 0);
        this.status.C = this.carry(8, a, b, c);
        this.status.A = this.carry(4, a, b, c);
        this.setFlags(result);
        return result;
    }

    sub(a: number, b: number, c: boolean): number {
        const result = this.add(a, b ^ 0xff, !c);
        this.status.C = !this.status.C;
        return result;
    }

    call(hi: number, lo: number, addcycles: number = 6): void {
        const addr = WORD(hi, lo);
        this.sp[0] -= 2;
        this.memory[this.sp[0]] = LO(this.pc[0]);
        this.memory[this.sp[0] + 1] = HI(this.pc[0]);
        this.pc[0] = addr;
        this.cycles += addcycles;
        if (this.traceon) {
            this.calls[addr] = true;
        }
    }

    setFlags(result: number): void {
        this.status.S = (result & 0x80) !== 0;
        this.status.Z = (result & 0xff) === 0;

        this.status.P = parityCache[result & 0xff];
    }

    getReg(reg: number): number {
        if (reg === F) {
            //S Z 0 A 0 P 1 C
            const flags =
                +this.status.C |
                (1 << 1) |
                (+this.status.P << 2) |
                (+this.status.A << 4) |
                (+this.status.Z << 6) |
                (+this.status.S << 7);
            return flags;
        }
        else if (reg === M) {
            return this.memory[WORD(this.registers[H], this.registers[L])];
        }
        else {
            return this.registers[reg];
        }
    }

    setReg(reg: number, value: number): void {
        if (reg === F) {
            //S Z 0 A 0 P 1 C
            this.status.C = (value & 1) !== 0;
            this.status.P = (value & (1 << 2)) !== 0;
            this.status.A = (value & (1 << 4)) !== 0;
            this.status.Z = (value & (1 << 6)) !== 0;
            this.status.S = (value & (1 << 7)) !== 0;
        }
        else if (reg === M) {
            this.memory[WORD(this.registers[H], this.registers[L])] = value;
        }
        else {
            this.registers[reg] = value;
        }
    }

    constructor() {
        this.status = new Flags();
        this.memory = new Uint8Array(0x10000);
        this.registers = new Uint8Array(8);
        this.sp = new Uint16Array(1);
        this.pc = new Uint16Array(1);
        this.output$ = new Array(256);
        for (let i = 0; i < 256; i++) {
            this.output$[i] = new Subject<number>();
        }
        this.reset();
    }

    reset(): void {
        this.registers.fill(0);
        this.memory.fill(0);
        this.sp[0] = 0xf000;
        this.pc[0] = 0;
        this.status.S = this.status.Z = this.status.A = this.status.P = this.status.C = false;
        this.running = true;
        this.cycles = 0;
        this.instructions = 0;
        this.input = [];
        this.trace = [];
        this.calls = [];
        this.traceon = false;
    }

    step(): void {
        if (!this.running) {
            return;
        }
        const opcode = this.memory[this.pc[0]];
        const instr = instructionTable[opcode];
        const len = instructionSize[opcode];
        const arg1 = this.memory[(this.pc[0] + 1) & 0xffff];
        const arg2 = this.memory[(this.pc[0] + 2) & 0xffff];

        if (this.traceon && this.trace[this.pc[0]] === undefined) {
            this.trace[this.pc[0]] = this.disasm(this.pc[0]);
        }

        this.pc[0] += len;

        const handler = e8080.instructionHandlers[instr];
        if (handler) {
            handler.call(this, opcode, arg1, arg2);
        }
        else {
            console.log('ERROR: ' + instr);
        }

        this.cycles += instructionCycles[opcode];
        this.instructions++;
    }

    private formatInstruction(opcode: number, len: number, addr: number): string {
        let instr: string = instructionsDisasm[opcode];

        if (len === 1) {
            return instr;
        }

        if (len == 2) {
            return instr + ' ' + this.memory[(addr + 1) & 0xffff].toString(16);

        }
        else {
            return instr + ' ' + (this.memory[(addr + 1) & 0xffff] + (this.memory[(addr + 2) & 0xffff] << 8)).toString(16);
        }
    }

    disasm(_addr: number): string;
    disasm(_addr: number, _num: number): [number, string, string][];
    disasm(addr: any, num?: any): any {
        if (num > 0) {
            let result = [];
            for (let a = addr, i = 0; i < num && a <= 0xffff; i++) {
                const opcode: number = this.memory[a];
                const len: number = instructionSize[opcode];
                result.push([a, this.formatInstruction(opcode, len, a), instructionDescription[opcode]]);
                a += len;
            }
            return result;
        }

        const opcode: number = this.memory[addr];
        const len: number = instructionSize[opcode];

        return this.formatInstruction(opcode, len, addr);
    }

    showFlags(): void {
        console.log('S:' + this.status.S + ' Z:' + this.status.Z + ' A:' + this.status.A + ' P:' + this.status.P + ' C:' + this.status.C);
    }

    static registerHandler(instr: string, handler: Handler): void {
        e8080.instructionHandlers[instr] = handler;
    }
}

registerHandlers();
