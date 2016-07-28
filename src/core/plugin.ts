import {
    DependencyConfiguration,
    DependencyResult,
    DependencyContext
} from './';

export interface PluginConstructor {
    new(): Plugin;
}

export type NullableDependencyResult = DependencyResult | undefined;

export abstract class Plugin {
    abstract resolveDependency?(dependency: DependencyConfiguration, context: DependencyContext): NullableDependencyResult | Promise<NullableDependencyResult>;
}
