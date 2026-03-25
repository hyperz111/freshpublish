import { run } from "../src/run.js";
import { describe, it, beforeEach, afterEach } from "node:test";
import { tmpdir as getTmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";

describe("run", () => {
	const tmpdir = getTmpdir();
	const noop = () => {};

	/** @type {string} */
	let cwd;

	/**
	 * @param {Array<string>} lines
	 * @param {string} [name]
	 * @returns {Promise<string>}
	 */
	const createReadme = async (lines, name = "README.md") => {
		const p = join(cwd, name);
		await fs.writeFile(p, lines.join("\n"));
		return p;
	};

	/**
	 * @param {Object} jsonish
	 * @returns {Promise<string>}
	 */
	const createPackageJson = async (jsonish) => {
		const p = join(cwd, "package.json");
		await fs.writeFile(p, JSON.stringify(jsonish, null, 2));
		return p;
	};

	beforeEach(async () => {
		cwd = join(tmpdir, `freshpublish-test-fixture_${randomUUID()}`);
		await fs.mkdir(cwd, { recursive: true });
	});

	afterEach(async () => {
		await fs.rm(cwd, { recursive: true, force: true });
	});

	describe("cleaning", () => {
		it("should clean the package", async (t) => {
			const packageJson = await createPackageJson({
				name: "foobarquz",
				version: "1.0.0",
				dependencies: {
					semver: "^7",
					picocolors: "^1",
				},
				devDependencies: {
					"lint-staged": "^16",
					eslint: "^9",
				},
				"lint-staged": {
					"*.js": "eslint --fix",
				},
			});

			await run({
				cwd,
				args: [],
				log: noop,
				debug: noop,
			});

			t.assert.deepEqual(JSON.parse(await fs.readFile(packageJson, "utf8")), {
				name: "foobarquz",
				version: "1.0.0",
				dependencies: {
					semver: "^7",
					picocolors: "^1",
				},
			});
		});

		it("should clean readme if cleanDocs is enabled", async (t) => {
			const homepage = "https://example.homepage.com";
			await createPackageJson({
				name: "foobarquz",
				version: "1.0.0",
				dependencies: {
					semver: "^7",
					picocolors: "^1",
				},
				homepage,
				freshpublish: {
					cleanDocs: true,
				},
			});

			const readme = await createReadme([
				"# foobarquz",
				"",
				"consequat commodo eiusmod mollit reprehenderit laboris amet laboris cillum exercitation",
				"",
				"## How?",
				"",
				"mollit dolor Lorem pariatur dolore in est esse veniam deserunt",
				"",
			]);

			await run({
				cwd,
				args: [],
				log: noop,
				debug: noop,
			});

			t.assert.equal(
				await fs.readFile(readme, "utf8"),
				[
					"# foobarquz",
					"",
					"consequat commodo eiusmod mollit reprehenderit laboris amet laboris cillum exercitation",
					"",
					"## Docs",
					`Read full docs **[here](${homepage})**.`,
					"",
				].join("\n"),
			);
		});

		it("should reject if package.json is not available", (t) => {
			t.assert.rejects(() =>
				run({
					cwd,
					args: [],
					log: noop,
					debug: noop,
				}),
			);
		});

		it("should don't reject if cleanDocs is enabled but readme is not available", async (t) => {
			await createPackageJson({
				freshpublish: {
					cleanDocs: true,
				},
			});

			await t.assert.doesNotReject(() =>
				run({
					cwd,
					args: [],
					log: noop,
					debug: noop,
				}),
			);
		});
	});

	describe("configuration", () => {
		it("should read configuration from package.json", async (t) => {
			t.plan(1);

			await createPackageJson({
				name: "foo",
				version: "0.0.0",
				freshpublish: {
					cleanDocs: true,
					fields: ["custom-tool"],
				},
			});

			await run({
				cwd,
				args: ["--debug"],
				log: noop,
				debug: (...args) => {
					const [msg, value] = args;

					if (msg === "Configuration:") {
						t.assert.deepEqual(value, {
							cleanDocs: true,
							fields: ["custom-tool"],
						});
					}
				},
			});
		});

		it("should read configuration from CLI options", async (t) => {
			t.plan(1);

			await createPackageJson({
				name: "foo",
				version: "0.0.0",
			});

			await run({
				cwd,
				args: ["--debug", "--cleanDocs", "--fields=custom-tool,fine-tool"],
				log: noop,
				debug: (...args) => {
					const [msg, value] = args;

					if (msg === "Configuration:") {
						t.assert.deepEqual(value, {
							cleanDocs: true,
							fields: ["custom-tool", "fine-tool"],
						});
					}
				},
			});
		});

		it("should prior the CLI options than from package.json", async (t) => {
			t.plan(1);

			await createPackageJson({
				name: "foo",
				version: "0.0.0",
				freshpublish: {
					cleanDocs: false,
					fields: ["custom-tool"],
				},
			});

			await run({
				cwd,
				args: ["--debug", "--cleanDocs", "--fields=fine-tool"],
				log: noop,
				debug: (...args) => {
					const [msg, value] = args;

					if (msg === "Configuration:") {
						t.assert.deepEqual(value, {
							cleanDocs: true,
							fields: ["fine-tool"],
						});
					}
				},
			});
		});
	});

	describe("CLI Options", () => {
		["--help", "-h"].forEach((flag) => {
			it(`should show help with ${flag} flag`, async (t) => {
				await createPackageJson({});

				const logs = [];

				await run({
					cwd,
					args: [flag],
					log: (...args) => logs.push(args),
					debug: noop,
				});

				t.assert.ok(logs.length > 1);
				t.assert.ok(logs.some((log) => log.includes("Usage: freshpublish [...options]")));
			});
		});

		["--version", "-v"].forEach((flag) => {
			it(`should show version with ${flag} flag`, async (t) => {
				await createPackageJson({});

				const logs = [];

				await run({
					cwd,
					args: [flag],
					log: (...args) => logs.push(args),
					debug: noop,
				});

				t.assert.ok(logs.length === 1);
				t.assert.ok(/^[0-9]+\.[0-9]+\.[0-9]+$/.test(logs[0][0]));
			});
		});

		it("should enable debugging when --debug flag is passed", async (t) => {
			await createPackageJson({});

			const logs = [];

			await run({
				cwd,
				args: ["--debug"],
				debug: (...args) => logs.push(args),
				log: noop,
			});

			t.assert.ok(logs.length > 1);
		});
	});
});
