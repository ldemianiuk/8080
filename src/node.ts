import { e8080 } from './e8080';
import { bdos } from './bdos';
import MemoryMap from './intel-hex';
import * as fs from 'fs';


const emulator = new e8080();
emulator.output$[1].subscribe(ch => {
    process.stdout.write(String.fromCharCode(ch))
});

const filename = process.argv[2];


fs.readFile(filename, 'utf8', (err: NodeJS.ErrnoException, data: string) => {
    if (err) {
        return console.log(err);
    }
    const hex = data;

    const memMap = MemoryMap.fromHex(hex);

    emulator.memory.set([0x76, 0, 0, 0, 0, 0xc3, 0x06, 0xec, 0x76], 0);
    emulator.memory.set(bdos, 0xec06);

    for (const [key, value] of memMap) {
        emulator.memory.set(value, key);
    }

    if (memMap.ip !== null) {
        emulator.pc = memMap.ip;
    }
    else {
        emulator.pc = 0x100;
    }

    let t = process.hrtime();
    while (emulator.running) {
        emulator.step();
    }
    t = process.hrtime(t);

    console.log('\n');
    console.log(emulator.cycles / (t[0]*1e6 + t[1]/1e3));
});
