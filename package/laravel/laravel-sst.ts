/// <reference path="./../../.sst/platform/config.d.ts" />

import { Component } from "../../.sst/platform/src/components/component.js";
import { ComponentResourceOptions, Output, all, output } from "../../.sst/platform/node_modules/@pulumi/pulumi";
import { Input } from "../../.sst/platform/src/components/input.js";
import { Link } from "../../.sst/platform/src/components/link.js";
import { prepare, SsrSiteArgs } from "../../.sst/platform/src/components/aws/ssr-site";
import { ClusterArgs, ClusterServiceArgs } from "../../.sst/platform/src/components/aws/cluster.js";
import { Dns } from "../../.sst/platform/src/components/dns.js";

// duplicate from cluster.ts
type Port = `${number}/${"http" | "https" | "tcp" | "udp" | "tcp_udp" | "tls"}`;
type Ports = {listen: Port, forward: Port}[];
enum ImageType {
  Web = 'web',
  Worker = 'worker',
  Scheduler = 'scheduler',
}

export interface LaravelWebArgs extends ClusterServiceArgs {
  /**
   * Domain for the web layer.
   */
  domain?: Input<
    | string
    | {
      name: Input<string>;
      cert?: Input<string>;
      dns?: Input<false | (Dns & {})>;
    }
  >;
}

export interface LaravelArgs extends ClusterArgs {
  // dev?: false | DevArgs["dev"];
  path?: Input<string>;
  
  /**
  * If enabled, a container will be created to handle HTTP traffic.
  */
  web?: LaravelWebArgs;
  
  /**
  * If enabled, Laravel Scheduler will run on an isolated container.
  */
  scheduler?: Input<boolean | {
    link?: ClusterServiceArgs["link"],
  }>;
  
  /**
  * Queue settings.
  */
  queue?: {
    link?: ClusterServiceArgs["link"],

    /**
    * Running horizon?
    */
    horizon?: Input<boolean>;
  }

  /**
   * Config settings.
   */
  config: {
    php: Input<Number>;
    deployment?: Input<{
      migrate?: Input<boolean>;
      optimize?: Input<boolean>;
    }>;
  }
}

export class LaravelLLT extends Component {
  constructor(
    name: string,
    args: LaravelArgs,
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);
    
    const parent = this;
    const sitePath = args.path ?? '.';
    // const { sitePath, partition } = prepare(parent, args);
    // const dev = normalizeDev();
    // console.log('sitePath', sitePath);
    
    const cluster = new sst.aws.Cluster(`${name}-Cluster`, {
      vpc: args.vpc
    });
    
    if (args.web) {
      addWebService();
    }
    
    if (args.queue) {
      // addWorkerService();
    }
    
    if (args.scheduler) {
      addSchedulerService();
    }
    
    function addWebService() {
      cluster.addService(`${name}-Web`, {
        /**
         * Image passed or use our default provided image.
         */
        image: args.web && args.web.image ? args.web.image : getDefaultImage(ImageType.Web),

        scaling: args.web.scaling ?? null,
        
        // TODO: Check if it is really required to have the containerDefinitions

        // transform: {
        //   taskDefinition: {
        //     containerDefinitions: $jsonStringify([
        //       {
        //         name: "LaravelSst",
        //         image: "120266070056.dkr.ecr.us-east-1.amazonaws.com/sst-asset:LaravelSst",
        //         portMappings: [{
        //           containerPort: 8080,
        //           hostPort: 8080,
        //         }],
        //       }
        //     ])
        //   },
        // },
        
        public: args.web && args.web.public ? args.web.public : {
          domain: args.web?.domain,
          ports: getDefaultPublicPorts(),
        },
        
        dev: {
          command: `php ${sitePath}/artisan serve`,
        },
      });
    }
    
    function addSchedulerService() {
      cluster.addService(`${name}-Scheduler`, {
        /**
         * Image passed or use our default provided image.
         */
        image: args.web && args.web.image ? args.web.image : getDefaultImage(ImageType.Scheduler),
        
        // TODO: Check if it is really required to have the containerDefinitions

        // transform: {
        //   taskDefinition: {
        //     containerDefinitions: $jsonStringify([
        //       {
        //         name: "LaravelSst",
        //         image: "120266070056.dkr.ecr.us-east-1.amazonaws.com/sst-asset:LaravelSst",
        //         portMappings: [{
        //           containerPort: 8080,
        //           hostPort: 8080,
        //         }],
        //       }
        //     ])
        //   },
        // },
        
        dev: {
          command: `php ${sitePath}/artisan schedule:work`,
        },
      });
    }

    function addWorkerService() {
      cluster.addService(`${name}-Worker`, {
        /**
         * Image passed or use our default provided image.
         */
        image: args.web && args.web.image ? args.web.image : getDefaultImage(ImageType.Worker),
        
        dev: {
          command: `php ${sitePath}/artisan horizon`,
        },
      });
    }
    
    function getDefaultPublicPorts(): Ports {
      let ports;
      const forwardPort: Port = "8080/http";
      const portHttp: Port = "80/http";
      const portHttps: Port = "443/https";

      if (args.web?.domain) {
        ports = [
          { listen: portHttp, forward: forwardPort },
          { listen: portHttps, forward: forwardPort },
        ];
      } else {
        ports = [
          { listen: portHttp, forward: forwardPort },
        ];
      }

      return ports;
    }

    function getDefaultImage(imageType: ImageType, extraArgs: object = {}) {
      return {
        context: sitePath,
        dockerfile: `./package/laravel/Dockerfile.${imageType}`,
        args: {
          'PHP_VERSION': args.config.php.toString(),
          stage: "deploy",
          platform: "linux/amd64",
          ...extraArgs
        },
      };
    };
  }
}

const __pulumiType = "sst:aws:LaravelLLT";
// @ts-expect-error
LaravelLLT.__pulumiType = __pulumiType;