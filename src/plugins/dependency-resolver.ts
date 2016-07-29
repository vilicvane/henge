import { ExpectedError } from 'clime';
import * as fetch from 'node-fetch';

import {
    ArtifactMetadata,
    DependencyConfiguration,
    DependencyContext,
    NullableDependencyResult,
    Plugin
} from '../core';

export default class extends Plugin {
    private metadataCache = new Map<string, ArtifactMetadata>();

    async resolveDependency(config: any, context: DependencyContext): Promise<NullableDependencyResult> {
        let name = (config as DependencyConfiguration).name;
        let url = config.url as string | undefined;

        if (typeof url === 'string') {
            return { url };
        }

        let metadataUrl = config.metadata as string | undefined;

        if (metadataUrl) {
            let metadata = this.metadataCache.get(metadataUrl);

            if (!metadata) {
                let response = await fetch(metadataUrl);

                try {
                    metadata = await response.json<ArtifactMetadata>();
                } catch (error) {
                    throw new ExpectedError(`Error parsing metadata or dependency "${name}"`);
                }
            }

            for (let artifact of metadata.artifacts || []) {
                if (artifact.platform && artifact.platform !== context.platform) {
                    continue;
                }

                return {
                    url: metadataUrl.replace(/[^/]*$/, artifact.path)
                };
            }
        }

        return undefined;
    }
}
