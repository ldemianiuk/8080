import MemoryMap from './intel-hex';
import { e8080 } from './e8080';
import { bdos } from './bdos';
import 'index.scss';
import * as Xterm from 'xterm';

const emulator = new e8080();
let term: Xterm.Terminal;
let output = '';
let runtimer: number;
let breakpoints: number[] = [];
let disasmstart: number = null;


emulator.output$[1].subscribe(ch => {
    // clear the terminal on \f
    if (ch === 12) {
        term.write('\x1b[2J\x1b[1;1H');
    }
    else {
        term.write(String.fromCharCode(ch));
        output += String.fromCharCode(ch);
    }
});



function step(): void {
    stopRunning();
    emulator.step();
    updateui();
}

function stopRunning(): void {
    if (runtimer !== null) {
        clearTimeout(runtimer);
        runtimer = null;
    }
}


function run(instructions: number): void {
    if (runtimer) return;
    const t0 = new Date().getTime();
    function fn() {
        for (let i = 0; i < instructions; i++) {
            //const op = emulator.memory[emulator.pc[0]];
            emulator.step();
            if (breakpoints.includes(emulator.pc[0])) {
                runtimer = null;
                updateui();
                return;
            }
            //if (op === 0xd3 || op === 0xdb) break;
        }
        if (instructions === 1) {
            updateui();
        }
        else {
            updatecycles();
        }
        if (emulator.running) {
            runtimer = window.setTimeout(fn, 0);
        }
        else {
            console.log('CPU halted. Ran ' + emulator.cycles + ' cycles in ' + ((new Date()).getTime() - t0) + ' milliseconds.');
            if (emulator.traceon) {
                downloadTrace();
            }
        }
    }
    fn();
}

function downloadTrace() {
    if (emulator.trace.length === 0) return;
    emulator.traceon = false;
    (document.getElementById('trace') as HTMLInputElement).checked = false;
    let trace = '';
    for (let i = 0; i < emulator.trace.length; i++) {
        const instr = emulator.trace[i];
        if (instr === undefined) continue;
        trace += `${emulator.calls[i] ? '->\n' : ''}${displayWord(i)}: ${instr}\n`;
    }
    download(`trace ${formatDate(new Date())}.txt`, trace);
}

function formatDate(d: Date): string {
    function pad2(n: number): string {
        return ('00' + String(n)).slice(-2);
    }
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}


function reset() {
    stopRunning();
    emulator.reset();
    setTimeout(() => term.reset(), 100); // HACK
    (document.getElementById('trace') as HTMLInputElement).checked = false;
    updateui();
}

function setbreakpoint(): boolean {
    const bpInput = <HTMLInputElement>document.getElementById('breakpoint');
    const addr: number = parseInt(bpInput.value, 16);
    if (isNaN(addr)) return false;
    if (breakpoints.includes(addr)) return false;
    breakpoints.push(addr);
    const bp = <HTMLSelectElement>document.getElementById('breakpoints');
    const option = document.createElement('option');
    option.text = displayWord(addr) + ': ' + emulator.disasm(addr);
    option.value = addr.toString(16);
    bp.add(option);
    bpInput.value = '';
    return false;
}

function removebreakpoint(): boolean {
    const bp = <HTMLSelectElement>document.getElementById('breakpoints');
    const i = bp.selectedIndex;
    if (i < 0) return false;
    const addr: number = parseInt(bp.options.item(i).value, 16);
    breakpoints = breakpoints.filter(a => a !== addr);
    bp.options.remove(i);
    return false;
}

function clearbreakpoint(): void {
    breakpoints = [];
    const bp = <HTMLSelectElement>document.getElementById('breakpoints');
    const len = bp.options.length;
    for (let i = len - 1; i >= 0; i--) {
        bp.options.remove(i);
    }
}

function updatecycles() {
    document.getElementById('cycles').innerHTML = emulator.cycles.toString();
}

function disasm(instructions: number, threshold: number) {
    if (disasmstart === null || emulator.pc[0] < disasmstart) {
        disasmstart = emulator.pc[0];
    }
    let ds = emulator.disasm(disasmstart, instructions);
    if (emulator.pc[0] > ds[threshold].addr) {
        disasmstart = emulator.pc[0];
        ds = emulator.disasm(disasmstart, instructions);
    }
    return ds;
}

function updateui(): void {
    
    const disassembly = disasm(15, 10);

    document.getElementById('code').innerHTML =
        disassembly.map(ds =>
            `<li ${ds.addr === emulator.pc[0] ? 'id="current"' : ''}>
                <span class="tooltip">
                    <span class="address">${displayWord(ds.addr)}</span>
                    : ${ds.instr}
                    <span class="tooltiptext">
                    ${ds.description}
                </span>
            </span>
        </li>`).join('');

    document.getElementById('register-values').innerHTML =
        [0, 1, 2, 3, 4, 5, 6, 7].map(r =>
            `<td>${displayByte(emulator.getReg(r))}</td>`).join('');

    document.getElementById('flags').innerHTML =
        `S:${+emulator.status.S} Z:${+emulator.status.Z} A:${+emulator.status.A} P:${+emulator.status.P} C:${+emulator.status.C}`;

    document.getElementById('cycles').innerHTML = emulator.cycles.toString();


    const stack = Array.from(emulator.memory.slice(emulator.sp[0], Math.min(emulator.sp[0] + 40, 0xffff)));
    const stackwords = [];
    let addr = emulator.sp[0];
    while (stack.length > 1) {
        const lo = stack.shift();
        const hi = stack.shift();
        const val = lo + (hi << 8)
        stackwords.push(`<li>${displayWord(addr)}: ${displayWord(val)}</li>`);
        addr += 2;
    }
    document.getElementById('stack').innerHTML = stackwords.join('');

    const page = Number((<HTMLInputElement>document.getElementById('page')).value);

    document.getElementById('memory').innerHTML = '<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;00&#8239;01&#8239;02&#8239;03&#8239;04&#8239;05&#8239;06&#8239;07&#8239;08&#8239;09&#8239;0A&#8239;0B&#8239;0C&#8239;0D&#8239;0E&#8239;0F</b><br>' +
        Array.from(Array(16).keys()).map(i => '<b>' + ('0000' + (page * 0x100 + i * 16).toString(16).toUpperCase()).slice(-4) + '</b> ' + Array.from(Array(16).keys()).map(j =>
            ('00' + (emulator.memory[page * 0x100 + i * 16 + j]).toString(16)).slice(-2)
        ).join('&#8239;') + ' ' +
            Array.from(Array(16).keys()).map(j => displayChar(emulator.memory[page * 0x100 + i * 16 + j])).join('')
        ).join('<br>');

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


function loadCode(): void {
    const hex = (<HTMLInputElement>document.getElementById('loadcode')).value.replace(/^\s+|\s+$/g, '');
    const memMap = MemoryMap.fromHex(hex);

    reset();
    emulator.memory.set([0x76, 0, 0, 0, 0, 0xc3, 0x06, 0xec, 0x76], 0);
    emulator.memory.set(bdos, 0xec06);

    for (const [key, value] of memMap) {
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

function uploadHex(event: Event) {
    const reader = new FileReader();
    reader.onload = (txt) => {
        const hex = <HTMLInputElement>document.getElementById('loadcode');
        hex.value = <string>txt.target.result;
    };
    reader.readAsText((event.target as HTMLInputElement).files[0]);
}

function getProgramIndex() {
    fetch('programs/index').then(response => response.text()).then(text => {
        const programs = text.split('\n').map(line => line.split(':'));
        const pr = <HTMLSelectElement>document.getElementById('programs');
        programs.map(program => {
            const option = document.createElement('option');
            option.value = program[0];
            option.text = program[1];
            pr.options.add(option);
        })
        pr.options.selectedIndex = -1;
    }).catch(e => console.log(e));
}

function loadProgram(file: string) {
    fetch(`programs/${file}`).then(response => response.text()).then(text => {
        const hex = <HTMLInputElement>document.getElementById('loadcode');
        hex.value = text;
        loadCode();
    }).catch(e => console.log(e));
}

function selectProgram() {
    const pr = <HTMLSelectElement>document.getElementById('programs');
    if (pr.selectedIndex == -1) return;
    const program: string = pr.options.item(pr.selectedIndex).value;
    loadProgram(program);
}

function download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function switchTrace(event: Event) {
    if ((event.target as HTMLInputElement).checked) {
        emulator.traceon = true;
    }
    else {
        emulator.traceon = false;
        downloadTrace();
    }
}

window.onload = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).fonts.ready.then(() => {
        Xterm.Terminal.strings.promptLabel = '';

        term = new Xterm.Terminal({
            convertEol: true,
            fontFamily: 'VT323',
            fontSize: 20,
            rows: 20,
            cols: 80,
            theme: { background: '#151617', foreground: '#33ff33' },
        });

        term.open(document.getElementById('xterm'));
        //term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        term.onData((data, _) => {
            emulator.input.push(...[...data].map(ch => ch.charCodeAt(0)));
        });
    });


    document.getElementById('run').onclick = () => run(100000);
    document.getElementById('animate').onclick = () => run(1);
    document.getElementById('step').onclick = step;
    document.getElementById('reset').onclick = loadCode;
    document.getElementById('setbreakpoint').onclick = setbreakpoint;
    document.getElementById('clearbreakpoint').onclick = clearbreakpoint;
    document.getElementById('removebreakpoint').onclick = removebreakpoint;
    document.getElementById('load').onclick = loadCode;
    document.getElementById('loadfile').onchange = uploadHex;
    document.getElementById('programs').onchange = selectProgram;
    document.getElementById('trace').onchange = switchTrace;
    document.getElementById('page').onchange = updateui;
    getProgramIndex();
    loadCode();
    updateui();
}
