import axios from "axios";
import { execSync } from "child_process";
import dayjs from "dayjs-ext";
import delay from "delay";
import latestVersion from "latest-version";
import ora from "ora";
import prompts from "prompts";
import semver from "semver";

import { AbstractCommand } from "../command";

export class AppUpdate extends AbstractCommand {
    public async update() {
        const baseUrl = "https://api.github.com/repos/ArkEcosystem/core";

        if (this.options.network === "mainnet") {
            const latestRelease = await latestVersion("@arkecosystem/core");

            if (semver.gt(latestRelease, this.options.parent._version)) {
                return this.performUpdate(this.options.interactive, () => {
                    execSync("yarn global add @arkecosystem/core@latest");
                });
            }
        } else {
            const response = await axios.get(`https://api.github.com/repos/ArkEcosystem/core/commits`);
            const lastCommit = dayjs(response.data[0].commit.author.date);
            const currentCommit = dayjs(
                execSync("git log -1 --format=%cd")
                    .toString()
                    .trim(),
            );

            if (lastCommit.isAfter(currentCommit)) {
                return this.performUpdate(this.options.interactive, () => {
                    execSync("git reset --hard && git pull");
                });
            }
        }
    }

    private async performUpdate(interactive, callback) {
        const executeCallback = async execCallback => {
            const spinner = ora("Searching configuration...").start();

            execCallback();

            await delay(750);

            spinner.succeed("Published configuration!");
        };

        if (!interactive) {
            return executeCallback(callback);
        }

        const response = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "A new version is available, would you like to update now?",
                initial: true,
            },
        ]);

        if (response.confirm) {
            return executeCallback(callback);
        }
    }
}
