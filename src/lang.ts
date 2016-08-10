export interface Dictionary<T> {
    [key: string]: T;
}

export type Resolvable<T> = T | Promise<T>;
