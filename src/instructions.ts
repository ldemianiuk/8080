export const instructionTable = ['NOP', 'LXI', 'STAX', 'INX', 'INR', 'DCR', 'MVI', 'RLC', 'NOP', 'DAD', 'LDAX', 'DCX', 'INR', 'DCR', 'MVI', 'RRC',
    'NOP', 'LXI', 'STAX', 'INX', 'INR', 'DCR', 'MVI', 'RAL', 'NOP', 'DAD', 'LDAX', 'DCX', 'INR', 'DCR', 'MVI', 'RAR',
    'NOP', 'LXI', 'SHLD', 'INX', 'INR', 'DCR', 'MVI', 'DAA', 'NOP', 'DAD', 'LHLD', 'DCX', 'INR', 'DCR', 'MVI', 'CMA',
    'NOP', 'LXI', 'STA', 'INX', 'INR', 'DCR', 'MVI', 'STC', 'NOP', 'DAD', 'LDA', 'DCX', 'INR', 'DCR', 'MVI', 'CMC',
    'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV',
    'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV',
    'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV',
    'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'HLT', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV', 'MOV',
    'ADD', 'ADD', 'ADD', 'ADD', 'ADD', 'ADD', 'ADD', 'ADD', 'ADC', 'ADC', 'ADC', 'ADC', 'ADC', 'ADC', 'ADC', 'ADC',
    'SUB', 'SUB', 'SUB', 'SUB', 'SUB', 'SUB', 'SUB', 'SUB', 'SBB', 'SBB', 'SBB', 'SBB', 'SBB', 'SBB', 'SBB', 'SBB',
    'ANA', 'ANA', 'ANA', 'ANA', 'ANA', 'ANA', 'ANA', 'ANA', 'XRA', 'XRA', 'XRA', 'XRA', 'XRA', 'XRA', 'XRA', 'XRA',
    'ORA', 'ORA', 'ORA', 'ORA', 'ORA', 'ORA', 'ORA', 'ORA', 'CMP', 'CMP', 'CMP', 'CMP', 'CMP', 'CMP', 'CMP', 'CMP',
    'RNZ', 'POP', 'JNZ', 'JMP', 'CNZ', 'PUSH', 'ADI', 'RST', 'RZ', 'RET', 'JZ', 'JMP', 'CZ', 'CALL', 'ACI', 'RST',
    'RNC', 'POP', 'JNC', 'OUT', 'CNC', 'PUSH', 'SUI', 'RST', 'RC', 'RET', 'JC', 'IN', 'CC', 'CALL', 'SBI', 'RST',
    'RPO', 'POP', 'JPO', 'XTHL', 'CPO', 'PUSH', 'ANI', 'RST', 'RPE', 'PCHL', 'JPE', 'XCHG', 'CPE', 'CALL', 'XRI', 'RST',
    'RP', 'POP', 'JP', 'DI', 'CP', 'PUSH', 'ORI', 'RST', 'RM', 'SPHL', 'JM', 'EI', 'CM', 'CALL', 'CPI', 'RST'];

export const instructionSize = [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 3, 3, 1, 1, 1, 2, 1, 1, 1, 3, 1, 1, 1, 2, 1,
    1, 3, 3, 1, 1, 1, 2, 1, 1, 1, 3, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 3, 3, 3, 1, 2, 1, 1, 1, 3, 3, 3, 3, 2, 1,
    1, 1, 3, 2, 3, 1, 2, 1, 1, 1, 3, 2, 3, 3, 2, 1,
    1, 1, 3, 1, 3, 1, 2, 1, 1, 1, 3, 1, 3, 3, 2, 1,
    1, 1, 3, 1, 3, 1, 2, 1, 1, 1, 3, 1, 3, 3, 2, 1];

export const instructionsDisasm =
    ['NOP', 'LXI B,', 'STAX B,', 'INX B,', 'INR B,', 'DCR B,', 'MVI B,', 'RLC', 'NOP', 'DAD B,', 'LDAX B,', 'DCX B,', 'INR C,', 'DCR C,', 'MVI C,', 'RRC',
        'NOP', 'LXI D,', 'STAX D,', 'INX D,', 'INR D,', 'DCR D,', 'MVI D,', 'RAL', 'NOP', 'DAD D,', 'LDAX D,', 'DCX D,', 'INR E,', 'DCR E,', 'MVI E,', 'RAR',
        'NOP', 'LXI H,', 'SHLD', 'INX H,', 'INR H,', 'DCR H,', 'MVI H,', 'DAA', 'NOP', 'DAD H,', 'LHLD', 'DCX H,', 'INR L,', 'DCR L,', 'MVI L,', 'CMA',
        'NOP', 'LXI SP,', 'STA', 'INX SP,', 'INR M,', 'DCR M,', 'MVI M,', 'STC', 'NOP', 'DAD SP,', 'LDA', 'DCX SP,', 'INR A,', 'DCR A,', 'MVI A,', 'CMC',
        'MOV B, B,', 'MOV B, C,', 'MOV B, D,', 'MOV B, E,', 'MOV B, H,', 'MOV B, L,', 'MOV B, M,', 'MOV B, A,', 'MOV C, B,', 'MOV C, C,', 'MOV C, D,', 'MOV C, E,', 'MOV C, H,', 'MOV C, L,', 'MOV C, M,', 'MOV C, A,',
        'MOV D, B,', 'MOV D, C,', 'MOV D, D,', 'MOV D, E,', 'MOV D, H,', 'MOV D, L,', 'MOV D, M,', 'MOV D, A,', 'MOV E, B,', 'MOV E, C,', 'MOV E, D,', 'MOV E, E,', 'MOV E, H,', 'MOV E, L,', 'MOV E, M,', 'MOV E, A,',
        'MOV H, B,', 'MOV H, C,', 'MOV H, D,', 'MOV H, E,', 'MOV H, H,', 'MOV H, L,', 'MOV H, M,', 'MOV H, A,', 'MOV L, B,', 'MOV L, C,', 'MOV L, D,', 'MOV L, E,', 'MOV L, H,', 'MOV L, L,', 'MOV L, M,', 'MOV L, A,',
        'MOV M, B,', 'MOV M, C,', 'MOV M, D,', 'MOV M, E,', 'MOV M, H,', 'MOV M, L,', 'HLT', 'MOV M, A,', 'MOV A, B,', 'MOV A, C,', 'MOV A, D,', 'MOV A, E,', 'MOV A, H,', 'MOV A, L,', 'MOV A, M,', 'MOV A, A,',
        'ADD B,', 'ADD C,', 'ADD D,', 'ADD E,', 'ADD H,', 'ADD L,', 'ADD M,', 'ADD A,', 'ADC B,', 'ADC C,', 'ADC D,', 'ADC E,', 'ADC H,', 'ADC L,', 'ADC M,', 'ADC A,',
        'SUB B,', 'SUB C,', 'SUB D,', 'SUB E,', 'SUB H,', 'SUB L,', 'SUB M,', 'SUB A,', 'SBB B,', 'SBB C,', 'SBB D,', 'SBB E,', 'SBB H,', 'SBB L,', 'SBB M,', 'SBB A,',
        'ANA B,', 'ANA C,', 'ANA D,', 'ANA E,', 'ANA H,', 'ANA L,', 'ANA M,', 'ANA A,', 'XRA B,', 'XRA C,', 'XRA D,', 'XRA E,', 'XRA H,', 'XRA L,', 'XRA M,', 'XRA A,',
        'ORA B,', 'ORA C,', 'ORA D,', 'ORA E,', 'ORA H,', 'ORA L,', 'ORA M,', 'ORA A,', 'CMP B,', 'CMP C,', 'CMP D,', 'CMP E,', 'CMP H,', 'CMP L,', 'CMP M,', 'CMP A,',
        'RNZ', 'POP B,', 'JNZ', 'JMP', 'CNZ', 'PUSH B,', 'ADI', 'RST 0,', 'RZ', 'RET', 'JZ', 'JMP', 'CZ', 'CALL', 'ACI', 'RST 1,',
        'RNC', 'POP D,', 'JNC', 'OUT', 'CNC', 'PUSH D,', 'SUI', 'RST 2,', 'RC', 'RET', 'JC', 'IN', 'CC', 'CALL', 'SBI', 'RST 3,',
        'RPO', 'POP H,', 'JPO', 'XTHL', 'CPO', 'PUSH H,', 'ANI', 'RST 4,', 'RPE', 'PCHL', 'JPE', 'XCHG', 'CPE', 'CALL', 'XRI', 'RST 5,',
        'RP', 'POP PSW,', 'JP', 'DI', 'CP', 'PUSH PSW,', 'ORI', 'RST 6,', 'RM', 'SPHL', 'JM', 'EI', 'CM', 'CALL', 'CPI', 'RST 7,'];

export const instructionCycles = [
    4, 10, 7, 5, 5, 5, 7, 4, 4, 10, 7, 5, 5, 5, 7, 4,
    4, 10, 7, 5, 5, 5, 7, 4, 4, 10, 7, 5, 5, 5, 7, 4,
    4, 10, 16, 5, 5, 5, 7, 4, 4, 10, 16, 5, 5, 5, 7, 4,
    4, 10, 13, 5, 10, 10, 10, 4, 4, 10, 13, 5, 5, 5, 7, 4,
    5, 5, 5, 5, 5, 5, 7, 5, 5, 5, 5, 5, 5, 5, 7, 5,
    5, 5, 5, 5, 5, 5, 7, 5, 5, 5, 5, 5, 5, 5, 7, 5,
    5, 5, 5, 5, 5, 5, 7, 5, 5, 5, 5, 5, 5, 5, 7, 5,
    7, 7, 7, 7, 7, 7, 7, 7, 5, 5, 5, 5, 5, 5, 7, 5,
    4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
    4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
    4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
    4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
    5, 10, 10, 10, 11, 11, 7, 11, 5, 10, 10, 10, 11, 17, 7, 11,
    5, 10, 10, 10, 11, 11, 7, 11, 5, 10, 10, 10, 11, 17, 7, 11,
    5, 10, 10, 18, 11, 11, 7, 11, 5, 5, 10, 5, 11, 17, 7, 11,
    5, 10, 10, 4, 11, 11, 7, 11, 5, 5, 10, 4, 11, 17, 7, 11
];

export const parityCache = [
    true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true, true, false, false, true, false, true, true, false, true, false, false, true, false, true, true, false, false, true, true, false, true, false, false, true
];

export const instructionDescription = [
    'No operation', 'B <- byte 3, C <- byte 2', '(BC) <- A', 'BC <- BC+1', 'B <- B+1', 'B <- B-1', 'B <- byte 2', 'A = A << 1; bit 0 = prev bit 7; CY = prev bit 7', 'INVALID No operation', 'HL = HL + BC', 'A <- (BC)', 'BC = BC-1', 'C <- C+1', 'C <-C-1', 'C <- byte 2', 'A = A >> 1; bit 7 = prev bit 0; CY = prev bit 0', 'INVALID No operation', 'D <- byte 3, E <- byte 2', '(DE) <- A', 'DE <- DE + 1', 'D <- D+1', 'D <- D-1', 'D <- byte 2', 'A = A << 1; bit 0 = prev CY; CY = prev bit 7', 'INVALID No operation', 'HL = HL + DE', 'A <- (DE)', 'DE = DE-1', 'E <-E+1', 'E <- E-1', 'E <- byte 2', 'A = A >> 1; bit 7 = prev bit 7; CY = prev bit 0', 'INVALID No operation', 'H <- byte 3, L <- byte 2', '(adr) <-L; (adr+1)<-H', 'HL <- HL + 1', 'H <- H+1', 'H <- H-1', 'H <- byte 2', 'Decimal adjust after addition', 'INVALID No operation', 'HL = HL + HI', 'L <- (adr); H<-(adr+1)', 'HL = HL-1', 'L <- L+1', 'L <- L-1', 'L <- byte 2', 'A <- !A', 'INVALID No operation', 'SP.hi <- byte 3, SP.lo <- byte 2', '(adr) <- A', 'SP = SP + 1', '(HL) <- (HL)+1', '(HL) <- (HL)-1', '(HL) <- byte 2', 'CY = 1', 'INVALID No operation', 'HL = HL + SP', 'A <- (adr)', 'SP = SP-1', 'A <- A+1', 'A <- A-1', 'A <- byte 2', 'CY=!CY', 'B <- B', 'B <- C', 'B <- D', 'B <- E', 'B <- H', 'B <- L', 'B <- (HL)', 'B <- A', 'C <- B', 'C <- C', 'C <- D', 'C <- E', 'C <- H', 'C <- L', 'C <- (HL)', 'C <- A', 'D <- B', 'D <- C', 'D <- D', 'D <- E', 'D <- H', 'D <- L', 'D <- (HL)', 'D <- A', 'E <- B', 'E <- C', 'E <- D', 'E <- E', 'E <- H', 'E <- L', 'E <- (HL)', 'E <- A', 'H <- B', 'H <- C', 'H <- D', 'H <- E', 'H <- H', 'H <- L', 'H <- (HL)', 'H <- A', 'L <- B', 'L <- C', 'L <- D', 'L <- E', 'L <- H', 'L <- L', 'L <- (HL)', 'L <- A', '(HL) <- B', '(HL) <- C', '(HL) <- D', '(HL) <- E', '(HL) <- H', '(HL) <- L', 'Halt', '(HL) <- A', 'A <- B', 'A <- C', 'A <- D', 'A <- E', 'A <- H', 'A <- L', 'A <- (HL)', 'A <- A', 'A <- A + B', 'A <- A + C', 'A <- A + D', 'A <- A + E', 'A <- A + H', 'A <- A + L', 'A <- A + (HL)', 'A <- A + A', 'A <- A + B + CY', 'A <- A + C + CY', 'A <- A + D + CY', 'A <- A + E + CY', 'A <- A + H + CY', 'A <- A + L + CY', 'A <- A + (HL) + CY', 'A <- A + A + CY', 'A <- A - B', 'A <- A - C', 'A <- A + D', 'A <- A - E', 'A <- A + H', 'A <- A - L', 'A <- A + (HL)', 'A <- A - A', 'A <- A - B - CY', 'A <- A - C - CY', 'A <- A - D - CY', 'A <- A - E - CY', 'A <- A - H - CY', 'A <- A - L - CY', 'A <- A - (HL) - CY', 'A <- A - A - CY', 'A <- A & B', 'A <- A & C', 'A <- A & D', 'A <- A & E', 'A <- A & H', 'A <- A & L', 'A <- A & (HL)', 'A <- A & A', 'A <- A ^ B', 'A <- A ^ C', 'A <- A ^ D', 'A <- A ^ E', 'A <- A ^ H', 'A <- A ^ L', 'A <- A ^ (HL)', 'A <- A ^ A', 'A <- A | B', 'A <- A | C', 'A <- A | D', 'A <- A | E', 'A <- A | H', 'A <- A | L', 'A <- A | (HL)', 'A <- A | A', 'A - B', 'A - C', 'A - D', 'A - E', 'A - H', 'A - L', 'A - (HL)', 'A - A', 'if NZ, RET', 'C <- (sp); B <- (sp+1); sp <- sp+2', 'if NZ, PC <- adr', 'PC <= adr', 'if NZ, CALL adr', '(sp-2)<-C; (sp-1)<-B; sp <- sp - 2', 'A <- A + byte', 'CALL $0', 'if Z, RET', 'PC.lo <- (sp); PC.hi<-(sp+1); SP <- SP+2', 'if Z, PC <- adr', 'INVALID PC <= adr', 'if Z, CALL adr', '(SP-1)<-PC.hi;(SP-2)<-PC.lo;SP<-SP-2;PC=adr', 'A <- A + data + CY', 'CALL $8', 'if NCY, RET', 'E <- (sp); D <- (sp+1); sp <- sp+2', 'if NCY, PC<-adr', 'Output AL to port D8', 'if NCY, CALL adr', '(sp-2)<-E; (sp-1)<-D; sp <- sp - 2', 'A <- A - data', 'CALL $10', 'if CY, RET', 'INVALID RET', 'if CY, PC<-adr', 'Input from port D8 to AL', 'if CY, CALL adr', 'INVALID CALL', 'A <- A - data - CY', 'CALL $18', 'if PO, RET', 'L <- (sp); H <- (sp+1); sp <- sp+2', 'if PO, PC <- adr', 'L <-> (SP); H <-> (SP+1)', 'if PO, CALL adr', '(sp-2)<-L; (sp-1)<-H; sp <- sp - 2', 'A <- A & data', 'CALL $20', 'if PE, RET', 'PC.hi <- H; PC.lo <- L', 'if PE, PC <- adr', 'H <-> D; L <-> E', 'if PE, CALL adr', 'INVALID CALL', 'A <- A ^ data', 'CALL $28', 'if P, RET', 'flags <- (sp); A <- (sp+1); sp <- sp+2', 'if P=1 PC <- adr', 'Disable interrputs', 'if P, PC <- adr', '(sp-2)<-flags; (sp-1)<-A; sp <- sp - 2', 'A <- A | data', 'CALL $30', 'if M, RET', 'SP=HL', 'if M, PC <- adr', 'Enable interrputs', 'if M, CALL adr', 'INVALID CALL', 'A - data', 'CALL $38',
];
