import MemoryMap from './intel-hex';
import { e8080 } from './e8080';
import { bdos } from './bdos';
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
let breakpoints: number[] = [];
let disasmstart: number = null;


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
            if (breakpoints.includes(emulator.pc[0])) {
                runtimer = null;
                updateui();
                return;
            }
        }
        updateui();
        if (emulator.running) {
            runtimer = window.setTimeout(fn, 0);
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
    const bpInput = <HTMLInputElement>document.getElementById('breakpoint');
    const addr: number = parseInt(bpInput.value, 16);
    if (isNaN(addr)) return false;
    if (breakpoints.includes(addr)) return false;
    breakpoints.push(addr);
    const bp = <HTMLSelectElement> document.getElementById('breakpoints');
    let option = document.createElement('option');
    option.text = displayWord(addr) + ': ' + emulator.disasm(addr);
    option.value = addr.toString(16);
    bp.add(option);
    bpInput.value = '';
    return false;
}

function removebreakpoint(): boolean {
    const bp = <HTMLSelectElement> document.getElementById('breakpoints');
    const i = bp.selectedIndex;
    if (i < 0) return false;
    const addr: number = parseInt(bp.options.item(i).value, 16);
    breakpoints = breakpoints.filter(a => a !== addr);
    bp.options.remove(i);
    return false;
}

function clearbreakpoint(): void {
    breakpoints = [];
    const bp = <HTMLSelectElement> document.getElementById('breakpoints');
    const len = bp.options.length;
    for (let i = len - 1; i >= 0; i--) {
        bp.options.remove(i);
    }
}

function updateui(): void {
    if (disasmstart === null || emulator.pc[0] < disasmstart) disasmstart = emulator.pc[0];
    let ds = emulator.disasm(disasmstart, 20);
    if (emulator.pc[0] > ds[15][0]) {
        disasmstart = emulator.pc[0];
        ds = emulator.disasm(disasmstart, 20);
    }
    document.getElementById('code').innerHTML =
        ds.map(instr => `<li ${instr[0] === emulator.pc[0] ? 'id="current"' : ''}><span class="tooltip"><span class="address">${displayWord(instr[0])}</span>: ${instr[1]}<span class="tooltiptext">${instr[2]}</span></span></li>`).join('');
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

function loadCode(): void {
    const hex = (<HTMLInputElement>document.getElementById('loadcode')).value.replace(/^\s+|\s+$/g, '');
    let memMap = MemoryMap.fromHex(hex);

    reset();
    emulator.memory.set([0x76, 0, 0, 0, 0, 0xc3, 0x06, 0xec, 0x76], 0);
    emulator.memory.set(bdos, 0xec06);

    for (var [key, value] of memMap) {
        emulator.memory.set(value, key);
    }

    if (memMap.ip !== null) {
        emulator.pc[0] = memMap.ip;
    }
    else {
        emulator.pc[0] = 0x100;
    }

    updateui();
}

function uploadHex(event: any) {
    const reader = new FileReader();
    reader.onload = (txt) => {
        let hex = <HTMLInputElement>document.getElementById('loadcode');
        hex.value = <string> txt.target.result;
    };
    reader.readAsText(event.target.files[0]);
}

function getProgramIndex() {
    fetch('programs/index').then(response => response.text()).then(text => {
        const programs = text.split('\n').map(line => line.split(':'));
        const pr = <HTMLSelectElement> document.getElementById('programs');
        programs.map(program => {
            let option = document.createElement('option');
            option.value = program[0];
            option.text = program[1];
            pr.options.add(option);
        })
        pr.options.selectedIndex = -1;
    }).catch(e => console.log(e));
}

function loadProgram(file: string) {
    fetch(`programs/${file}`).then(response => response.text()).then(text => {
        let hex = <HTMLInputElement>document.getElementById('loadcode');
        hex.value = text;
    }).catch(e => console.log(e));
}

function selectProgram() {
    const pr = <HTMLSelectElement> document.getElementById('programs');
    if (pr.selectedIndex == -1) return;
    const program: string = pr.options.item(pr.selectedIndex).value;
    loadProgram(program);
}

window.onload = function () {
    //emulator.memory.set([0xc3, 0xff, 0xff]);
    //emulator.memory.set([0xc3], 0xffff);
    //cpudiag();
    //c_test();
    //basic();
    //tinybasic();
    //emulator.memory.set(programs[1], 0);
    //ex1();
    document.getElementById('run').onclick = () => run(10000);
    document.getElementById('animate').onclick = () => run(1);
    document.getElementById('step').onclick = step;
    document.getElementById('reset').onclick = reset;
    document.getElementById('setbreakpoint').onclick = setbreakpoint;
    document.getElementById('clearbreakpoint').onclick = clearbreakpoint;
    document.getElementById('removebreakpoint').onclick = removebreakpoint;
    document.getElementById('load').onclick = loadCode;
    document.getElementById('output').onkeypress = keypress;
    document.getElementById('output').onkeydown = keydown;
    document.getElementById('page').onchange = updateui;
    document.getElementById('loadfile').onchange = uploadHex;
    document.getElementById('programs').onchange = selectProgram;
    getProgramIndex();
    loadCode();
    updateui();
}

