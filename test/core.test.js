import { cleanDocs, clearPackageJson } from "../src/core.js";
import { describe, it } from "node:test";
/** @import { TestContext } from "node:test" */

describe("cleanDocs", () => {
	const readme = [
		"# The awesome npm package",
		"",
		"cillum duis amet cupidatat officia voluptate excepteur incididunt pariatur reprehenderit",
		"",
		"## How to",
		"",
		"1. id exercitation occaecat elit reprehenderit culpa aliqua qui commodo nisi",
		"2. ea velit nisi eu consequat velit ipsum incididunt minim eiusmod",
		"3. commodo culpa cillum tempor dolor commodo fugiat nulla minim quis",
		"",
		"## License",
		"",
		"UNLICENCED",
		"",
	].join("\n");

	it("should clean readme", (/** @type {TestContext} */ t) => {
		const packageJson = {
			homepage: "https://example.homepage.com",
			repository: "organization/package",
		};
		const cleaned = cleanDocs(readme, packageJson);

		t.assert.ok(readme !== cleaned);
	});

	describe("documentation link", () => {
		/**
		 * @param {string} url
		 * @returns {RegExp}
		 */
		const createLinkRegex = (url) => new RegExp(`\\*\\*\\[here\\]\\(${url}\\)\\*\\*`);

		it("should use homepage url if available", (/** @type {TestContext} */ t) => {
			const packageJson = {
				homepage: "https://example.homepage.com",
				repository: "organization/package",
			};
			const cleaned = cleanDocs(readme, packageJson);

			t.assert.ok(createLinkRegex(packageJson.homepage).test(cleaned));
		});

		it("should use repository url if homepage url is not available", (/** @type {TestContext} */ t) => {
			const packageJson = {
				repository: "https://github.com/organization/package",
			};
			const cleaned = cleanDocs(readme, packageJson);

			t.assert.ok(createLinkRegex(packageJson.repository).test(cleaned));
		});

		it("should support shorthand url as GitHub url", (/** @type {TestContext} */ t) => {
			const packageJson = {
				repository: "organization/package",
			};
			const cleaned = cleanDocs(readme, packageJson);

			t.assert.ok(createLinkRegex(`https://github.com/${packageJson.repository}#readme`).test(cleaned));
		});

		it("should support repository object", (/** @type {TestContext} */ t) => {
			const packageJson = {
				repository: { url: "https://github.com/organization/package" },
			};
			const cleaned = cleanDocs(readme, packageJson);

			t.assert.ok(createLinkRegex(packageJson.repository.url).test(cleaned));
		});
	});
});

describe("clearPackageJson", () => {
	it("should clean the package.json object", (/** @type {TestContext} */ t) => {
		const packageJson = {
			name: "foobar",
			version: "1.0.0",
			dependencies: {
				picocolors: "^1",
			},
			devDependencies: {
				eslint: "^10",
				prettier: "^3",
			},
			prettier: {
				semi: true,
			},
		};
		const cleaned = clearPackageJson(packageJson);

		t.assert.notDeepEqual(packageJson, cleaned);
		t.assert.deepEqual(cleaned, {
			name: "foobar",
			version: "1.0.0",
			dependencies: {
				picocolors: "^1",
			},
		});
	});

	it("should support additional ignore fields", (/** @type {TestContext} */ t) => {
		const packageJson = {
			name: "barquz",
			version: "3.7.0",
			dependencies: {
				tinyglobby: "^0.2.15",
			},
			devDependencies: {
				eslint: "^10",
				prettier: "^3",
			},
			prettier: {
				semi: true,
			},
			custom: {
				better: true,
			},
		};
		const cleaned = clearPackageJson(packageJson, ["custom"]);

		t.assert.notDeepEqual(packageJson, cleaned);
		t.assert.deepEqual(cleaned, {
			name: "barquz",
			version: "3.7.0",
			dependencies: {
				tinyglobby: "^0.2.15",
			},
		});
	});
});
