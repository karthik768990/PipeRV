export function parseAssemblyToTrace(asmCode: string): string {
    const lines = asmCode.split('\n');
    const traceLines: string[] = [];

    for (const line of lines) {
        // Remove comments and trim
        let cleanLine = line.split('#')[0].split('//')[0].trim();
        if (!cleanLine) continue;

        // Replace commas with spaces
        cleanLine = cleanLine.replace(/,/g, ' ').replace(/\s+/g, ' ');

        const parts = cleanLine.split(' ');
        const op = parts[0].toUpperCase();

        if (op === 'LW' || op === 'L') {
            // Support 'LW x5 0x1000' or 'LW 0x1000 x5'
            const p1 = parts[1];
            const p2 = parts[2];
            if (p1?.startsWith('0x')) {
                 traceLines.push(`L ${p1} ${p2}`);
            } else {
                 traceLines.push(`L ${p2} ${p1}`);
            }
        } else if (op === 'SW' || op === 'S') {
            const p1 = parts[1];
            const p2 = parts[2];
            if (p1?.startsWith('0x')) {
                 traceLines.push(`S ${p1} ${p2}`);
            } else {
                 traceLines.push(`S ${p2} ${p1}`);
            }
        } else if (op === 'ADD' || op === 'MUL' || op === 'SUB' || op === 'DIV') {
            // E.g., ADD x7 x5 x6
            traceLines.push(`${op} ${parts[1]} ${parts[2]} ${parts[3]}`);
        } else {
            // Fallback for other valid instructions or custom trace instructions
            traceLines.push(cleanLine);
        }
    }

    return traceLines.join('\n');
}
