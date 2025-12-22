#!/usr/bin/env node

import { glob } from 'glob';
import { spawn } from 'child_process';
import process from 'process';

const args = process.argv.slice(2);
const pattern = 'tests/**/*.test.js';

async function runTests() {
    try {
        const files = await glob(pattern);

        if (files.length === 0) {
            console.error(`Could not find any test files matching '${pattern}'`);
            process.exit(1);
        }

        const nodeArgs = ['--test', ...files, ...args];
        const child = spawn('node', nodeArgs, {
            stdio: 'inherit',
            shell: true
        });

        child.on('exit', (code) => {
            process.exit(code);
        });
    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

runTests();
