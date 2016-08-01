import { Dictionary } from '../lang';

import {
    ArtifactMetadata,
    DependencyConfiguration,
    DependencyResult,
    PlatformInfo,
    Project
} from './';

export interface PluginConstructor {
    new(): Plugin;
}

export type NullableDependencyResult = DependencyResult | undefined;

export interface Plugin {
    loadVariables?(project: Project): Dictionary<any> | Promise<Dictionary<any>>;
    resolveDependency?(config: DependencyConfiguration, project: Project, platform: PlatformInfo | undefined): NullableDependencyResult | Promise<NullableDependencyResult>;
    processArtifactMetadata?(metadata: ArtifactMetadata, project: Project): void | Promise<void>;
}
