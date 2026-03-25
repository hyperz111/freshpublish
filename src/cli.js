#!/usr/bin/env node
import { run } from "./run.js";
import { styleText } from "node:util";

try {
	await run({
		args: process.argv.slice(2),
		cwd: process.cwd(),
		log: console.log,
		debug: (...args) => console.debug(styleText("blue", "[freshpublish]"), ...args),
	});
} catch (error) {
	console.error(`${error.code ?? error.name}:`, error.message);
	process.exit(1);
}
