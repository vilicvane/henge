import {
    ArtifactMetadata,
    DependencyConfiguration,
    DependencyResult,
    DependencyContext,
    Project
} from './';

export interface PluginConstructor {
    new(): Plugin;
}

export type NullableDependencyResult = DependencyResult | undefined;

export abstract class Plugin {
    loadVariables?(project: Project): Dictionary<any> | Promise<Dictionary<any>>;
    resolveDependency?(dependency: DependencyConfiguration, context: DependencyContext): NullableDependencyResult | Promise<NullableDependencyResult>;
    processArtifactMetadata?(metadata: ArtifactMetadata, project: Project): void | Promise<void>;
}
