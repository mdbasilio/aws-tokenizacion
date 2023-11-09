import { SSM } from "@aws-sdk/client-ssm";
import * as yaml from "js-yaml";

export class BuildConfig {
    private nameStackApplication: string;
    private stage: string = "dev";

    constructor(nameStackApplication: string, stage: string) {
        this.nameStackApplication = nameStackApplication;
        this.stage = stage;
    }

    async getConfig(): Promise<any> {
        try {
            const nameEnvironmentSsm = `/${this.nameStackApplication}/${this.stage}`;
            console.log(`### Getting config from SSM Parameter store with name: " ${nameEnvironmentSsm} "`);
            const ssm = new SSM();
            let ssmResponse: any = await ssm.getParameter({
                Name: nameEnvironmentSsm
            });

            console.log("### ssmResponse.Parameter.value", ssmResponse);
            let unparsedEnv: any = yaml.load(ssmResponse.Parameter.Value);
            console.log("### unparsedEnv", unparsedEnv);

            const buildConfigResponse: any = {
                STAGE: this.stage, // by default
            };
            console.log(`### buildConfig OK ${buildConfigResponse}`);
            return buildConfigResponse;
        } catch (error) {
            console.log("error getConfig", error);
            console.log(`### I cant retrive the SSM Parameter from AWS`);
        }
    }

    ensureString(object: { [name: string]: any }, propName: string): string {
        if (!object[propName] || object[propName].trim().length === 0)
            throw new Error(propName + " does not exist or is empty");

        return object[propName];
    }
}