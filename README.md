# freshpublish

Cleaning script before publish.

## Install

```sh
npm Install -D freshpublish
```

## Usage

> [!CAUTION]
> Please init the git repository first.
> So after the script run, you can do this:
>
> ```sh
> git restore package.json README.md
> ```

Add this as [`prepack`]() script to your `package.json`:

```jsonc
{
	"script": {
		"prepack": "freshpublish",
	},
}
```

Test it by:

```sh
npm pack
```

Then see the result on the `.tgz` file.

Type `--help` for more information.

## Configuration

### Options

#### `cleanDocs`

Type: `boolean`\
Default: `false`

Keep only main section of `README.md`.

#### `fields`

Type: `Array<string>`\
Default: `[]`

Additional list of fields in the `package.json` file that you want to delete.

### Supported ways

#### `freshpublish` key on your `package.json`

```jsonc
{
	"freshpublish": {
		"cleanDocs": true,
	},
}
```

#### CLI Options

```sh
npx freshpublish --cleanDocs
```

> [!NOTE]
> CLI Options will overrides the configuration on `package.json`

## Acknowledgement

Inspired (and copied) from [`clean-publish`](https://github.com/shashkovdanil/clean-publish), but this is a smaller version. With **ONLY** cleaning the `package.json` and `README.md`.

## License

MIT
