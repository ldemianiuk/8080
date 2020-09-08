//import { instructionTable, instructionSize } from './instructions';

class Flags {
    S: boolean;
    Z: boolean;
    A: boolean;
    P: boolean;
    C: boolean;
}

const B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, M = 6, A = 7, F = 8;

function WORD(hi: number, lo: number): number {
    return (hi << 8) + lo;
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

class e8080 {
    memory: Uint8Array;
    registers: Uint8Array; // B, C, D, E, H, L, M, A
    sp: Uint16Array;
    pc: Uint16Array;
    status: Flags;
    running: boolean;
    cycles: number;
    instructions: number;
    input: number[];
    output: string;

    instructionHandlers = {
        "ACI": (op, d8) => {
            const a = this.getReg(A);
            const b = d8;
            const c = this.status.C ? 1 : 0;

            const result = a + b + c;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.status.A = ((a & 0x0f) + (b & 0x0f) + 1 > 0x0f);
        },
        "ADC": op => {
            const a = this.getReg(A);
            const b = this.getReg(SRC(op));
            const c = this.status.C ? 1 : 0;

            const result = a + b + c;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.status.A = ((a & 0x0f) + (b & 0x0f) + 1 > 0x0f);
        },
        "ADD": op => {
            const a = this.getReg(A);
            const b = this.getReg(SRC(op));

            const result = a + b;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.setAC(a, b);
        },
        "ADI": (op, d8) => {
            const a = this.getReg(A);
            const b = d8;

            const result = a + b;
            this.setReg(A, result);
            this.setFlags(result);
            this.setCarry(result);
            this.setAC(a, b);
        },
        "ANA": op => {
            const result = this.getReg(A) & this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "ANI": (op, d8) => {
            const result = this.getReg(A) & d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "CALL": (opcode, lo, hi) => { this.call(hi, lo, 0) },
        "CC": (opcode, lo, hi) => { if (this.status.C) this.call(hi, lo) },
        "CM": (opcode, lo, hi) => { if (this.status.S) this.call(hi, lo) },
        "CMA": op => {
            this.setReg(A, this.getReg(A) ^ 0xff);
        },
        "CMC": op => { this.status.C = !this.status.C },
        "CMP": op => {
            this.sub(this.getReg(A), this.getReg(SRC(op)));
        },
        "CNC": (opcode, lo, hi) => { if (!this.status.C) this.call(hi, lo) },
        "CNZ": (opcode, lo, hi) => { if (!this.status.Z) this.call(hi, lo) },
        "CP": (opcode, lo, hi) => { if (!this.status.S) this.call(hi, lo) },
        "CPE": (opcode, lo, hi) => { if (this.status.P) this.call(hi, lo) },
        "CPI": (op, d8) => {
            this.sub(this.getReg(A), d8);
        },
        "CPO": (opcode, lo, hi) => { if (!this.status.P) this.call(hi, lo) },
        "CZ": (opcode, lo, hi) => { if (this.status.Z) this.call(hi, lo) },
        "DAA": op => {
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
        "DAD": op => {
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
            this.status.C = result > 0xffff;
        },
        "DCR": op => {
            const result = this.getReg(DST(op)) - 1;
            this.setReg(DST(op), result);
            this.setFlags(result);
            this.setAC(this.getReg(DST(op)), 0xff);
        },
        "DCX": op => {
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
        "DI": op => { /* not implemented */ },
        "EI": op => { /* not implemented */ },
        "HLT": op => {
            this.running = false;
            this.pc[0]--;
        },
        "IN": (op, d8) => {
            switch (d8) {
                case 0:
                    if (this.input.length > 0) this.setReg(A, 0xff);
                    else this.setReg(A, 0);
                    break;
                case 1:
                    this.setReg(A, this.input.shift());
                    break;
                default:
                    console.log("IN " + d8);
            }
        },
        "INR": op => {
            const result = this.getReg(DST(op)) + 1;
            this.setReg(DST(op), result);
            this.setFlags(result);
            this.setAC(this.getReg(DST(op)), 1);
        },
        "INX": op => {
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
        "JC": (op, lo, hi) => { if (this.status.C) this.pc[0] = WORD(hi, lo); },
        "JM": (op, lo, hi) => { if (this.status.S) this.pc[0] = WORD(hi, lo); },
        "JMP": (op, lo, hi) => { this.pc[0] = WORD(hi, lo); },
        "JNC": (op, lo, hi) => { if (!this.status.C) this.pc[0] = WORD(hi, lo); },
        "JNZ": (op, lo, hi) => { if (!this.status.Z) this.pc[0] = WORD(hi, lo); },
        "JP": (op, lo, hi) => { if (!this.status.S) this.pc[0] = WORD(hi, lo); },
        "JPE": (op, lo, hi) => { if (this.status.P) this.pc[0] = WORD(hi, lo); },
        "JPO": (op, lo, hi) => { if (!this.status.P) this.pc[0] = WORD(hi, lo); },
        "JZ": (op, lo, hi) => { if (this.status.Z) this.pc[0] = WORD(hi, lo); },
        "LDA": (op, lo, hi) => {
            this.setReg(A, this.memory[WORD(hi, lo)]);
        },
        "LDAX": op => {
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
        "LHLD": (op, lo, hi) => {
            this.setReg(L, this.memory[WORD(hi, lo)]);
            this.setReg(H, this.memory[(WORD(hi, lo) + 1) & 0xffff]);
        },
        "LXI": (op, lo, hi) => {
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
        "MOV": op => {
            const result = this.getReg(SRC(op));
            this.setReg(DST(op), result);
            // this.setFlags(result);
        },
        "MVI": (op, d8) => {
            this.setReg(DST(op), d8);
        },
        "NOP": op => { },
        "ORA": op => {
            const result = this.getReg(A) | this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "ORI": (op, d8) => {
            const result = this.getReg(A) | d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "OUT": (op, d8) => {
            if (d8 === 1) {
                const ch = this.getReg(A);                
                if (ch === 13) return;
                if (ch === 8) {
                    this.output = this.output.substr(0, this.output.length-1);
                }
                else {
                    this.output += String.fromCharCode(ch);
                }
                var element = document.getElementById('output');
                element.innerHTML = this.output + '<span class="blinking-cursor"> </span>';
                element.scrollTop = element.scrollHeight;
            }
            else {
                console.log("OUT " + d8);
            }
        },
        "PCHL": op => {
            this.pc[0] = WORD(this.getReg(H), this.getReg(L));
        },
        "POP": op => {
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
        "PUSH": op => {
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
        "RAL": op => {
            const a = this.getReg(A);
            const c = +this.status.C;
            this.status.C = (a & 0b10000000) !== 0;
            this.setReg(A, (a << 1) | c);
        },
        "RAR": op => {
            const a = this.getReg(A);
            const c = +this.status.C;
            this.status.C = (a & 0b1) !== 0;
            this.setReg(A, (a >> 1) | (c << 7));
        },
        "RC": op => { if (this.status.C) this.ret(); },
        "RET": op => { this.ret(0); },
        "RLC": op => {
            const a = this.getReg(A);
            this.status.C = (a & 0b10000000) !== 0;
            this.setReg(A, (a << 1) | (+this.status.C));
        },
        "RM": op => { if (this.status.S) this.ret(); },
        "RNC": op => { if (!this.status.C) this.ret(); },
        "RNZ": op => { if (!this.status.Z) this.ret(); },
        "RP": op => { if (!this.status.S) this.ret(); },
        "RPE": op => { if (this.status.P) this.ret(); },
        "RPO": op => { if (!this.status.P) this.ret(); },
        "RRC": op => {
            const a = this.getReg(A);
            this.status.C = (a & 0b1) !== 0;
            this.setReg(A, (a >> 1) | ((+this.status.C) << 7));
        },
        "RST": op => {
            const num = op & 0b111000;
            this.call(0, num, 0);
        },
        "RZ": op => { if (this.status.Z) this.ret(); },
        "SBB": op => {
            this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op)) + (+this.status.C)));
        },
        "SBI": (op, d8) => {
            this.setReg(A, this.sub(this.getReg(A), d8 + (+this.status.C)));
        },
        "SHLD": (op, lo, hi) => {
            this.memory[WORD(hi, lo)] = this.getReg(L);
            this.memory[(WORD(hi, lo) + 1) & 0xffff] = this.getReg(H);
        },
        "SPHL": op => {
            this.sp[0] = WORD(this.getReg(H), this.getReg(L));
        },
        "STA": (op, lo, hi) => {
            this.memory[WORD(hi, lo)] = this.getReg(A);
        },
        "STAX": op => {
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
        "STC": op => {
            this.status.C = true;
        },
        "SUB": op => {
            this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op))));
        },
        "SUI": (op, d8) => {
            this.setReg(A, this.sub(this.getReg(A), d8));
        },
        "XCHG": op => {
            const d = this.getReg(D);
            const e = this.getReg(E);
            this.setReg(D, this.getReg(H));
            this.setReg(E, this.getReg(L));
            this.setReg(H, d);
            this.setReg(L, e);
        },
        "XRA": op => {
            const result = this.getReg(A) ^ this.getReg(SRC(op));
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "XRI": (op, d8) => {
            const result = this.getReg(A) ^ d8;
            this.setReg(A, result);
            this.setFlags(result);
            this.status.C = false;
            this.status.A = false; // undocumented
        },
        "XTHL": op => {
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
        const b_ = b ^ 0xff
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
        this.status.C = (result & 0b100000000) !== 0;
    }

    private setFlags(result: number): void {
        this.status.S = (result & 0b10000000) !== 0;
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


    private getBit(n: number, bit: number): number {
        return (n & (1 << bit)) === 0 ? 0 : 1;
    }

    getReg(reg: number): number {
        if (reg === F) {
            //S Z 0 A 0 P 1 C
            const flags = +this.status.C + (1 << 1) + (+this.status.P << 2) + (0 << 3) + (+this.status.A << 4) + (0 << 5) + (+this.status.Z << 6) + (+this.status.S << 7);
            return flags;
        }
        else if (reg === M) {
            return this.memory[(this.registers[H] << 8) + this.registers[L]];
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
            this.memory[(this.registers[H] << 8) | this.registers[L]] = value;
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
        this.output = "";
    }

    step(): void {
        if (!this.running) {
            return;
        }
        const opcode = this.memory[this.pc[0]];
        const instr = instructionTable[opcode];
        const len = instructionSize[opcode];
        const args = this.memory.slice(this.pc[0] + 1, this.pc[0] + len);

        this.pc[0] += len;

        if (this.instructionHandlers[instr]) {
            this.instructionHandlers[instr](opcode, ...args);
        }
        else {
            console.log("ERROR: " + instr);
        }

        this.cycles += instructionCycles[opcode];
        this.instructions++;
    }

    disasm(addr: number): string;
    disasm(addr: number, num: number): string[];
    disasm(addr: any, num?: any): any {
        const opcode: number = this.memory[addr];
        let instr: string = instructionsDisasm[opcode];
        const len: number = instructionSize[opcode];

        if (num > 0) {
            return ['<li ' + (addr === this.pc[0] ? 'class="current"' : '') + '><span><span class="address">' + ('0000' + addr.toString(16)).slice(-4) + ':</span> ' + this.disasm(addr) + '</span></li>', ...this.disasm(addr + len, num - 1)];
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
        console.log("S:" + this.status.S + " Z:" + this.status.Z + " A:" + this.status.A + " P:" + this.status.P + " C:" + this.status.C);
    }

}

let emulator = new e8080();

let runtimer;

function cpudiag() {
    document.getElementById('output').innerHTML = '';
    emulator.reset();
    emulator.memory.set([0x76], 0);
    emulator.memory.set([0xc3, 0x06, 0xec], 0x05);
    emulator.memory.set(cpm, 0xec06);
    emulator.memory.set(cpu_diag, 0x100);
    emulator.pc[0] = 0x100;
    refreshui();
}

function basic() {
    clearTimeout(runtimer);
    runtimer = null;
    document.getElementById('output').innerHTML = '';
    emulator.reset();
    emulator.memory.set(msbasic, 0x1000);
    emulator.pc[0] = 0x1000;
    refreshui();
}

function tinybasic() {
    clearTimeout(runtimer);
    runtimer = null;
    document.getElementById('output').innerHTML = '';
    emulator.reset();
    emulator.memory.set(tinybas);
    refreshui();
}


const programs = [
    [0x21, 0x10, 0x00, 0x7E, 0xB7, 0xCA, 0x0E, 0x00, 0xD3, 0x01, 0x23, 0xC3, 0x03, 0x00, 0x76, 0x00, 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21, 0x00, 0x35],
    [
        0x06, 0x00, /* MVI B, 0 */
        0x0E, 0x06, /* MVI C, 6 */
        0x16, 0x00, /* MVI D, 1 */
        0x1E, 0x20, /* MVI E, 0 */
        0x26, 0x00, /* MVI H, 1 */
        0x2E, 0x30, /* MVI L, 10 */
        0xCD, 0x10, 0x00, /* call memcpy */
        0x76,   /* hlt */
        0x78,	/* memcpy: mov     a,b         ;Copy register B to register A */
        0xB1,	/* ora     c           ;Bitwise OR of A and C into register A */
        0xC8,	/* rz                  ;Return if the zero-flag is set high. */
        0x1A,	/* loop:       ldax    d           ;Load A from the address pointed by DE */
        0x77,	/* mov     m,a         ;Store A into the address pointed by HL */
        0x13,	/* inx     d           ;Increment DE */
        0x23,	/* inx     h           ;Increment HL */
        0x0B,	/* dcx     b           ;Decrement BC   (does not affect Flags) */
        0x78,	/* mov     a,b         ;Copy B to A    (so as to compare BC with zero) */
        0xB1,	/* ora     c           ;A = A | C      (set zero) */
        0xC2, 0x13, 0x00,	/* jnz     loop        ;Jump to 'loop:' if the zero-flag is not set. */
        0xC9,	/* ret */
        0x00, 0x00,
        0x6d, 0x65, 0x6d, 0x63, 0x70, 0x79 /* "memcpy" */
    ]];

//const data = [..."memcpy"].map(s => s.charCodeAt(0));


emulator.memory.set(programs[0], 0);

//emulator.memory.set(data, 0x100);


function selectProgram() {
    emulator.reset();
    emulator.memory.set(programs[Number((<HTMLInputElement>document.getElementById('program')).value)], 0);
    document.getElementById('output').innerHTML = '';
    refreshui();
}

function step(): void {
    emulator.step();
    refreshui();
}

function run(speed: number): void {
    if (runtimer) return;
    //document.querySelectorAll('button').forEach(b => b.disabled = true);
    document.getElementById('output').focus();
    const t0 = new Date().getTime();
    function fn() {
        for (let i = 0; i < speed; i++)
            emulator.step();
        refreshui();
        if (emulator.running) {
            runtimer = setTimeout(fn, 0);
        }
        else {
            //document.querySelectorAll('button').forEach(b => b.disabled = false);
            console.log('CPU halted. Ran ' + emulator.cycles + ' cycles in ' + ((new Date()).getTime() - t0) + ' milliseconds.');
        }
    }
    fn();
}


function reset() {
    emulator.reset();
    refreshui();
}

function refreshui(): void {
    document.getElementById('code').innerHTML = emulator.disasm(emulator.pc[0], 20).map(instr => '' + instr + '').join('');
    document.getElementById('register-values').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(r => '<td>' + ('00' + emulator.getReg(r).toString(16)).slice(-2) + '</td>').join('');
    const stack = Array.from(emulator.memory.slice(emulator.sp[0], Math.min(emulator.sp[0] + 40, 0xffff)));
    const stackwords = [];
    let addr = emulator.sp[0];
    while (stack.length > 1) {
        const lo = stack.shift();
        const hi = stack.shift();
        const val = lo + (hi << 8)
        stackwords.push('<li>' + ('0000' + addr.toString(16)).slice(-4) + ': ' + ('0000' + val.toString(16)).slice(-4) + '</li>');
        addr += 2;
    }
    document.getElementById('stack').innerHTML = stackwords.join('');
    const page: number = Number((<HTMLInputElement>document.getElementById('page')).value);
    document.getElementById('memory').innerHTML = '<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;00&#8239;01&#8239;02&#8239;03&#8239;04&#8239;05&#8239;06&#8239;07&#8239;08&#8239;09&#8239;0A&#8239;0B&#8239;0C&#8239;0D&#8239;0E&#8239;0F</b><br>' +
        Array.from(Array(16).keys()).map(i => '<b>' + ('0000' + (page * 0x100 + i * 16).toString(16).toUpperCase()).slice(-4) + '</b> ' + Array.from(Array(16).keys()).map(j =>
            ('00' + (emulator.memory[page * 0x100 + i * 16 + j]).toString(16)).slice(-2)
        ).join('&#8239;') + ' ' +
        Array.from(Array(16).keys()).map(j => displayChar(emulator.memory[page * 0x100 + i * 16 + j])).join('')
        ).join('<br>');
    document.getElementById('flags').innerHTML = "S:" + (+emulator.status.S) + " Z:" + (+emulator.status.Z) + " A:" + (+emulator.status.A) + " P:" + (+emulator.status.P) + " C:" + (+emulator.status.C);
    //JSON.stringify(emulator.status).replace(/["{}]/g,'').replace(/,/g,' ');
    document.getElementById('cycles').innerHTML = emulator.cycles.toString();
    //document.getElementById('instructions').innerHTML = emulator.instructions.toString();
}

function displayChar(ch: number): string {
    const str = String.fromCharCode(ch);
    if (str.match(/[A-Za-z0-9]/)) {
        return str;
    }
    else {
        return '.';
    }
}


function keydown(ev: KeyboardEvent) {
    if (ev.keyCode === 8) {
        emulator.input.push(ev.keyCode);
        ev.preventDefault();
        ev.stopPropagation();
    }
    else if (ev.keyCode === 27) {
        document.getElementById('output').blur();
    }
    else if (ev.ctrlKey && ev.keyCode !== 17) {
        emulator.input.push(ev.keyCode & 0b00111111);
        ev.preventDefault();
        ev.stopPropagation();
    }
}

function keypress(ev: KeyboardEvent) {
    if (ev.keyCode === 8) return;
    emulator.input.push(ev.keyCode);
    ev.preventDefault();
    ev.stopPropagation();
}


window.onload = function (ev: Event) {
    //cpudiag();
    basic();
    //tinybasic();
    //emulator.memory.set(programs[1], 0);
    refreshui();
}