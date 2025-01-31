import { JSONSchema } from 'json-schema-to-ts';

import { HttpMethod } from 'types/http';

import { ApiGatewayLambdaConfigType } from './lambdaTrigger';

/**
 * The integration type: HTTP API or REST API
 * For more information, see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html
 */
export type ApiGatewayIntegrationType = 'httpApi' | 'restApi';
export type ApiGatewayKey = 'httpApi' | 'http';

/**
 * map between our integration types (httpApi vs restApi) and
 * serverless's triggers
 */
export type ApiGatewayTriggerKey<
  ApiGatewayIntegration extends ApiGatewayIntegrationType,
> = ApiGatewayIntegration extends 'httpApi' ? 'httpApi' : 'http';

/**
 * The type of an httpApi lambda trigger
 */
export type ApiGatewayLambdaSimpleTriggerType<Key extends ApiGatewayKey> = {
  [key in Key]: {
    path: string;
    method: string;
  };
};

export type ApiGatewayLambdaCompleteTriggerType<Key extends ApiGatewayKey> = {
  [key in Key]: {
    path: string;
    method: string;
  } & ApiGatewayLambdaConfigType<Key>;
};

/**
 * A helper type used to remove undefined keys from an interface
 *
 * For example:
 *
 * ```
 * interface A {
 *    foo: string;
 *    bar: undefined;
 * }
 *
 * type B = DefinedProperties<A>
 * ```
 *
 * then B is:
 * ```
 * {
 *    foo: string;
 * }
 * ```
 */
export type DefinedProperties<Type> = {
  [Property in keyof Type as Type[Property] extends undefined
    ? never
    : Property]: Type[Property];
};

/**
 * The intermediary type used to determine the input type of the lambda.
 *
 * Each property is either undefined (no schema) or is a JSONSchema.
 * Do not use this type directly, use it with `DefinedProperties`
 */
type AllInputProperties<
  PathParametersSchema extends JSONSchema | undefined,
  QueryStringParametersSchema extends JSONSchema | undefined,
  HeadersSchema extends JSONSchema | undefined,
  BodySchema extends JSONSchema | undefined,
> = {
  pathParameters: PathParametersSchema;
  queryStringParameters: QueryStringParametersSchema;
  headers: HeadersSchema;
  body: BodySchema;
};

/**
 * The intermediary type used to determine the contract type of the lambda.
 *
 * Each schema property is possibily undefined (no schema) or is a JSONSchema.
 * Do not use this type directly, use it with `DefinedProperties`
 */
type AllFullContractProperties<
  Path,
  Method,
  IntegrationType,
  PathParametersSchema extends JSONSchema | undefined,
  QueryStringParametersSchema extends JSONSchema | undefined,
  HeadersSchema extends JSONSchema | undefined,
  BodySchema extends JSONSchema | undefined,
  OutputSchema extends JSONSchema | undefined,
> = {
  contractId: { const: string };
  contractType: { const: IntegrationType };
  path: { const: Path };
  method: { const: Method };
  pathParameters: PathParametersSchema;
  queryStringParameters: QueryStringParametersSchema;
  headers: HeadersSchema;
  body: BodySchema;
  output: OutputSchema;
};

/**
 * Computed schema type of the input validation schema.
 *
 * Can be used with `FromSchema` to infer the type of the input event of the lambda
 */
export type InputSchemaType<
  PathParametersSchema extends JSONSchema | undefined,
  QueryStringParametersSchema extends JSONSchema | undefined,
  HeadersSchema extends JSONSchema | undefined,
  BodySchema extends JSONSchema | undefined,
  AllowAdditionalProperties extends boolean,
  DefinedInputProperties = DefinedProperties<
    AllInputProperties<
      PathParametersSchema,
      QueryStringParametersSchema,
      HeadersSchema,
      BodySchema
    >
  >,
> = {
  type: 'object';
  properties: DefinedInputProperties;
  required: Array<keyof DefinedInputProperties>;
  additionalProperties: AllowAdditionalProperties;
};

/**
 * Computed schema type of the input validation schema.
 *
 * Can be used with `FromSchema` to infer the type of the contract of the lambda
 */
export interface FullContractSchemaType<
  Path,
  Method,
  IntegrationType,
  PathParametersSchema extends JSONSchema | undefined,
  QueryStringParametersSchema extends JSONSchema | undefined,
  HeadersSchema extends JSONSchema | undefined,
  BodySchema extends JSONSchema | undefined,
  OutputSchema extends JSONSchema | undefined,
  DefinedFullContractProperties = DefinedProperties<
    AllFullContractProperties<
      Path,
      Method,
      IntegrationType,
      PathParametersSchema,
      QueryStringParametersSchema,
      HeadersSchema,
      BodySchema,
      OutputSchema
    >
  >,
> {
  type: 'object';
  properties: DefinedFullContractProperties;
  required: Array<keyof DefinedFullContractProperties>;
  additionalProperties: false;
}

/**
 * Computed request parameters. This enables the call to the contract to be type-safe
 */
export interface RequestParameters<BodyType> {
  method: HttpMethod;
  path: string;
  body?: BodyType;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}
