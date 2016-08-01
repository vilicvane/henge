import { ExpectedError } from 'clime';
import * as fetch from 'node-fetch';

import {
    ArtifactMetadata,
    DependencyConfiguration,
    NullableDependencyResult,
    PlatformInfo,
    Plugin,
    Project
} from '../core';

export default class implements Plugin {
    private metadataCache = new Map<string, ArtifactMetadata>();

    async resolveDependency(config: any, project: Project, platform: PlatformInfo | undefined): Promise<NullableDependencyResult> {
        let name = (config as DependencyConfiguration).name;
        let url = config.url as string | undefined;

        if (typeof url === 'string') {
            return {
                url
            };
        }

        let metadataUrl = config.metadata as string | undefined;

        if (typeof metadataUrl === 'string') {
            return {
                metadata: true,
                url: metadataUrl
            };
        }

        return undefined;
    }
}
