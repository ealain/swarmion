import * as AWS from 'aws-sdk';
import Serverless from 'serverless';

import { RemoteServerlessContractSchemas } from 'types/serviceOptions';

import { buildPreviousDeploymentArtifactDirectoryName } from './artifactDirectory';
import { COMPILED_CONTRACTS_FILE_NAME, CONTRACTS_VERSION } from './constants';
import { getLatestDeployedTimestamp } from './getLatestDeployedTimestamp';

export const listRemoteContractSchemas = async (
  serverless: Serverless,
): Promise<RemoteServerlessContractSchemas | undefined> => {
  const provider = serverless.getProvider('aws');
  const latestDeployedTimestamp = await getLatestDeployedTimestamp(provider);

  if (latestDeployedTimestamp === undefined) return;

  const previousArtifactDirectoryName =
    buildPreviousDeploymentArtifactDirectoryName(
      'serverless',
      serverless.service.getServiceName(),
      serverless.service.provider.stage,
      latestDeployedTimestamp,
    );

  const bucketName = await provider.getServerlessDeploymentBucketName();

  const params = {
    Bucket: bucketName,
    Key: `${previousArtifactDirectoryName}/${COMPILED_CONTRACTS_FILE_NAME}`,
  };

  const { Body: remoteContractsBuffer } = (await provider.request(
    'S3',
    'getObject',
    params,
  )) as AWS.S3.GetObjectOutput;

  if (remoteContractsBuffer === undefined) {
    return {
      provides: {},
      consumes: {},
      gitCommit: '',
      contractsVersion: CONTRACTS_VERSION,
    };
  }

  const contractSchemas = JSON.parse(
    remoteContractsBuffer.toString(),
  ) as RemoteServerlessContractSchemas;

  return contractSchemas;
};
