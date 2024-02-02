import { cliffy, fs, path } from "./deps.ts";

function timestampToDate(timestamp: string): string | undefined {
  try {
    // const outputDate = new Date(parseInt(timestamp) * 1e3);
    const outputDate = new Date(parseInt(timestamp));
    const isoString = outputDate.toISOString();
    // Trim off the last `.000Z` and replace with `+00:00`
    const formattedString = isoString.slice(0, -5).concat("+00:00");
    return formattedString;
  } catch (error) {
    console.error("#fDVQ4w Date conversion error", error);
  }
}

const createdRegEx = new RegExp("created: ([0-9]+)$", "m");
const updatedRegEx = new RegExp("updated: ([0-9]+)$", "m");

await new cliffy.Command()
  .name("d2folders")
  .version("0.1.0")
  .option("--dry-run", "Do not rename any files")
  .option("-d --debug", "Output debugging information")
  .arguments("<path:string>")
  .action(async (options, vaultPath: string) => {
    const pathGlob = path.join(vaultPath, "**/*.md");

    for await (const file of fs.expandGlob(pathGlob)) {
      if (!file.isFile || file.name.slice(-3) !== ".md") {
        continue;
      }

      const fileContents = await Deno.readTextFile(file.path);

      const createdMatches = fileContents.match(createdRegEx);
      const updatedMatches = fileContents.match(updatedRegEx);

      if (createdMatches === null || updatedMatches === null) {
        if (options.debug) {
          console.log(`#CGV9ev No matches in ${file.path}`);
        }

        continue;
      }

      const [, created] = createdMatches;
      const [, updated] = updatedMatches;

      const createdString = timestampToDate(created);
      const updatedString = timestampToDate(updated);

      if (
        typeof createdString === "undefined" ||
        typeof updatedString === "undefined"
      ) {
        console.error(`Failed on ${file.path}`);
        continue;
      }

      const createdYamlString = `created: ${createdString}`;
      const updatedYamlString = `updated: ${updatedString}`;

      const fileOutput = fileContents
        .replace(createdRegEx, createdYamlString)
        .replace(updatedRegEx, updatedYamlString);

      if (options.debug) {
        console.log(
          `${file.path}: updated was ${updated} and is now ${updatedString}; created was ${created} and is now ${createdString}`
        );
      }

      if (options.dryRun) {
        continue;
      }

      await Deno.writeTextFile(file.path, fileOutput);
    }
  })
  .parse();
