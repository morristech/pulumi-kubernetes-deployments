import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

export interface RedisArgs {
  namespace: pulumi.Input<string>,
  clusterEnabled?: pulumi.Input<boolean>,
  slaveCount?: pulumi.Input<number>,
  sentinelEnabled?: pulumi.Input<boolean>,
  persistenceEnabled?: pulumi.Input<boolean>,
  persistenceStorageClass?: pulumi.Input<string>,
  persistenceSize?: pulumi.Input<string>,
}

export class Redis extends pulumi.ComponentResource  {
  constructor(
    appName: string,
    args: RedisArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    
    super(appName, appName, {}, opts)

    const namespace = args.namespace || "redis"
    const persistenceEnabled = args.persistenceEnabled || true
    const persistenceStorageClass = args.persistenceStorageClass || ""
    const persistenceSize = args.persistenceSize || "1Gi"
    const clusterEnabled = args.clusterEnabled || false
    const slaveCount = args.slaveCount || 1
    const sentinelEnabled = args.sentinelEnabled || false

    const ns = new k8s.core.v1.Namespace(
      `${appName}-ns`,
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this },
    )    

    const redis = new k8s.helm.v3.Chart(
      appName,
      {
        chart: "redis",
        fetchOpts: {
          repo: 'https://kubernetes-charts.storage.googleapis.com',
        },
        namespace: namespace,
        values: {
          usePassword: false,
          cluster: {
            enabled: clusterEnabled,
            slaveCount: slaveCount
          },
          sentinel: {
            enabled: sentinelEnabled
          },
          master: {
            peristence: {
              enabled: persistenceEnabled,
              storageClass: persistenceStorageClass,
              size: persistenceSize
            },
          },
          slave: {
            peristence: {
              enabled: persistenceEnabled,
              storageClass: persistenceStorageClass,
              size: persistenceSize
            },
          },
          metrics: {
            enabled: true
          }
        }
      },
      {
        parent: this,
        dependsOn: [
          ns,
        ],
      },
    )           
  }
}