import { instructionTable, instructionSize, instructionCycles, instructionsDisasm, parityCache } from './instructions';
import { Subject } from 'rxjs';

class Flags {
    S: boolean;
    Z: boolean;
    A: boolean;
    P: boolean;
    C: boolean;
}

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

function SRC(opcode: number): number {
    return opcode & 0b111;
}

function DST(opcode: number): number {
    return (opcode >> 3) & 0b111;
}

type Handlers = Record<string, (_op: number, _arg1?: number, _arg2?: number) => void>;


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

    instructionHandlers: Handlers = {
        'ACI': (op, d8) => {
            const a = this.getReg(A);
            const b = d8;
            const c = this.status.C ? 1 : 0;

            const result = a + b + c;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.status.A = ((a & 0x0f) + (b & 0x0f) + c > 0x0f);
        },
        'ADC': op => {
            const a = this.getReg(A);
            const b = this.getReg(SRC(op));
            const c = this.status.C ? 1 : 0;

            const result = a + b + c;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.status.A = ((a & 0x0f) + (b & 0x0f) + c > 0x0f);
        },
        'ADD': op => {
            const a = this.getReg(A);
            const b = this.getReg(SRC(op));

            const result = a + b;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.setAC(a, b);
        },
        'ADI': (op, d8) => {
            const a = this.getReg(A);
            const b = d8;

            const result = a + b;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.setAC(a, b);
        },
        'ANA': op => {
            // this.status.A = ((this.getReg(A) | this.getReg(SRC(op))) & 0x08) !== 0; // undocumented
            const result = this.getReg(A) & this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'ANI': (op, d8) => {
            //this.status.A = ((this.getReg(A) | d8) & 0x08) !== 0; // undocumented
            const result = this.getReg(A) & d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'CALL': (opcode, lo, hi) => { this.call(hi, lo, 0) },
        'CC': (opcode, lo, hi) => { if (this.status.C) this.call(hi, lo) },
        'CM': (opcode, lo, hi) => { if (this.status.S) this.call(hi, lo) },
        'CMA': _op => {
            this.setReg(A, this.getReg(A) ^ 0xff);
        },
        'CMC': _op => { this.status.C = !this.status.C },
        'CMP': op => {
            this.sub(this.getReg(A), this.getReg(SRC(op)));
        },
        'CNC': (opcode, lo, hi) => { if (!this.status.C) this.call(hi, lo) },
        'CNZ': (opcode, lo, hi) => { if (!this.status.Z) this.call(hi, lo) },
        'CP': (opcode, lo, hi) => { if (!this.status.S) this.call(hi, lo) },
        'CPE': (opcode, lo, hi) => { if (this.status.P) this.call(hi, lo) },
        'CPI': (op, d8) => {
            this.sub(this.getReg(A), d8);
        },
        'CPO': (opcode, lo, hi) => { if (!this.status.P) this.call(hi, lo) },
        'CZ': (opcode, lo, hi) => { if (this.status.Z) this.call(hi, lo) },
        'DAA': _op => {
            let a = this.getReg(A);
            if ((a & 0x0f) > 9 || this.status.A) {
                a = a + 6;
                this.setReg(A, a);
                this.status.A = true;
            }
            if ((a >> 4) > 9 || this.status.C) {
                a = a + (6 << 4);
                this.setReg(A, a);
                this.status.C = true;
            }
        },
        'DAD': op => {
            let value: number;
            if (op === 0x39) {
                value = this.sp[0];
            }
            else {
                const lo = DST(op);
                const hi = lo - 1;
                value = WORD(this.getReg(hi), this.getReg(lo));
            }
            const result = value + WORD(this.getReg(H), this.getReg(L));
            this.setReg(H, HI(result));
            this.setReg(L, LO(result));
            this.status.C = (result & 0x10000) !== 0;
        },
        'DCR': op => {
            const result = this.getReg(DST(op)) - 1;
            this.setReg(DST(op), result);
            this.setFlags(result);
            this.setAC(this.getReg(DST(op)), 0xff);
        },
        'DCX': op => {
            if (op === 0x3B) {
                this.sp[0]--;
            }
            else {
                const lo = DST(op);
                const hi = lo - 1;
                const result = WORD(this.getReg(hi), this.getReg(lo)) - 1;
                this.setReg(hi, HI(result));
                this.setReg(lo, LO(result));
            }
        },
        'DI': _op => { /* not implemented */ },
        'EI': _op => { /* not implemented */ },
        'HLT': _op => {
            this.running = false;
            this.pc[0]--;
        },
        'IN': (op, d8) => {
            switch (d8) {
                case 0:
                    if (this.input.length > 0) this.setReg(A, 0xff);
                    else this.setReg(A, 0);
                    break;
                case 1:
                    this.setReg(A, this.input.shift());
                    break;
                default:
                    console.log(`IN ${d8}`);
            }
        },
        'INR': op => {
            const result = this.getReg(DST(op)) + 1;
            this.setReg(DST(op), result);
            this.setFlags(result);
            this.setAC(this.getReg(DST(op)), 1);
        },
        'INX': op => {
            if (op === 0x33) {
                this.sp[0]++;
            }
            else {
                const hi = DST(op);
                const lo = hi + 1;
                const result = WORD(this.getReg(hi), this.getReg(lo)) + 1;
                this.setReg(hi, HI(result));
                this.setReg(lo, LO(result));
            }
        },
        'JC': (op, lo, hi) => { if (this.status.C) this.pc[0] = WORD(hi, lo); },
        'JM': (op, lo, hi) => { if (this.status.S) this.pc[0] = WORD(hi, lo); },
        'JMP': (op, lo, hi) => { this.pc[0] = WORD(hi, lo); },
        'JNC': (op, lo, hi) => { if (!this.status.C) this.pc[0] = WORD(hi, lo); },
        'JNZ': (op, lo, hi) => { if (!this.status.Z) this.pc[0] = WORD(hi, lo); },
        'JP': (op, lo, hi) => { if (!this.status.S) this.pc[0] = WORD(hi, lo); },
        'JPE': (op, lo, hi) => { if (this.status.P) this.pc[0] = WORD(hi, lo); },
        'JPO': (op, lo, hi) => { if (!this.status.P) this.pc[0] = WORD(hi, lo); },
        'JZ': (op, lo, hi) => { if (this.status.Z) this.pc[0] = WORD(hi, lo); },
        'LDA': (op, lo, hi) => {
            this.setReg(A, this.memory[WORD(hi, lo)]);
        },
        'LDAX': op => {
            let addr: number;
            // LDAX B
            if (op === 0x0A) {
                addr = WORD(this.registers[B], this.registers[C]);
            }
            // LDAX D
            else {
                addr = WORD(this.registers[D], this.registers[E]);
            }
            this.setReg(A, this.memory[addr]);
        },
        'LHLD': (op, lo, hi) => {
            this.setReg(L, this.memory[WORD(hi, lo)]);
            this.setReg(H, this.memory[(WORD(hi, lo) + 1) & 0xffff]);
        },
        'LXI': (op, lo, hi) => {
            if (op === 0x31) {
                this.sp[0] = WORD(hi, lo);
            }
            else {
                const reghi = DST(op);
                const reglo = reghi + 1;
                this.setReg(reghi, hi);
                this.setReg(reglo, lo);
            }
        },
        'MOV': op => {
            this.setReg(DST(op), this.getReg(SRC(op)));
        },
        'MVI': (op, d8) => {
            this.setReg(DST(op), d8);
        },
        'NOP': _op => { },
        'ORA': op => {
            const result = this.getReg(A) | this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'ORI': (op, d8) => {
            const result = this.getReg(A) | d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'OUT': (op, d8) => {
            if (this.output$[d8].observers.length > 0) {
                this.output$[d8].next(this.getReg(A));
            }
            else {
                console.log(`OUT ${d8}, ${this.getReg(A)}`)
            }
        },
        'PCHL': _op => {
            this.pc[0] = WORD(this.getReg(H), this.getReg(L));
        },
        'POP': op => {
            const value = WORD(this.memory[this.sp[0] + 1], this.memory[this.sp[0]]);
            this.sp[0] += 2;
            // POP PSW
            if (op === 0xf1) {
                this.setReg(A, HI(value));
                this.setReg(F, LO(value));
            }
            else {
                this.setReg(DST(op), HI(value));
                this.setReg(DST(op) + 1, LO(value));
            }
        },
        'PUSH': op => {
            let value: number;
            // PUSH PSW
            if (op === 0xf5) {
                value = WORD(this.getReg(A), this.getReg(F));
            }
            else {
                value = WORD(this.getReg(DST(op)), this.getReg(DST(op) + 1));
            }
            this.sp[0] -= 2;
            this.memory[this.sp[0]] = LO(value);
            this.memory[this.sp[0] + 1] = HI(value);
        },
        'RAL': _op => {
            const a = this.getReg(A);
            const c = +this.status.C;
            this.status.C = (a & 0b10000000) !== 0;
            this.setReg(A, (a << 1) | c);
        },
        'RAR': _op => {
            const a = this.getReg(A);
            const c = +this.status.C;
            this.status.C = (a & 0b1) !== 0;
            this.setReg(A, (a >> 1) | (c << 7));
        },
        'RC': _op => { if (this.status.C) this.ret(); },
        'RET': _op => { this.ret(0); },
        'RLC': _op => {
            const a = this.getReg(A);
            this.status.C = (a & 0b10000000) !== 0;
            this.setReg(A, (a << 1) | (+this.status.C));
        },
        'RM': _op => { if (this.status.S) this.ret(); },
        'RNC': _op => { if (!this.status.C) this.ret(); },
        'RNZ': _op => { if (!this.status.Z) this.ret(); },
        'RP': _op => { if (!this.status.S) this.ret(); },
        'RPE': _op => { if (this.status.P) this.ret(); },
        'RPO': _op => { if (!this.status.P) this.ret(); },
        'RRC': _op => {
            const a = this.getReg(A);
            this.status.C = (a & 0b1) !== 0;
            this.setReg(A, (a >> 1) | ((+this.status.C) << 7));
        },
        'RST': op => {
            const num = op & 0b111000;
            this.call(0, num, 0);
        },
        'RZ': _op => { if (this.status.Z) this.ret(); },
        'SBB': op => {
            this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op)) + (+this.status.C)));
        },
        'SBI': (op, d8) => {
            this.setReg(A, this.sub(this.getReg(A), d8 + (+this.status.C)));
        },
        'SHLD': (op, lo, hi) => {
            this.memory[WORD(hi, lo)] = this.getReg(L);
            this.memory[(WORD(hi, lo) + 1) & 0xffff] = this.getReg(H);
        },
        'SPHL': _op => {
            this.sp[0] = WORD(this.getReg(H), this.getReg(L));
        },
        'STA': (op, lo, hi) => {
            this.memory[WORD(hi, lo)] = this.getReg(A);
        },
        'STAX': op => {
            let addr: number;
            // STAX B
            if (op === 0x02) {
                addr = WORD(this.registers[B], this.registers[C]);
            }
            // STAX D
            else {
                addr = WORD(this.registers[D], this.registers[E]);
            }
            this.memory[addr] = this.getReg(A);
        },
        'STC': _op => {
            this.status.C = true;
        },
        'SUB': op => {
            this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op))));
        },
        'SUI': (op, d8) => {
            this.setReg(A, this.sub(this.getReg(A), d8));
        },
        'XCHG': _op => {
            const d = this.getReg(D);
            const e = this.getReg(E);
            this.setReg(D, this.getReg(H));
            this.setReg(E, this.getReg(L));
            this.setReg(H, d);
            this.setReg(L, e);
        },
        'XRA': op => {
            const result = this.getReg(A) ^ this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'XRI': (op, d8) => {
            const result = this.getReg(A) ^ d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        'XTHL': _op => {
            const l = this.getReg(L);
            const h = this.getReg(H);
            this.setReg(L, this.memory[this.sp[0]]);
            this.setReg(H, this.memory[this.sp[0] + 1]);
            this.memory[this.sp[0]] = l;
            this.memory[this.sp[0] + 1] = h;
        }
    };

    private ret(addcycles: number = 6): void {
        this.pc[0] = WORD(this.memory[this.sp[0] + 1], this.memory[this.sp[0]]);
        this.sp[0] += 2;
        this.cycles += addcycles;
    }

    private sub(a: number, b: number): number {
        const b_ = b ^ 0xff;
        const result = a + b_ + 1;
        this.setFlags(result);
        this.setCarry(result);
        this.status.C = !this.status.C;
        this.status.A = ((a & 0x0f) + (b_ & 0x0f) + 1 > 0x0f);
        return result;
    }

    private call(hi: number, lo: number, addcycles: number = 6): void {
        const addr = WORD(hi, lo);
        this.sp[0] -= 2;
        this.memory[this.sp[0]] = LO(this.pc[0]);
        this.memory[this.sp[0] + 1] = HI(this.pc[0]);
        this.pc[0] = addr;
        this.cycles += addcycles;
    }

    private setAC(a: number, b: number) {
        if ((a & 0x0f) + (b & 0x0f) > 0x0f) {
            this.status.A = true;
        }
        else {
            this.status.A = false;
        }
    }

    private setCarry(result: number): void {
        this.status.C = (result & 0x100) !== 0;
    }

    private setFlags(result: number): void {
        this.status.S = (result & 0x80) !== 0;
        this.status.Z = (result & 0xff) === 0;

        this.status.P = parityCache[result & 0xff];

        // this.status.C = result & 0b100000000;
    }

    parity(result: number): boolean {
        let parity = 1;
        for (let i = 0; i < 8; i++) {
            if ((result & (1 << i)) !== 0) {
                parity++;
            }
        }
        return (parity & 1) === 1;
    }


    getReg(reg: number): number {
        if (reg === F) {
            //S Z 0 A 0 P 1 C
            const flags = +this.status.C | (1 << 1) | (+this.status.P << 2) | (0 << 3) | (+this.status.A << 4) | (0 << 5) | (+this.status.Z << 6) | (+this.status.S << 7);
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
        this.trace = new Array(0x10000);
    }

    step(): void {
        if (!this.running) {
            return;
        }
        const opcode = this.memory[this.pc[0]];
        const instr = instructionTable[opcode];
        const len = instructionSize[opcode];
        const args = this.memory.slice(this.pc[0] + 1, this.pc[0] + len);

        this.trace[this.pc[0]] = displayWord(this.pc[0]) + ': ' + this.disasm(this.pc[0]);

        this.pc[0] += len;

        if (this.instructionHandlers[instr]) {
            this.instructionHandlers[instr](opcode, ...Array.from(args));
        }
        else {
            console.log('ERROR: ' + instr);
        }

        this.cycles += instructionCycles[opcode];
        this.instructions++;
    }

    disasm(_addr: number): string;
    disasm(_addr: number, _num: number): [number, string][];
    disasm(addr: any, num?: any): any {
        const opcode: number = this.memory[addr];
        let instr: string = instructionsDisasm[opcode];
        const len: number = instructionSize[opcode];

        if (num > 0) {
            let result = [];
            for (let a = addr, i = 0; i < num; i++) {
                const opcode: number = this.memory[a];
                const len: number = instructionSize[opcode];
                result.push([a, this.disasm(a)]);
                a += len;
            }
            return result;
        }

        if (num === 0) return [];

        if (len === 1) {
            return instr;
        }

        if (instr.includes(' ')) {
            instr = instr + ',';
        }

        if (len == 2) {
            return instr + ' ' + this.memory[addr + 1].toString(16);

        }
        else {
            return instr + ' ' + (this.memory[addr + 1] + (this.memory[addr + 2] << 8)).toString(16);
        }
    }

    showFlags(): void {
        console.log('S:' + this.status.S + ' Z:' + this.status.Z + ' A:' + this.status.A + ' P:' + this.status.P + ' C:' + this.status.C);
    }

}

function displayWord(n: number): string {
    return ('0000' + n.toString(16)).slice(-4);
}
