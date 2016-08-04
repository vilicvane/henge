import { Dictionary } from '../lang';

import {
    ArtifactMetadata,
    DependencyConfiguration,
    DependencyResult,
    PlatformInfo,
    Project
} from './';

export interface PluginConstructor {
    new(project: Project): Plugin;
}

export type NullableDependencyResult = DependencyResult | undefined;

export interface Plugin {
    loadVariables?(): Dictionary<any> | Promise<Dictionary<any>>;
    resolveDependency?(config: DependencyConfiguration, platform: PlatformInfo | undefined): NullableDependencyResult | Promise<NullableDependencyResult>;
    processArtifactMetadata?(metadata: ArtifactMetadata): void | Promise<void>;
}
