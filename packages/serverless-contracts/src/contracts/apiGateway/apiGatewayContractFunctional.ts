import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import isUndefined from 'lodash/isUndefined';
import omitBy from 'lodash/omitBy';

import { ConstrainedJSONSchema } from 'types/constrainedJSONSchema';
import { HttpMethod } from 'types/http';

import { ApiGatewayLambdaConfigType } from './lambdaTrigger';
import {
  ApiGatewayIntegrationType,
  ApiGatewayLambdaCompleteTriggerType,
  ApiGatewayLambdaSimpleTriggerType,
  ApiGatewayTriggerKey,
  InputSchemaType,
} from './types';

interface ApiGatewayContract<
  Path extends string = string,
  Method extends HttpMethod = HttpMethod,
  IntegrationType extends ApiGatewayIntegrationType = ApiGatewayIntegrationType,
  PathParametersSchema extends ConstrainedJSONSchema | undefined =
    | ConstrainedJSONSchema
    | undefined,
  QueryStringParametersSchema extends ConstrainedJSONSchema | undefined =
    | ConstrainedJSONSchema
    | undefined,
  HeadersSchema extends ConstrainedJSONSchema | undefined =
    | ConstrainedJSONSchema
    | undefined,
  BodySchema extends JSONSchema | undefined = JSONSchema | undefined,
  OutputSchema extends JSONSchema | undefined = JSONSchema | undefined,
> {
  contractType: 'apiGatewayContract';
  id: string;
  path: Path;
  method: Method;
  integrationType: IntegrationType;
  pathParametersSchema: PathParametersSchema;
  queryStringParametersSchema: QueryStringParametersSchema;
  headersSchema: HeadersSchema;
  bodySchema: BodySchema;
  outputSchema: OutputSchema;
}

const createApiGatewayContract = <
  Path extends string,
  Method extends HttpMethod,
  IntegrationType extends ApiGatewayIntegrationType,
  PathParametersSchema extends ConstrainedJSONSchema | undefined,
  QueryStringParametersSchema extends ConstrainedJSONSchema | undefined,
  HeadersSchema extends ConstrainedJSONSchema | undefined,
  BodySchema extends JSONSchema | undefined,
  OutputSchema extends JSONSchema | undefined,
>(contractProps: {
  id: string;
  path: Path;
  method: Method;
  integrationType: IntegrationType;
  pathParametersSchema: PathParametersSchema;
  queryStringParametersSchema: QueryStringParametersSchema;
  headersSchema: HeadersSchema;
  bodySchema: BodySchema;
  outputSchema: OutputSchema;
}): ApiGatewayContract<
  Path,
  Method,
  IntegrationType,
  PathParametersSchema,
  QueryStringParametersSchema,
  HeadersSchema,
  BodySchema,
  OutputSchema
> => ({
  contractType: 'apiGatewayContract',
  ...contractProps,
});

const myContract = createApiGatewayContract({
  id: 'testContract',
  path: '/users/{userId}',
  method: 'GET',
  integrationType: 'httpApi',
  pathParametersSchema: undefined,
  queryStringParametersSchema: undefined,
  headersSchema: undefined,
  bodySchema: { type: 'string' },
  outputSchema: {
    type: 'object',
    properties: { hello: { type: 'string' } },
    additionalProperties: false,
    required: ['hello'],
  },
} as const);

const getTrigger = <Contract extends ApiGatewayContract>(
  contract: Contract,
): ApiGatewayLambdaSimpleTriggerType<
  ApiGatewayTriggerKey<Contract['integrationType']>
> => {
  const key = contract.integrationType === 'httpApi' ? 'httpApi' : 'http';

  // @ts-ignore somehow the type inference does not work here
  return { [key]: { path: contract.path, method: contract.method } };
};

const trigger = getTrigger(myContract);

const getCompleteTrigger = <Contract extends ApiGatewayContract>(
  contract: Contract,
  additionalConfig: ApiGatewayLambdaConfigType<
    ApiGatewayTriggerKey<Contract['integrationType']>
  >,
): ApiGatewayLambdaCompleteTriggerType<
  ApiGatewayTriggerKey<Contract['integrationType']>
> => {
  const key = contract.integrationType === 'httpApi' ? 'httpApi' : 'http';

  // @ts-ignore somehow the type inference does not work here
  return {
    [key]: {
      ...additionalConfig,
      path: contract.path,
      method: contract.method,
    },
  };
};

const completeTrigger = getCompleteTrigger(myContract, {
  authorizer: undefined,
});

console.log(trigger);
console.log(completeTrigger);

const getInputSchema = <Contract extends ApiGatewayContract>(
  contract: Contract,
): InputSchemaType<
  Contract['pathParametersSchema'],
  Contract['queryStringParametersSchema'],
  Contract['headersSchema'],
  Contract['bodySchema'],
  true
> => {
  const properties = omitBy(
    {
      pathParameters: contract.pathParametersSchema,
      queryStringParameters: contract.queryStringParametersSchema,
      headers: contract.headersSchema,
      body: contract.bodySchema,
    } as const,
    isUndefined,
  );

  return {
    type: 'object',
    properties,
    // @ts-ignore here object.keys is not precise enough
    required: Object.keys(properties),
    additionalProperties: true,
  };
};

const inputSchema = getInputSchema(myContract);
console.log(inputSchema);

type OutputType<Contract extends ApiGatewayContract> =
  Contract['outputSchema'] extends JSONSchema
    ? FromSchema<Contract['outputSchema']>
    : undefined;

type HandlerType<Contract extends ApiGatewayContract> = (
  event: FromSchema<
    InputSchemaType<
      Contract['pathParametersSchema'],
      Contract['queryStringParametersSchema'],
      Contract['headersSchema'],
      Contract['bodySchema'],
      false
    >
  >,
) => Promise<OutputType<Contract>>;

const handler: HandlerType<typeof myContract> = async () => {
  await Promise.resolve();

  return { hello: '' };
};

console.log(handler);
