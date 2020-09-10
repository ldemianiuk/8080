import { cpu_diag, cpm } from './cpudiag';
import { ex1com } from './ex1';
import { msbasic } from './msbasic';
//import { precom } from './pre';
import { tinybas } from './tinybas';
import { e8080 } from './e8080';
import 'index.scss';


let emulator = new e8080();
let output = '';
emulator.output$[1].subscribe(ch => {
    if (ch === 13) return;
    if (ch === 8) {
        output = output.substr(0, output.length - 1);
    }
    else {
        output += String.fromCharCode(ch);
    }
    let outpt = document.getElementById('output');
    outpt.innerHTML = escapeHtml(output) + '<span class="blinking-cursor"> </span>';
    outpt.scrollTop = outpt.scrollHeight;
});
let runtimer: number;
let breakpoint: number = null;
let disasmstart: number = null;

function cpudiag() {   
    reset();
    emulator.memory.set([0x76], 0);
    emulator.memory.set([0xc3, 0x06, 0xec], 0x05);
    emulator.memory.set(cpm, 0xec06);
    emulator.memory.set(cpu_diag, 0x100);
    emulator.pc[0] = 0x100;
    updateui();
}

function basic() {
    reset();
    emulator.memory.set(msbasic, 0x1000);
    emulator.pc[0] = 0x1000;
    updateui();
}

function ex1() {
    reset();
    emulator.memory.set([0x76], 0);
    emulator.memory.set([0xc3, 0x06, 0xec], 0x05);
    emulator.memory.set(cpm, 0xec06);
    emulator.memory.set(ex1com, 0x100);
    emulator.pc[0] = 0x100;
    updateui();
}



function tinybasic() {
    reset();
    
    emulator.memory.set(tinybas);
    updateui();
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
        0x6d, 0x65, 0x6d, 0x63, 0x70, 0x79 /* 'memcpy' */
    ]];

//const data = [...'memcpy'].map(s => s.charCodeAt(0));


//emulator.memory.set(programs[0], 0);

//emulator.memory.set(data, 0x100);


function selectProgram() {
    emulator.reset();
    emulator.memory.set(programs[Number((<HTMLInputElement>document.getElementById('program')).value)], 0);
    document.getElementById('output').innerHTML = '';
    updateui();
}

function step(): void {
    clearTimeout(runtimer);
    runtimer = null;
    emulator.step();
    updateui();
}

function run(speed: number): void {
    if (runtimer) return;
    //document.querySelectorAll('button').forEach(b => b.disabled = true);
    document.getElementById('output').focus();
    const t0 = new Date().getTime();
    function fn() {
        for (let i = 0; i < speed; i++) {
            emulator.step();
            if (emulator.pc[0] === breakpoint) {
                runtimer = null;
                updateui();
                return;
            }
        }
        updateui();
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
    clearTimeout(runtimer);
    runtimer = null;
    emulator.reset();
    output = '';
    document.getElementById('output').innerHTML = '';
    updateui();
}

function setbreakpoint(): boolean {
    breakpoint = parseInt((<HTMLInputElement>document.getElementById('breakpoint')).value, 16);
    return false;
}

function clearbreakpoint(): void {
    breakpoint = null;
}

function updateui(): void {
    if (disasmstart === null || emulator.pc[0] < disasmstart) disasmstart = emulator.pc[0];
    let ds = emulator.disasm(disasmstart, 20);
    if (emulator.pc[0] > ds[15][0]) {
        disasmstart = emulator.pc[0];
        ds = emulator.disasm(disasmstart, 20);
    }
    document.getElementById('code').innerHTML =
        ds.map(instr => `<li ${instr[0] === emulator.pc[0] ? 'id="current"' : ''}><span><span class="address">${displayWord(instr[0])}</span>: ${instr[1]}</span></li>`).join('');
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
    document.getElementById('flags').innerHTML = 'S:' + (+emulator.status.S) + ' Z:' + (+emulator.status.Z) + ' A:' + (+emulator.status.A) + ' P:' + (+emulator.status.P) + ' C:' + (+emulator.status.C);
    //JSON.stringify(emulator.status).replace(/['{}]/g,'').replace(/,/g,' ');
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

function displayByte(n: number): string {
    return ('00' + n.toString(16)).slice(-2);
}

function displayWord(n: number): string {
    return ('0000' + n.toString(16)).slice(-4);
}


function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&quot;')
        .replace(/'/g, '&#039;');
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


window.onload = function () {
    //cpudiag();
    basic();
    //tinybasic();
    //emulator.memory.set(programs[1], 0);
    //ex1();
    updateui();
    document.getElementById('run').onclick = () => run(100);
    document.getElementById('animate').onclick = () => run(1);
    document.getElementById('step').onclick = step;
    document.getElementById('reset').onclick = cpudiag;
    document.getElementById('setbreakpoint').onclick = setbreakpoint;
    document.getElementById('clearbreakpoint').onclick = clearbreakpoint;
    document.getElementById('output').onkeypress = keypress;
    document.getElementById('output').onkeydown = keydown;
    document.getElementById('page').onchange = updateui;
}

