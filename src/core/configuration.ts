export interface PlatformSpecifier {
    multiplatform?: boolean;
    platform?: string;
    platforms?: string[];
}

export namespace Configuration {
    export function getMatchedPlatforms(specifier: PlatformSpecifier, platforms: string[]): string[] | undefined {
        return specifier.platforms || (
            specifier.platform ? [specifier.platform] : (
                specifier.multiplatform ? platforms : undefined
            )
        );
    }
}
