// Some codes are from https://github.com/shashkovdanil/clean-publish

/**
 * Clean `README.md` and add a link to the full documentation.
 * @param {string} content README content
 * @param {{ repository?: Object | string, homepage?: string }} packageJson package.json content
 * @returns {string}
 */
export const cleanDocs = (content, packageJson) => {
	const { repository, homepage } = packageJson;
	let url = homepage;

	if (url == null) {
		const repositoryUrl = typeof repository === "object" ? repository.url : repository;
		if (repositoryUrl != null) {
			try {
				new URL(repositoryUrl);
				url = repositoryUrl;
			} catch {
				const name = repositoryUrl.match(/[^/:]+\/[^/:]+$/)?.[0];
				url = `https://github.com/${name}#readme`;
			}

			url = url.replace(/\.git$/, "");
		}
	}

	const cleaned = [content.split(/\n##\s*\w/m)[0], "## Docs", `Read full docs **[here](${url})**.`, ""];

	return cleaned.join("\n");
};

/**
 * @param {*} value
 * @returns {boolean}
 */
const isObject = (value) => Boolean(value) && typeof value === "object";

/**
 * @param {*} object
 * @param {Array<string>} keys
 * @returns {boolean}
 */
const deleteProperty = (object, keys) => {
	if (!isObject(object)) {
		return false;
	}

	const key = keys.shift();
	if (key === undefined) {
		return false;
	}

	if (keys.length === 0) {
		return delete object[key];
	}

	return deleteProperty(object[key], keys);
};

const IGNORE_FIELDS = [
	"babel",
	"browserslist",
	"c8",
	"commitlint",
	"devDependencies",
	"eslintConfig",
	"eslintIgnore",
	"freshpublish",
	"husky",
	"jest",
	"lint-staged",
	"nano-staged",
	"pre-commit",
	"prettier",
	"pwmetrics",
	"remarkConfig",
	"renovate",
	"resolutions",
	"sharec",
	"simple-git-hooks",
	"simple-pre-commit",
	"size-limit",
	"typeCoverage",
	"yaspeller",
	"pnpm",
];

const NPM_SCRIPTS = [
	"postinstall",
	"postpack",
	"postpublish",
	"postversion",
	"prepare",
	"prepublish",
	"publish",
	"uninstall",
	"version",
];

/**
 * Clean `package.json` content.
 * @param {Object} packageJson package.json content
 * @param {Array<string>} [inputIgnoreFields] List of fields that you want to delete
 * @returns {Object}
 */
export const clearPackageJson = (packageJson, inputIgnoreFields = []) => {
	const ignoreFields = [...IGNORE_FIELDS, ...inputIgnoreFields];

	const cleanPackageJSON = structuredClone(packageJson);

	for (const field of ignoreFields) {
		deleteProperty(
			cleanPackageJSON,
			field.split(/(?<!\\)\./).map((s) => s.replace("\\.", ".")),
		);
	}

	if (cleanPackageJSON.scripts && !ignoreFields.includes("scripts")) {
		for (const script in cleanPackageJSON.scripts) {
			if (!NPM_SCRIPTS.includes(script)) {
				delete cleanPackageJSON.scripts[script];
			}
		}
	}

	for (const i in cleanPackageJSON) {
		if (isObject(cleanPackageJSON[i]) && Object.keys(cleanPackageJSON[i]).length === 0) {
			delete cleanPackageJSON[i];
		}
	}
	return cleanPackageJSON;
};
