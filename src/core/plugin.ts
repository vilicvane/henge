import {
    Dictionary,
    Resolvable
} from '../lang';

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
    loadVariables?(): Resolvable<Dictionary<any>>;
    resolveDependency?(config: DependencyConfiguration, platform: PlatformInfo | undefined): Resolvable<NullableDependencyResult>;
    getDefaultArtifactId?(platform: PlatformInfo | undefined): Resolvable<string>;
    processArtifactMetadata?(metadata: ArtifactMetadata): Resolvable<void>;
}
