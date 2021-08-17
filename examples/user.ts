import DataMachine from "../index"

type User = {
    username: string,
    bio: string,
    password: string,
    age: number,
}

type ResolverOptions = {
    log?: boolean,
}

const UserMachine = new DataMachine<User, ResolverOptions>({
    resolvers: [{
        resolves: ["username", "bio"],
        resolve: () => {
            return Promise.resolve({
                username: 'jacob',
                bio: 'cool cool',
            });
        }
    },
    {
        resolves: ["password", "age", "username"],
        resolve: (options) => {
            if (options?.log) console.log("logging!");

            return Promise.resolve({
                username: 'jacob',
                password: '1234',
                age: 17,
            });
        }
    }
    ]
});

UserMachine.query({
    username: true,
    password: false,
}).then((user) => {
    console.log(user);
    return user
});