declare module 'extract-zip' {
    function extract(source: string, options: extract.Options, callback: extract.ExtractCallback): void;

    namespace extract {
        type EntryHandler = (entry: any) => void;
        type ExtractCallback = (error: Error) => void;

        interface Options {
            dir?: string;
            defaultDirMode?: number;
            defaultFileMode?: number;
            onEntry?: EntryHandler;
            strip?: number;
        }
    }

    export = extract;
}
