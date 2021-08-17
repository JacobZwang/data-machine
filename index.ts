export type OptionsFlags<T> = {
    [P in keyof T]?: boolean;
};

export type Maybe<T> = T | undefined;

export type OptionsTypes<T, I extends T> = {
    [P in keyof T]: T[P] extends true ? I[P] : (T[P] extends boolean ? Maybe<I[P]> : never);
};

export type PropertiesArray<T> = (keyof T)[];

export interface Resolver<T, O> {
    resolves: PropertiesArray<T>;
    resolve(options?: O): Promise<Partial<T>>;
}

export type QueryOptions<ResolverOptions> = {
    /**
     * any extra data acquired during the query will be left in, defaults to false
    */
    returnSideEffects?: boolean,
    /**
     * options to be passed into every resolver
    */
    resolverOptions?: ResolverOptions
}

export class DataMachine<Data, ResolverOptions = undefined> {
    #resolvers: Array<Resolver<Data, ResolverOptions>>;
    #promises: Array<Resolver<Data, ResolverOptions>>;

    constructor(options: { resolvers: Array<Resolver<Data, ResolverOptions>>; }) {
        this.#resolvers = options.resolvers;
        this.#promises = [];
    }

    //@ts-ignore
    query<E extends OptionsFlags<Data>>(selectors: E, options?: QueryOptions<ResolverOptions>): Promise<OptionsTypes<E, Data>>
    async query(selectors: OptionsFlags<Data>, options?: QueryOptions<ResolverOptions>): Promise<OptionsTypes<typeof selectors, Data>> {
        let result: Partial<Data> = {};

        const resolvers = this.#resolvers;
        const promises = this.#promises;

        // determine which resolvers needed
        Object.entries(selectors).forEach(([key, value]) => {
            let foundResolver = false;

            if (value) {
                resolvers.forEach((resolver) => {
                    //@ts-ignore
                    if (resolver.resolves.includes(key) && !promises.includes(resolver) && !foundResolver) {
                        promises.push(resolver);
                        foundResolver = true;
                    }
                });
            }
        });

        // resolve all the resolvers
        await Promise.all(
            promises.map((resolver) => {
                resolver.resolve(options?.resolverOptions).then((data) => {
                    result = {
                        ...result,
                        ...data
                    };
                })
            })
        );

        if (!options?.returnSideEffects) {
            //filter out properties not requested
            Object.keys(result).forEach(key => {
                //@ts-ignore
                if (selectors[key] === undefined) {
                    //@ts-ignore
                    delete result[key];
                }
            })
        }

        // always filter out properties marked as false
        Object.keys(result).forEach(key => {
            //@ts-ignore
            if (selectors[key] === false) {
                //@ts-ignore
                delete result[key];
            }
        })

        return result as OptionsTypes<typeof selectors, Data>;
    }

}

export default DataMachine;