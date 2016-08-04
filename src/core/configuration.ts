import { Project } from './';

import { Dictionary } from '../lang';

export interface PackageData {
    name: string;
    version: string;
}

export interface PlatformSpecifier {
    multiplatform?: boolean;
    platform?: string;
    platforms?: string[];
}

export interface DependencyPlatformSpecifier extends PlatformSpecifier {
    kit?: boolean;
}

export interface TaskDescriptor {
    name: string;
    cwd?: string;
    env?: Dictionary<string>;
    args?: string[];
}

export interface CommandDescriptor {
    name: string;
    cwd?: string;
    env?: Dictionary<string>;
    args?: string[];
}

export type TaskConfiguration = string | TaskDescriptor;
export type CommandConfiguration = string | CommandDescriptor;

export interface ProcedureConfiguration {
    description?: string;
    task?: TaskConfiguration;
    command?: CommandConfiguration;
    multiplatform?: boolean;
    platform?: string;
    platforms?: string[];
}

export interface FileMappingDescriptor {
    pattern: string;
    baseDir?: string;
    package?: string;
    path?: string;
    platform?: string;
    platforms?: string[];
}

export type FileMappingConfiguration = string | FileMappingDescriptor;

export interface ArtifactMetadataItem {
    id: string;
    platform?: string;
    path: string;
}

export interface ArtifactMetadata {
    name: string;
    version: string;
    artifacts: ArtifactMetadataItem[];
    [key: string]: any;
}

export interface ArtifactConfiguration {
    id?: string;
    baseDir?: string;
    files: FileMappingConfiguration[];
}

export interface HostConfiguration {
    platform?: string;
}

export interface ProjectConfiguration {
    name?: string;
    version?: string;
    distDir?: string;
    dependencyDir?: string;
    plugins?: string[];
    host?: HostConfiguration;
    platform?: PlatformConfiguration;
    platforms?: PlatformConfiguration[] | string;
    dependencies?: DependencyConfiguration[];
    procedures?: ProcedureConfiguration[];
    artifact: ArtifactConfiguration;
}

export interface PlatformInfo {
    name: string;
    env?: Dictionary<string>;
    variables?: Dictionary<any>;
}

export type PlatformConfiguration = string | PlatformInfo;

export interface DependencyConfiguration extends DependencyPlatformSpecifier {
    name: string;
}

export namespace Configuration {
    export interface MatchedPlatformsResult {
        platforms: PlatformInfo[];
        specified: boolean;
    }

    export function getMatchedDependencyPlatforms(specifier: DependencyPlatformSpecifier, platforms: PlatformInfo[], hostPlatform: string): MatchedPlatformsResult {
        if (specifier.kit) {
            let platformNames = specifier.platforms ?
                specifier.platforms :
                [specifier.platform || hostPlatform];

            platforms = platformNames.map(name => {
                return {
                    name
                };
            });
        }

        return getMatchedPlatforms(specifier, platforms);
    }

    export function getMatchedPlatforms(specifier: PlatformSpecifier, platforms: PlatformInfo[]): MatchedPlatformsResult {
        let platformNames = specifier.platforms ?
            specifier.platforms :
            specifier.platform && [specifier.platform];

        let specified: boolean;

        if (platformNames) {
            let platformNameSet = new Set(platformNames);

            platforms = platforms.filter(platform => platformNameSet.has(platform.name));

            specified = true;
        } else if (specifier.multiplatform) {
            platforms = platforms.concat();
            specified = true;
        } else {
            platforms = [
                {
                    name: process.platform
                }
            ];
            specified = false;
        }

        return {
            platforms,
            specified
        };
    }
}
