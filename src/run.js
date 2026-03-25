import { cleanDocs, clearPackageJson } from "./core.js";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { dirname, join } from "node:path";

/**
 * CLI runner.
 * @param {Object} options Runner options
 * @param {Array<string>} options.args Array of argument
 * @param {string} options.cwd Directory to running the CLI
 * @param {(...args: any[]) => void} options.log Logger function
 * @param {(...args: any[]) => void} options.debug Logger function for debugging
 * @returns {Promise<void>}
 */
export const run = async ({ args, cwd, log, debug: debugLogger }) => {
	const { values } = parseArgs({
		args,
		options: {
			cleanDocs: { type: "boolean" },
			debug: { type: "boolean", short: "d" },
			fields: { type: "string" },
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
		},
	});

	const debug = values.debug ? debugLogger : () => {};

	debug("CLI options:", values);

	if (values.help) {
		log(`Usage: freshpublish [...options]`);
		log("");
		log("Options:");
		log("  --cleanDocs    Keep only main section of `README.md`");
		log("  --fields       Additional list of fields in the `package.json` file that you want to delete (comma separated)");
		log("  -d --debug     Show debug log");
		log("  -h --help      Show help");
		log("  -v --version   Show version");
		return;
	}

	if (values.version) {
		log(JSON.parse(await readFile(join(dirname(import.meta.dirname), "package.json"), "utf8")).version);
		return;
	}

	const packageJsonPath = join(cwd, "package.json");
	debug("Reading package.json file on", packageJsonPath);
	const packageJsonContent = await readFile(packageJsonPath, "utf8");
	const packageJson = JSON.parse(packageJsonContent);
	debug("Package.json:", packageJson);

	const freshpublish = packageJson.freshpublish ?? {};
	const config = {
		cleanDocs: values.cleanDocs ?? freshpublish.cleanDocs ?? false,
		fields: values.fields?.split?.(",") ?? freshpublish.fields ?? [],
	};
	debug("Configuration:", config);

	debug("Cleaning the package.json");
	const cleanPackageJson = clearPackageJson(packageJson, config.fields);
	debug("The clean result of package.json:", cleanPackageJson);
	const stringified = JSON.stringify(cleanPackageJson, null, /\t/.test(packageJsonContent) ? "\t" : 2);
	debug("Write back package.json to", packageJsonPath);
	await writeFile(packageJsonPath, stringified);

	if (config.cleanDocs === true) {
		debug("Try to find the readme file");
		const filename = (await readdir(cwd, { withFileTypes: true })).find(
			(file) => file.isFile() && /^readme\.(?:md|markdown)$/i.test(file.name),
		);

		if (filename !== undefined) {
			const readmePath = join(cwd, filename.name);
			debug("Found the readme file at", readmePath);

			debug("Reading readme file on", readmePath);
			const readmeContent = await readFile(readmePath, "utf8");
			debug("Readme:", readmeContent);

			debug("Cleaning readme file");
			const cleanReadme = cleanDocs(readmeContent, packageJson);
			debug("The clean result of readme:", cleanReadme);
			debug("Write back readme to", readmePath);
			await writeFile(readmePath, cleanReadme);
		}
	}

	log("Done!");
};
