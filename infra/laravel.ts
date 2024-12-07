import { LaravelLLT } from "../package/laravel/laravel-sst";
const path = require('path');

const vpc = new sst.aws.Vpc("SSTVpc");
const redis = new sst.aws.Redis('RedisCluster', {
    vpc: vpc
});

const laravelComponent = new LaravelLLT('LaravelAppPoC', {
    path: './packages/app',
    vpc: vpc,

    config: {
        php: 8.2,
        deployment: {
            migrate: true,
            optimize: true,
        }
    },

    web: {
        // link: [redis],
        // octane: {
        //     server: 'frankenphp',
        // },
        domain: {
            name: 'sst.kirschbaum.dev',
            dns: sst.aws.dns(),
        },
        // scaling: {
        //     min: 1,
        //     max: 2,
        // },
    },

    scheduler: {
        // link: [redis],
    },
    
    queue: {
        horizon: true,
        // link: [redis],
    },

    // queue: {
    //     link: [redis],
    //     horizon: true,
    // },
});

// export const laravel = new sst.aws.Cluster("LaravelSstCluster", { vpc });

// const laravelService = laravel.addService("LaravelSst", {
//     image: {
//         context: "./packages/app",
//         args: {
//             stage: "deploy",
//             platform: "linux/amd64"
//         },
//     },

//     transform: {
//         taskDefinition: {
//             containerDefinitions: $jsonStringify([
//                 {
//                     name: "LaravelSst",
//                     image: "120266070056.dkr.ecr.us-east-1.amazonaws.com/sst-asset:LaravelSst",
//                     portMappings: [{
//                         containerPort: 8080,
//                         hostPort: 8080,
//                     }],
//                 }
//             ])
//         },
//     },
    
//     public: {
//         // domain: 'sst.kirschbaum.dev',
//         ports: [
//             { listen: "80/http", forward: "8080/http" },
//             // { listen: "443/https", forward: "80/http" },
//         ],
//     },

//     dev: {
//         command: "php artisan serve",
//     },
// });