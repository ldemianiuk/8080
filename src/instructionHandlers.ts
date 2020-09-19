import { e8080 } from './e8080';

const B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, M = 6, A = 7, F = 8;

const FLAG_S = 1 << 7, FLAG_Z = 1 << 6, FLAG_A = 1 << 4, FLAG_P = 1 << 2, FLAG_C = 1;

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

export function registerHandlers(): void {

    e8080.registerHandler('ACI', function (op, d8) {
        const result = this.add(this.getReg(A), d8, this.status.C);
        this.setReg(A, result);
    });
    e8080.registerHandler('ADC', function (op) {
        const result = this.add(this.getReg(A), this.getReg(SRC(op)), this.status.C);
        this.setReg(A, result);
    });
    e8080.registerHandler('ADD', function (op) {
        const result = this.add(this.getReg(A), this.getReg(SRC(op)), false);
        this.setReg(A, result);
    });
    e8080.registerHandler('ADI', function (op, d8) {
        const result = this.add(this.getReg(A), d8, false);
        this.setReg(A, result);
    });
    e8080.registerHandler('ANA', function (op) {
        const a = this.getReg(A);
        const b = this.getReg(SRC(op));
        const result = a & b;
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = ((a | b) & 0x08) != 0; // undocumented
    });
    e8080.registerHandler('ANI', function (op, d8) {
        const a = this.getReg(A);
        const b = d8;
        const result = a & b;
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = ((a | b) & 0x08) != 0; // undocumented
    });
    e8080.registerHandler('CALL', function (opcode, lo, hi) { this.call(hi, lo, 0) });
    e8080.registerHandler('CC', function (opcode, lo, hi) { if (this.status.C) this.call(hi, lo) });
    e8080.registerHandler('CM', function (opcode, lo, hi) { if (this.status.S) this.call(hi, lo) });
    e8080.registerHandler('CMA', function (_op) {
        this.setReg(A, this.getReg(A) ^ 0xff);
    });
    e8080.registerHandler('CMC', function (_op) { this.status.C = !this.status.C });
    e8080.registerHandler('CMP', function (op) {
        this.sub(this.getReg(A), this.getReg(SRC(op)), false);
    });
    e8080.registerHandler('CNC', function (opcode, lo, hi) { if (!this.status.C) this.call(hi, lo) });
    e8080.registerHandler('CNZ', function (opcode, lo, hi) { if (!this.status.Z) this.call(hi, lo) });
    e8080.registerHandler('CP', function (opcode, lo, hi) { if (!this.status.S) this.call(hi, lo) });
    e8080.registerHandler('CPE', function (opcode, lo, hi) { if (this.status.P) this.call(hi, lo) });
    e8080.registerHandler('CPI', function (op, d8) {
        this.sub(this.getReg(A), d8, false);
    });
    e8080.registerHandler('CPO', function (opcode, lo, hi) { if (!this.status.P) this.call(hi, lo) });
    e8080.registerHandler('CZ', function (opcode, lo, hi) { if (this.status.Z) this.call(hi, lo) });
    e8080.registerHandler('DAA', function (_op) {
        let a = this.getReg(A);
        let cy = this.status.C;
        let correction = 0;

        const lsb = a & 0x0F;
        const msb = a >> 4;

        if (this.status.A || lsb > 9) {
            correction += 0x06;
        }

        if (this.status.C || msb > 9 || (msb >= 9 && lsb > 9)) {
            correction += 0x60;
            cy = 1;
        }

        const result = this.add(a, correction, false);

        this.setReg(A, result);

        this.status.C = cy;
    });
    e8080.registerHandler('DAD', function (op) {
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
    });
    e8080.registerHandler('DCR', function (op) {
        const result = (this.getReg(DST(op)) - 1) & 0xff;
        this.setReg(DST(op), result);
        this.setFlags(result);
        this.status.A = !((result & 0xF) === 0xF);
    });
    e8080.registerHandler('DCX', function (op) {
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
    });
    e8080.registerHandler('DI', function (_op) { /* not implemented */ });
    e8080.registerHandler('EI', function (_op) { /* not implemented */ });
    e8080.registerHandler('HLT', function (_op) {
        this.running = false;
        this.pc[0]--;
    });
    e8080.registerHandler('IN', function (op, d8) {
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
    });
    e8080.registerHandler('INR', function (op) {
        const result = this.getReg(DST(op)) + 1;
        this.setReg(DST(op), result);
        this.setFlags(result);
        this.status.A = (result & 0xF) == 0;
    });
    e8080.registerHandler('INX', function (op) {
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
    });
    e8080.registerHandler('JC', function (op, lo, hi) { if (this.status.C) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JM', function (op, lo, hi) { if (this.status.S) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JMP', function (op, lo, hi) { this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JNC', function (op, lo, hi) { if (!this.status.C) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JNZ', function (op, lo, hi) { if (!this.status.Z) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JP', function (op, lo, hi) { if (!this.status.S) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JPE', function (op, lo, hi) { if (this.status.P) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JPO', function (op, lo, hi) { if (!this.status.P) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('JZ', function (op, lo, hi) { if (this.status.Z) this.pc[0] = WORD(hi, lo); });
    e8080.registerHandler('LDA', function (op, lo, hi) {
        this.setReg(A, this.memory[WORD(hi, lo)]);
    });
    e8080.registerHandler('LDAX', function (op) {
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
    });
    e8080.registerHandler('LHLD', function (op, lo, hi) {
        this.setReg(L, this.memory[WORD(hi, lo)]);
        this.setReg(H, this.memory[(WORD(hi, lo) + 1) & 0xffff]);
    });
    e8080.registerHandler('LXI', function (op, lo, hi) {
        if (op === 0x31) {
            this.sp[0] = WORD(hi, lo);
        }
        else {
            const reghi = DST(op);
            const reglo = reghi + 1;
            this.setReg(reghi, hi);
            this.setReg(reglo, lo);
        }
    });
    e8080.registerHandler('MOV', function (op) {
        this.setReg(DST(op), this.getReg(SRC(op)));
    });
    e8080.registerHandler('MVI', function (op, d8) {
        this.setReg(DST(op), d8);
    });
    e8080.registerHandler('NOP', function (_op) { });
    e8080.registerHandler('ORA', function (op) {
        const result = this.getReg(A) | this.getReg(SRC(op));
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = false; // undocumented
    });
    e8080.registerHandler('ORI', function (op, d8) {
        const result = this.getReg(A) | d8;
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = false; // undocumented
    });
    e8080.registerHandler('OUT', function (op, d8) {
        if (this.output$[d8].observers.length > 0) {
            this.output$[d8].next(this.getReg(A));
        }
        else {
            console.log(`OUT ${d8}, ${this.getReg(A)}`)
        }
    });
    e8080.registerHandler('PCHL', function (_op) {
        this.pc[0] = WORD(this.getReg(H), this.getReg(L));
    });
    e8080.registerHandler('POP', function (op) {
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
    });
    e8080.registerHandler('PUSH', function (op) {
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
    });
    e8080.registerHandler('RAL', function (_op) {
        const a = this.getReg(A);
        const c = +this.status.C;
        this.status.C = (a & 0b10000000) !== 0;
        this.setReg(A, (a << 1) | c);
    });
    e8080.registerHandler('RAR', function (_op) {
        const a = this.getReg(A);
        const c = +this.status.C;
        this.status.C = (a & 0b1) !== 0;
        this.setReg(A, (a >> 1) | (c << 7));
    });
    e8080.registerHandler('RC', function (_op) { if (this.status.C) this.ret(); });
    e8080.registerHandler('RET', function (_op) { this.ret(0); });
    e8080.registerHandler('RLC', function (_op) {
        const a = this.getReg(A);
        this.status.C = (a & 0b10000000) !== 0;
        this.setReg(A, (a << 1) | (+this.status.C));
    });
    e8080.registerHandler('RM', function (_op) { if (this.status.S) this.ret(); });
    e8080.registerHandler('RNC', function (_op) { if (!this.status.C) this.ret(); });
    e8080.registerHandler('RNZ', function (_op) { if (!this.status.Z) this.ret(); });
    e8080.registerHandler('RP', function (_op) { if (!this.status.S) this.ret(); });
    e8080.registerHandler('RPE', function (_op) { if (this.status.P) this.ret(); });
    e8080.registerHandler('RPO', function (_op) { if (!this.status.P) this.ret(); });
    e8080.registerHandler('RRC', function (_op) {
        const a = this.getReg(A);
        this.status.C = (a & 0b1) !== 0;
        this.setReg(A, (a >> 1) | ((+this.status.C) << 7));
    });
    e8080.registerHandler('RST', function (op) {
        const num = op & 0b111000;
        this.call(0, num, 0);
    });
    e8080.registerHandler('RZ', function (_op) { if (this.status.Z) this.ret(); });
    e8080.registerHandler('SBB', function (op) {
        this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op)), this.status.C));
    });
    e8080.registerHandler('SBI', function (op, d8) {
        this.setReg(A, this.sub(this.getReg(A), d8, this.status.C));
    });
    e8080.registerHandler('SHLD', function (op, lo, hi) {
        this.memory[WORD(hi, lo)] = this.getReg(L);
        this.memory[(WORD(hi, lo) + 1) & 0xffff] = this.getReg(H);
    });
    e8080.registerHandler('SPHL', function (_op) {
        this.sp[0] = WORD(this.getReg(H), this.getReg(L));
    });
    e8080.registerHandler('STA', function (op, lo, hi) {
        this.memory[WORD(hi, lo)] = this.getReg(A);
    });
    e8080.registerHandler('STAX', function (op) {
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
    });
    e8080.registerHandler('STC', function (_op) {
        this.status.C = true;
    });
    e8080.registerHandler('SUB', function (op) {
        this.setReg(A, this.sub(this.getReg(A), this.getReg(SRC(op)), false));
    });
    e8080.registerHandler('SUI', function (op, d8) {
        this.setReg(A, this.sub(this.getReg(A), d8), false);
    });
    e8080.registerHandler('XCHG', function (_op) {
        const d = this.getReg(D);
        const e = this.getReg(E);
        this.setReg(D, this.getReg(H));
        this.setReg(E, this.getReg(L));
        this.setReg(H, d);
        this.setReg(L, e);
    });
    e8080.registerHandler('XRA', function (op) {
        const result = this.getReg(A) ^ this.getReg(SRC(op));
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = false; // undocumented
    });
    e8080.registerHandler('XRI', function (op, d8) {
        const result = this.getReg(A) ^ d8;
        this.setReg(A, result);
        this.setFlags(result);
        this.status.C = false;
        this.status.A = false; // undocumented
    });
    e8080.registerHandler('XTHL', function (_op) {
        const l = this.getReg(L);
        const h = this.getReg(H);
        this.setReg(L, this.memory[this.sp[0]]);
        this.setReg(H, this.memory[this.sp[0] + 1]);
        this.memory[this.sp[0]] = l;
        this.memory[this.sp[0] + 1] = h;
    });

}